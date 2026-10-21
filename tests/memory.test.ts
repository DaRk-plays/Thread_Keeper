import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  LocalMemoryProvider,
  AgentCoreMemoryProvider,
  createMemoryProvider
} from "../src/providers/memory.js";
import { getSeededCheckpoint } from "../src/scenario/seeded.js";
import { MemoryConfigurationError, MemoryOperationError } from "../src/domain/errors.js";
import type { BedrockAgentCoreClient } from "@aws-sdk/client-bedrock-agentcore";
import {
  CreateEventCommand,
  ListEventsCommand,
  GetEventCommand,
  DeleteEventCommand,
  ListActorsCommand,
  ListSessionsCommand
} from "@aws-sdk/client-bedrock-agentcore";

describe("LocalMemoryProvider", () => {
  let memory: LocalMemoryProvider;

  beforeEach(() => {
    memory = new LocalMemoryProvider();
  });

  it("saves and retrieves a checkpoint by ID", async () => {
    const cp = getSeededCheckpoint();
    await memory.saveCheckpoint(cp);

    const retrieved = await memory.getCheckpoint(cp.checkpoint_id);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.checkpoint_id).toBe(cp.checkpoint_id);
    expect(retrieved?.goal.text).toBe(cp.goal.text);
  });

  it("returns null when retrieving non-existent checkpoint", async () => {
    const retrieved = await memory.getCheckpoint("cp-non-existent");
    expect(retrieved).toBeNull();
  });

  it("retrieves the latest checkpoint for a thread in chronological order", async () => {
    const cp1 = getSeededCheckpoint();
    const cp2 = {
      ...getSeededCheckpoint(),
      checkpoint_id: "cp-invoice-002",
      state_summary: "Second stage of investigation"
    };

    await memory.saveCheckpoint(cp1);
    await memory.saveCheckpoint(cp2);

    const latest = await memory.getLatestCheckpoint(cp1.thread_id);
    expect(latest?.checkpoint_id).toBe("cp-invoice-002");
    expect(latest?.state_summary).toBe("Second stage of investigation");
  });

  it("lists thread history with limit ordering (most recent first)", async () => {
    const cp1 = { ...getSeededCheckpoint(), checkpoint_id: "cp-1" };
    const cp2 = { ...getSeededCheckpoint(), checkpoint_id: "cp-2" };
    const cp3 = { ...getSeededCheckpoint(), checkpoint_id: "cp-3" };

    await memory.saveCheckpoint(cp1);
    await memory.saveCheckpoint(cp2);
    await memory.saveCheckpoint(cp3);

    const history = await memory.listThreadHistory(cp1.thread_id, 2);
    expect(history.length).toBe(2);
    expect(history[0].checkpoint_id).toBe("cp-3");
    expect(history[1].checkpoint_id).toBe("cp-2");
  });

  it("searches memory by keyword across goals and decisions", async () => {
    const cp = getSeededCheckpoint();
    await memory.saveCheckpoint(cp);

    const matchGoal = await memory.searchMemory({ query_text: "invoice filtering" });
    expect(matchGoal.length).toBe(1);

    const matchDecision = await memory.searchMemory({ query_text: "backend" });
    expect(matchDecision.length).toBe(1);

    const noMatch = await memory.searchMemory({ query_text: "quantum computing" });
    expect(noMatch.length).toBe(0);
  });

  it("clears memory for a specific thread or all threads", async () => {
    const cp1 = { ...getSeededCheckpoint(), checkpoint_id: "cp-1", thread_id: "thread-a" };
    const cp2 = { ...getSeededCheckpoint(), checkpoint_id: "cp-2", thread_id: "thread-b" };

    await memory.saveCheckpoint(cp1);
    await memory.saveCheckpoint(cp2);

    await memory.clear("thread-a");
    expect(await memory.getCheckpoint("cp-1")).toBeNull();
    expect(await memory.getCheckpoint("cp-2")).not.toBeNull();

    await memory.clear();
    expect(await memory.getCheckpoint("cp-2")).toBeNull();
  });
});

