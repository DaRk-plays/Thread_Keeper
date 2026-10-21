import type { DocumentType } from "@smithy/types";
import {
  BedrockAgentCoreClient,
  CreateEventCommand,
  ListEventsCommand,
  GetEventCommand,
  DeleteEventCommand,
  ListActorsCommand,
  ListSessionsCommand
} from "@aws-sdk/client-bedrock-agentcore";
import { CognitiveCheckpoint } from "../domain/types.js";
import { validateCheckpoint } from "../domain/validation.js";
import { MemoryConfigurationError, MemoryOperationError } from "../domain/errors.js";

export interface MemoryQuery {
  thread_id?: string;
  actor_id?: string;
  query_text?: string;
  limit?: number;
}

/**
 * Pluggable Memory Provider interface.
 * Implemented locally for Foundation Milestone 1; allows AgentCore Memory to be added later
 * without modifying ThreadKeeper Core.
 */
export interface MemoryProvider {
  readonly name?: string;
  saveCheckpoint(checkpoint: CognitiveCheckpoint): Promise<void>;
  getCheckpoint(checkpointId: string): Promise<CognitiveCheckpoint | null>;
  getLatestCheckpoint(threadId: string): Promise<CognitiveCheckpoint | null>;
  listThreadHistory(threadId: string, limit?: number): Promise<CognitiveCheckpoint[]>;
  searchMemory(query: MemoryQuery): Promise<CognitiveCheckpoint[]>;
  clear(threadId?: string): Promise<void>;
}

/**
 * Deterministic local in-memory implementation of MemoryProvider.
 */
export class LocalMemoryProvider implements MemoryProvider {
  readonly name = "local";
  private checkpoints: Map<string, CognitiveCheckpoint> = new Map();
  private threadIndex: Map<string, string[]> = new Map(); // threadId -> checkpointId[] sorted chronologically

  async saveCheckpoint(checkpoint: CognitiveCheckpoint): Promise<void> {
    // Validate schema and evidence integrity before storing
    const validated = validateCheckpoint(checkpoint);
    this.checkpoints.set(validated.checkpoint_id, validated);

    const threadList = this.threadIndex.get(validated.thread_id) || [];
    // If not already in list, append
    if (!threadList.includes(validated.checkpoint_id)) {
      threadList.push(validated.checkpoint_id);
      this.threadIndex.set(validated.thread_id, threadList);
    }
  }

  async getCheckpoint(checkpointId: string): Promise<CognitiveCheckpoint | null> {
    const cp = this.checkpoints.get(checkpointId);
    return cp ? JSON.parse(JSON.stringify(cp)) : null;
  }

  async getLatestCheckpoint(threadId: string): Promise<CognitiveCheckpoint | null> {
    const list = this.threadIndex.get(threadId);
    if (!list || list.length === 0) {
      return null;
    }
    const latestId = list[list.length - 1];
    return this.getCheckpoint(latestId);
  }

  async listThreadHistory(threadId: string, limit = 20): Promise<CognitiveCheckpoint[]> {
    const list = this.threadIndex.get(threadId);
    if (!list) return [];
    
    // Return most recent first up to limit
    const slice = list.slice(-limit).reverse();
    return slice
      .map((id) => this.checkpoints.get(id))
      .filter((cp): cp is CognitiveCheckpoint => cp !== undefined)
      .map((cp) => JSON.parse(JSON.stringify(cp)));
  }

  async searchMemory(query: MemoryQuery): Promise<CognitiveCheckpoint[]> {
    let results = Array.from(this.checkpoints.values());

    if (query.thread_id) {
      results = results.filter((cp) => cp.thread_id === query.thread_id);
    }

    if (query.actor_id) {
      results = results.filter((cp) => cp.actor_id === query.actor_id);
    }

    if (query.query_text) {
      const q = query.query_text.toLowerCase();
      results = results.filter((cp) => {
        const goalMatch = cp.goal.text.toLowerCase().includes(q);
        const summaryMatch = cp.state_summary.toLowerCase().includes(q);
        const decisionMatch = cp.decisions.some(
          (d) => d.description.toLowerCase().includes(q) || d.rationale.toLowerCase().includes(q)
        );
        const assumptionMatch = cp.assumptions.some((a) => a.statement.toLowerCase().includes(q));
        const artifactMatch = cp.artifacts.some((art) => art.path_or_uri.toLowerCase().includes(q));
        return goalMatch || summaryMatch || decisionMatch || assumptionMatch || artifactMatch;
      });
    }

    const limit = query.limit || 20;
    return results.slice(0, limit).map((cp) => JSON.parse(JSON.stringify(cp)));
  }

