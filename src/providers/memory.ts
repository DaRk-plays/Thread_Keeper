import { CognitiveCheckpoint } from "../domain/types.js";
import { validateCheckpoint } from "../domain/validation.js";

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