describe("createMemoryProvider Factory", () => {
  const originalEnv = process.env.THREADKEEPER_MEMORY_PROVIDER;
  const originalId = process.env.THREADKEEPER_AGENTCORE_MEMORY_ID;

  beforeEach(() => {
    if (originalEnv !== undefined) {
      process.env.THREADKEEPER_MEMORY_PROVIDER = originalEnv;
    } else {
      delete process.env.THREADKEEPER_MEMORY_PROVIDER;
    }

    if (originalId !== undefined) {
      process.env.THREADKEEPER_AGENTCORE_MEMORY_ID = originalId;
    } else {
      delete process.env.THREADKEEPER_AGENTCORE_MEMORY_ID;
    }
  });

  it("defaults to LocalMemoryProvider when environment variable is unset", () => {
    delete process.env.THREADKEEPER_MEMORY_PROVIDER;
    const provider = createMemoryProvider();
    expect(provider).toBeInstanceOf(LocalMemoryProvider);
    expect(provider.name).toBe("local");
  });

  it("returns LocalMemoryProvider when THREADKEEPER_MEMORY_PROVIDER=local", () => {
    process.env.THREADKEEPER_MEMORY_PROVIDER = "local";
    const provider = createMemoryProvider();
    expect(provider).toBeInstanceOf(LocalMemoryProvider);
  });

  it("throws MemoryConfigurationError if THREADKEEPER_MEMORY_PROVIDER=agentcore but memory ID is missing", () => {
    process.env.THREADKEEPER_MEMORY_PROVIDER = "agentcore";
    delete process.env.THREADKEEPER_AGENTCORE_MEMORY_ID;
    expect(() => createMemoryProvider()).toThrow(MemoryConfigurationError);
  });

  it("returns AgentCoreMemoryProvider when configured properly", () => {
    process.env.THREADKEEPER_MEMORY_PROVIDER = "agentcore";
    process.env.THREADKEEPER_AGENTCORE_MEMORY_ID = "mem-test-1234567890";
    const provider = createMemoryProvider();
    expect(provider).toBeInstanceOf(AgentCoreMemoryProvider);
    expect(provider.name).toBe("agentcore");
  });

  it("throws MemoryConfigurationError on unknown provider type", () => {
    process.env.THREADKEEPER_MEMORY_PROVIDER = "redis-cluster";
    expect(() => createMemoryProvider()).toThrow(MemoryConfigurationError);
  });
});