  async clear(threadId?: string): Promise<void> {
    if (threadId) {
      const ids = this.threadIndex.get(threadId) || [];
      for (const id of ids) {
        this.checkpoints.delete(id);
      }
      this.threadIndex.delete(threadId);
    } else {
      this.checkpoints.clear();
      this.threadIndex.clear();
    }
  }
}

export interface AgentCoreMemoryOptions {
  memoryId?: string;
  region?: string;
  profile?: string;
  defaultActorId?: string;
  client?: BedrockAgentCoreClient;
}

/**
 * AWS Bedrock AgentCore Memory Provider.
 * Stores cognitive checkpoints persistently in AgentCore session events.
 * Survives local application and process restarts.
 */
export class AgentCoreMemoryProvider implements MemoryProvider {
  readonly name = "agentcore";
  readonly memoryId: string;
  readonly region: string;
  readonly profile: string;
  readonly defaultActorId: string;
  private client?: BedrockAgentCoreClient;

  // In-process caches to optimize repeated lookups
  private checkpointLocationCache: Map<string, { actorId: string; sessionId: string; eventId?: string }> = new Map();
  private threadIndexCache: Map<string, string[]> = new Map();

  constructor(options?: AgentCoreMemoryOptions) {
    const memoryId = options?.memoryId || process.env.THREADKEEPER_AGENTCORE_MEMORY_ID;
    if (!memoryId) {
      throw new MemoryConfigurationError(
        "AgentCore memory ID is required. Set THREADKEEPER_AGENTCORE_MEMORY_ID or pass memoryId in options."
      );
    }

    this.memoryId = memoryId;
    this.region = options?.region || process.env.AWS_REGION || "ap-southeast-2";
    this.profile = options?.profile || process.env.AWS_PROFILE || "threadkeeper";
    this.defaultActorId = options?.defaultActorId || "developer";
    this.client = options?.client;
  }

  private getClient(): BedrockAgentCoreClient {
    if (this.client) {
      return this.client;
    }
    try {
      this.client = new BedrockAgentCoreClient({
        region: this.region,
        profile: this.profile
      });
      return this.client;
    } catch (err) {
      throw new MemoryConfigurationError(
        `Failed to initialize AWS Bedrock AgentCore client for region '${this.region}' and profile '${this.profile}': ${(err as Error).message}`,
        err
      );
    }
  }

  private extractCheckpointFromEvent(event: unknown): CognitiveCheckpoint | null {
    if (!event || typeof event !== "object") return null;
    const ev = event as { payload?: Array<{ json?: { content?: unknown } }> };
    if (!ev.payload || !Array.isArray(ev.payload)) return null;

    for (const item of ev.payload) {
      if (item.json?.content) {
        try {
          const raw = item.json.content;
          const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
          return validateCheckpoint(parsed as CognitiveCheckpoint);
        } catch {
          // Payload was not a valid CognitiveCheckpoint, continue searching
        }
      }
    }
    return null;
  }

  private async discoverActors(): Promise<string[]> {
    const client = this.getClient();
    const actors = new Set<string>();
    actors.add(this.defaultActorId);

    // Add actors from local cache
    for (const loc of this.checkpointLocationCache.values()) {
      actors.add(loc.actorId);
    }

    try {
      const res = await client.send(new ListActorsCommand({ memoryId: this.memoryId }));
      for (const a of res.actorSummaries || []) {
        if (a.actorId) {
          actors.add(a.actorId);
        }
      }
    } catch {
      // If ListActors is restricted or unavailable, proceed with cached and default actors
    }

    return Array.from(actors);
  }

  private async discoverSessions(actorId: string): Promise<string[]> {
    const client = this.getClient();
    const sessions = new Set<string>();

    // Add sessions from local cache
    for (const [, loc] of this.checkpointLocationCache.entries()) {
      if (loc.actorId === actorId) {
        sessions.add(loc.sessionId);
      }
    }
    for (const sessionId of this.threadIndexCache.keys()) {
      sessions.add(sessionId);
    }

    try {
      const res = await client.send(
        new ListSessionsCommand({
          memoryId: this.memoryId,
          actorId
        })
      );
      for (const s of res.sessionSummaries || []) {
        if (s.sessionId) {
          sessions.add(s.sessionId);
        }
      }
    } catch {
      // Fall back to cached sessions
    }

    return Array.from(sessions);
  }

  async saveCheckpoint(checkpoint: CognitiveCheckpoint): Promise<void> {
    const validated = validateCheckpoint(checkpoint);
    const client = this.getClient();
    const actorId = validated.actor_id || this.defaultActorId;
    const sessionId = validated.thread_id;

    try {
      const command = new CreateEventCommand({
        memoryId: this.memoryId,
        actorId,
        sessionId,
        eventTimestamp: new Date(validated.created_at),
        payload: [
          {
            json: {
              content: validated as unknown as DocumentType
            }
          }
        ],
        metadata: {
          checkpoint_id: { stringValue: validated.checkpoint_id },
          thread_id: { stringValue: validated.thread_id },
          actor_id: { stringValue: actorId }
        }
      });

      const response = await client.send(command);
      const eventId = response.event?.eventId;

      // Update in-memory caches
      this.checkpointLocationCache.set(validated.checkpoint_id, {
        actorId,
        sessionId,
        eventId
      });

      const list = this.threadIndexCache.get(sessionId) || [];
      if (!list.includes(validated.checkpoint_id)) {
        list.push(validated.checkpoint_id);
        this.threadIndexCache.set(sessionId, list);
      }
    } catch (err) {
      throw new MemoryOperationError(
        `Failed to save checkpoint '${validated.checkpoint_id}' to AgentCore Memory '${this.memoryId}': ${(err as Error).message}`,
        err
      );
    }
  }

  async getCheckpoint(checkpointId: string): Promise<CognitiveCheckpoint | null> {
    const client = this.getClient();

    // 1. Check in-process location cache
    const cachedLoc = this.checkpointLocationCache.get(checkpointId);
    if (cachedLoc) {
      if (cachedLoc.eventId) {
        try {
          const res = await client.send(
            new GetEventCommand({
              memoryId: this.memoryId,
              sessionId: cachedLoc.sessionId,
              actorId: cachedLoc.actorId,
              eventId: cachedLoc.eventId
            })
          );
          if (res.event) {
            const cp = this.extractCheckpointFromEvent(res.event);
            if (cp && cp.checkpoint_id === checkpointId) {
              return cp;
            }
          }
        } catch {
          // Fall back to scanning session history
        }
      }

      // If eventId fetch was not definitive, search within that thread
      const threadHistory = await this.listThreadHistory(cachedLoc.sessionId, 50);
      const matched = threadHistory.find((c) => c.checkpoint_id === checkpointId);
      if (matched) return matched;
    }

    // 2. Discover across all actors and sessions (e.g. after process restart)
    const actors = await this.discoverActors();
    for (const actorId of actors) {
      const sessions = await this.discoverSessions(actorId);
      for (const sessionId of sessions) {
        const history = await this.listThreadHistory(sessionId, 50);
        const found = history.find((c) => c.checkpoint_id === checkpointId);
        if (found) {
          this.checkpointLocationCache.set(checkpointId, {
            actorId,
            sessionId
          });
          return found;
        }
      }
    }

    return null;
  }

  async getLatestCheckpoint(threadId: string): Promise<CognitiveCheckpoint | null> {
    const history = await this.listThreadHistory(threadId, 1);
    return history.length > 0 ? history[0] : null;
  }

  async listThreadHistory(threadId: string, limit = 20): Promise<CognitiveCheckpoint[]> {
    const client = this.getClient();
    const actors = await this.discoverActors();
    const allCheckpoints: CognitiveCheckpoint[] = [];

    for (const actorId of actors) {
      try {
        const response = await client.send(
          new ListEventsCommand({
            memoryId: this.memoryId,
            sessionId: threadId,
            actorId,
            includePayloads: true,
            maxResults: Math.min(Math.max(limit * 2, 20), 100)
          })
        );

        for (const ev of response.events || []) {
          const cp = this.extractCheckpointFromEvent(ev);
          if (cp) {
            allCheckpoints.push(cp);
            this.checkpointLocationCache.set(cp.checkpoint_id, {
              actorId,
              sessionId: threadId,
              eventId: ev.eventId
            });
          }
        }
      } catch {
        // Continue querying remaining actors
      }
    }

    // Sort chronologically descending (most recent first)
    allCheckpoints.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Deduplicate by checkpoint_id
    const seen = new Set<string>();
    const deduplicated: CognitiveCheckpoint[] = [];
    for (const cp of allCheckpoints) {
      if (!seen.has(cp.checkpoint_id)) {
        seen.add(cp.checkpoint_id);
        deduplicated.push(cp);
      }
    }

    // Update threadIndexCache
    const orderedIds = [...deduplicated].reverse().map((c) => c.checkpoint_id);
    this.threadIndexCache.set(threadId, orderedIds);

    return deduplicated.slice(0, limit);
  }