describe("AgentCoreMemoryProvider (Milestone 3B)", () => {
  const memoryId = "mem-mock-1234567890";

  function createMockAgentCoreClient(eventsStore: Map<string, Array<{ eventId: string; timestamp: Date; payload: unknown; metadata: unknown }>> = new Map()) {
    let eventCounter = 1;

    const mockClient = {
      send: vi.fn(async (command: { input?: Record<string, unknown> } | unknown) => {
        if (command instanceof CreateEventCommand) {
          const input = command.input;
          const key = `${input.actorId}:${input.sessionId}`;
          const list = eventsStore.get(key) || [];
          const eventId = `000000${eventCounter++}#test`;
          list.push({
            eventId,
            timestamp: input.eventTimestamp || new Date(),
            payload: input.payload,
            metadata: input.metadata
          });
          eventsStore.set(key, list);
          return {
            event: {
              memoryId: input.memoryId,
              actorId: input.actorId,
              sessionId: input.sessionId,
              eventId,
              eventTimestamp: input.eventTimestamp,
              payload: input.payload,
              metadata: input.metadata
            }
          };
        }

        if (command instanceof ListEventsCommand) {
          const input = command.input;
          const key = `${input.actorId}:${input.sessionId}`;
          const list = eventsStore.get(key) || [];
          return {
            events: list.map((e) => ({
              memoryId: input.memoryId,
              actorId: input.actorId,
              sessionId: input.sessionId,
              eventId: e.eventId,
              eventTimestamp: e.timestamp,
              payload: input.includePayloads ? e.payload : undefined,
              metadata: e.metadata
            }))
          };
        }

        if (command instanceof GetEventCommand) {
          const input = command.input;
          const key = `${input.actorId}:${input.sessionId}`;
          const list = eventsStore.get(key) || [];
          const found = list.find((e) => e.eventId === input.eventId);
          if (found) {
            return {
              event: {
                memoryId: input.memoryId,
                actorId: input.actorId,
                sessionId: input.sessionId,
                eventId: found.eventId,
                eventTimestamp: found.timestamp,
                payload: found.payload,
                metadata: found.metadata
              }
            };
          }
          throw new Error("ResourceNotFoundException");
        }

        if (command instanceof ListActorsCommand) {
          const actors = new Set<string>();
          for (const key of eventsStore.keys()) {
            const [actor] = key.split(":");
            actors.add(actor);
          }
          return {
            actorSummaries: Array.from(actors).map((actorId) => ({ actorId }))
          };
        }

        if (command instanceof ListSessionsCommand) {
          const input = command.input;
          const sessions = new Set<string>();
          for (const key of eventsStore.keys()) {
            const [actor, session] = key.split(":");
            if (actor === input.actorId) {
              sessions.add(session);
            }
          }
          return {
            sessionSummaries: Array.from(sessions).map((sessionId) => ({
              sessionId,
              actorId: input.actorId
            }))
          };
        }

        if (command instanceof DeleteEventCommand) {
          const input = command.input;
          const key = `${input.actorId}:${input.sessionId}`;
          const list = eventsStore.get(key) || [];
          eventsStore.set(key, list.filter((e) => e.eventId !== input.eventId));
          return { eventId: input.eventId };
        }

        return {};
      })
    } as unknown as BedrockAgentCoreClient;

    return { mockClient, eventsStore };
  }

  it("stores a canonical checkpoint as an AgentCore event with lossless recovery", async () => {
    const { mockClient } = createMockAgentCoreClient();
    const provider = new AgentCoreMemoryProvider({
      memoryId,
      client: mockClient
    });

    const cp = getSeededCheckpoint();
    await provider.saveCheckpoint(cp);

    // Retrieve checkpoint
    const retrieved = await provider.getCheckpoint(cp.checkpoint_id);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.checkpoint_id).toBe(cp.checkpoint_id);
    expect(retrieved?.goal.text).toBe(cp.goal.text);
    expect(retrieved?.state_summary).toBe(cp.state_summary);
    expect(retrieved?.decisions.length).toBe(cp.decisions.length);
    expect(retrieved?.assumptions.length).toBe(cp.assumptions.length);
    expect(retrieved?.artifacts.length).toBe(cp.artifacts.length);
    expect(retrieved?.work_context.git_branch).toBe(cp.work_context.git_branch);
    expect(retrieved?.work_context.git_commit_sha).toBe(cp.work_context.git_commit_sha);
  });

  it("reconstructs checkpoint after process death (simulated by fresh provider instance)", async () => {
    const { mockClient } = createMockAgentCoreClient();
    const originalProvider = new AgentCoreMemoryProvider({
      memoryId,
      client: mockClient
    });

    const cp = getSeededCheckpoint();
    await originalProvider.saveCheckpoint(cp);

    // Create a new provider instance with zero local cache
    const resurrectedProvider = new AgentCoreMemoryProvider({
      memoryId,
      client: mockClient
    });

    const retrieved = await resurrectedProvider.getCheckpoint(cp.checkpoint_id);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.checkpoint_id).toBe(cp.checkpoint_id);
    expect(retrieved?.goal.text).toBe(cp.goal.text);
  });

  it("retrieves the latest checkpoint for a thread", async () => {
    const { mockClient } = createMockAgentCoreClient();
    const provider = new AgentCoreMemoryProvider({
      memoryId,
      client: mockClient
    });

    const cp1 = { ...getSeededCheckpoint(), created_at: "2026-10-21T00:00:00.000Z" };
    const cp2 = {
      ...getSeededCheckpoint(),
      checkpoint_id: "cp-stage-2",
      created_at: "2026-10-21T01:00:00.000Z",
      state_summary: "Updated stage"
    };

    await provider.saveCheckpoint(cp1);
    await provider.saveCheckpoint(cp2);

    const latest = await provider.getLatestCheckpoint(cp1.thread_id);
    expect(latest?.checkpoint_id).toBe("cp-stage-2");
    expect(latest?.state_summary).toBe("Updated stage");
  });

  it("lists thread history sorted chronologically descending", async () => {
    const { mockClient } = createMockAgentCoreClient();
    const provider = new AgentCoreMemoryProvider({
      memoryId,
      client: mockClient
    });

    const cp1 = { ...getSeededCheckpoint(), checkpoint_id: "cp-1", created_at: "2026-10-21T00:00:00.000Z" };
    const cp2 = { ...getSeededCheckpoint(), checkpoint_id: "cp-2", created_at: "2026-10-21T01:00:00.000Z" };
    const cp3 = { ...getSeededCheckpoint(), checkpoint_id: "cp-3", created_at: "2026-10-21T02:00:00.000Z" };

    await provider.saveCheckpoint(cp1);
    await provider.saveCheckpoint(cp2);
    await provider.saveCheckpoint(cp3);

    const history = await provider.listThreadHistory(cp1.thread_id, 2);
    expect(history.length).toBe(2);
    expect(history[0].checkpoint_id).toBe("cp-3");
    expect(history[1].checkpoint_id).toBe("cp-2");
  });

  it("searches memory by query keyword across decisions and goals", async () => {
    const { mockClient } = createMockAgentCoreClient();
    const provider = new AgentCoreMemoryProvider({
      memoryId,
      client: mockClient
    });

    const cp = getSeededCheckpoint();
    await provider.saveCheckpoint(cp);

    const matchGoal = await provider.searchMemory({ query_text: "invoice filtering" });
    expect(matchGoal.length).toBe(1);

    const matchDecision = await provider.searchMemory({ query_text: "backend" });
    expect(matchDecision.length).toBe(1);

    const noMatch = await provider.searchMemory({ query_text: "distributed blockchain" });
    expect(noMatch.length).toBe(0);
  });

  it("clears events in memory", async () => {
    const { mockClient, eventsStore } = createMockAgentCoreClient();
    const provider = new AgentCoreMemoryProvider({
      memoryId,
      client: mockClient
    });

    const cp = getSeededCheckpoint();
    await provider.saveCheckpoint(cp);
    expect(eventsStore.size).toBeGreaterThan(0);

    await provider.clear(cp.thread_id);
    const retrieved = await provider.getCheckpoint(cp.checkpoint_id);
    expect(retrieved).toBeNull();
  });

  it("throws MemoryOperationError when AWS API call fails", async () => {
    const failingClient = {
      send: vi.fn(async () => {
        throw new Error("AccessDeniedException: Unauthorized");
      })
    } as unknown as BedrockAgentCoreClient;

    const provider = new AgentCoreMemoryProvider({
      memoryId,
      client: failingClient
    });

    const cp = getSeededCheckpoint();
    await expect(provider.saveCheckpoint(cp)).rejects.toThrow(MemoryOperationError);
  });
});