  async searchMemory(query: MemoryQuery): Promise<CognitiveCheckpoint[]> {
    let candidates: CognitiveCheckpoint[] = [];

    if (query.thread_id) {
      candidates = await this.listThreadHistory(query.thread_id, 100);
    } else {
      // Scan all known sessions across all actors
      const actors = await this.discoverActors();
      const allSessions = new Set<string>();

      for (const actorId of actors) {
        const sessions = await this.discoverSessions(actorId);
        for (const s of sessions) allSessions.add(s);
      }

      for (const sessionId of allSessions) {
        const threadList = await this.listThreadHistory(sessionId, 50);
        candidates.push(...threadList);
      }
    }

    if (query.actor_id) {
      candidates = candidates.filter((cp) => cp.actor_id === query.actor_id);
    }

    if (query.query_text) {
      const q = query.query_text.toLowerCase();
      candidates = candidates.filter((cp) => {
        const goalMatch = cp.goal.text.toLowerCase().includes(q);
        const summaryMatch = cp.state_summary.toLowerCase().includes(q);
        const decisionMatch = cp.decisions.some(
          (d) => d.description.toLowerCase().includes(q) || d.rationale.toLowerCase().includes(q)
        );
        const assumptionMatch = cp.assumptions.some((a) => a.statement.toLowerCase().includes(q));
        const artifactMatch = cp.artifacts.some((art) => art.path_or_uri.toLowerCase().includes(q));
        return goalMatch || summaryMatch || decisionMatch || assumptionMatch || artifactMatch;
      });
    }

    // Deduplicate
    const seen = new Set<string>();
    const deduplicated: CognitiveCheckpoint[] = [];
    for (const cp of candidates) {
      if (!seen.has(cp.checkpoint_id)) {
        seen.add(cp.checkpoint_id);
        deduplicated.push(cp);
      }
    }

    const limit = query.limit || 20;
    return deduplicated.slice(0, limit);
  }

  async clear(threadId?: string): Promise<void> {
    const client = this.getClient();
    const actors = await this.discoverActors();

    if (threadId) {
      for (const actorId of actors) {
        try {
          const listRes = await client.send(
            new ListEventsCommand({
              memoryId: this.memoryId,
              sessionId: threadId,
              actorId,
              includePayloads: false
            })
          );

          for (const ev of listRes.events || []) {
            if (ev.eventId) {
              await client.send(
                new DeleteEventCommand({
                  memoryId: this.memoryId,
                  sessionId: threadId,
                  actorId,
                  eventId: ev.eventId
                })
              );
            }
          }
        } catch {
          // Handle cleanup gracefully
        }
      }
      this.threadIndexCache.delete(threadId);
      for (const [cpId, loc] of this.checkpointLocationCache.entries()) {
        if (loc.sessionId === threadId) {
          this.checkpointLocationCache.delete(cpId);
        }
      }
    } else {
      for (const actorId of actors) {
        const sessions = await this.discoverSessions(actorId);
        for (const sessionId of sessions) {
          try {
            const listRes = await client.send(
              new ListEventsCommand({
                memoryId: this.memoryId,
                sessionId,
                actorId,
                includePayloads: false
              })
            );

            for (const ev of listRes.events || []) {
              if (ev.eventId) {
                await client.send(
                  new DeleteEventCommand({
                    memoryId: this.memoryId,
                    sessionId,
                    actorId,
                    eventId: ev.eventId
                  })
                );
              }
            }
          } catch {
            // Handle cleanup gracefully
          }
        }
      }
      this.threadIndexCache.clear();
      this.checkpointLocationCache.clear();
    }
  }
}

/**
 * Factory function for creating memory providers.
 * Respects THREADKEEPER_MEMORY_PROVIDER env variable:
 * - 'local' (default) -> LocalMemoryProvider
 * - 'agentcore' -> AgentCoreMemoryProvider
 */
export function createMemoryProvider(options?: AgentCoreMemoryOptions): MemoryProvider {
  const providerType = (process.env.THREADKEEPER_MEMORY_PROVIDER || "local").toLowerCase();

  switch (providerType) {
    case "local":
      return new LocalMemoryProvider();

    case "agentcore": {
      const memoryId = options?.memoryId || process.env.THREADKEEPER_AGENTCORE_MEMORY_ID;
      if (!memoryId) {
        throw new MemoryConfigurationError(
          "THREADKEEPER_MEMORY_PROVIDER is set to 'agentcore', but THREADKEEPER_AGENTCORE_MEMORY_ID is not configured."
        );
      }
      return new AgentCoreMemoryProvider({
        ...options,
        memoryId
      });
    }

    default:
      throw new MemoryConfigurationError(
        `Unsupported THREADKEEPER_MEMORY_PROVIDER '${providerType}'. Supported providers are: 'local', 'agentcore'.`
      );
  }
}
