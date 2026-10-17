import {
  CognitiveCheckpoint,
  ContinuityDiff,
  Decision,
  HandoffPacket,
  ResumeBrief
} from "../domain/types.js";
import { CheckpointNotFoundError } from "../domain/errors.js";
import { validateCheckpoint, validateHandoffPacket, validateResumeBrief } from "../domain/validation.js";
import { MemoryProvider } from "../providers/memory.js";
import { ModelProvider } from "../providers/model.js";
import { computeContinuityDiff, CurrentWorkspaceState } from "./diff.js";

export interface ContinuityEngineOptions {
  memoryProvider: MemoryProvider;
  modelProvider?: ModelProvider;
}

/**
 * ThreadKeeper Continuity Engine
 * Pure domain service managing checkpoints, diffs, resume briefs, and handoffs.
 * Zero external AWS or UI dependencies.
 */
export class ContinuityEngine {
  private memory: MemoryProvider;
  private model?: ModelProvider;

  constructor(options: ContinuityEngineOptions) {
    this.memory = options.memoryProvider;
    this.model = options.modelProvider;
  }

  /**
   * PARK: Captures and persists a structured cognitive checkpoint.
   */
  async park(checkpoint: CognitiveCheckpoint): Promise<CognitiveCheckpoint> {
    const validated = validateCheckpoint(checkpoint);
    await this.memory.saveCheckpoint(validated);
    return validated;
  }

  /**
   * RESUME: Reconstructs state, computes continuity diff against current workspace reality,
   * and produces a 30-second voice brief plus structured drill-down.
   */
  async resume(threadId: string, currentState: CurrentWorkspaceState): Promise<ResumeBrief> {
    const checkpoint = await this.memory.getLatestCheckpoint(threadId);
    if (!checkpoint) {
      throw new CheckpointNotFoundError(`No checkpoint found for thread '${threadId}'`);
    }

    const diff = computeContinuityDiff(checkpoint, currentState);
    const lastDecision: Decision | undefined =
      checkpoint.decisions.length > 0
        ? checkpoint.decisions[checkpoint.decisions.length - 1]
        : undefined;

    // Generate concise 30-second voice brief
    const voice_summary = this.generateVoiceSummary(checkpoint, diff);

    const brief: ResumeBrief = {
      thread_id: threadId,
      checkpoint_id: checkpoint.checkpoint_id,
      voice_summary,
      original_goal: checkpoint.goal,
      continuity_diff: diff,
      grounded_next_action: diff.recommended_next_action,
      last_decision: lastDecision,
      stale_assumption_count: diff.stale_assumptions.length,
      changed_artifact_count: diff.changed.length
    };

    return validateResumeBrief(brief);
  }

  /**
   * COMPARE: Compare a specific checkpoint against current workspace state
   */
  async compareCurrentState(
    checkpointId: string,
    currentState: CurrentWorkspaceState
  ): Promise<ContinuityDiff> {
    const checkpoint = await this.memory.getCheckpoint(checkpointId);
    if (!checkpoint) {
      throw new CheckpointNotFoundError(checkpointId);
    }
    return computeContinuityDiff(checkpoint, currentState);
  }

  /**
   * FIND DECISION: Search for decisions and their evidence provenance
   */
  async findDecision(
    threadId: string,
    query: string
  ): Promise<{ decisions: Decision[]; cited_evidence: string[] }> {
    const history = await this.memory.listThreadHistory(threadId);
    const matchedDecisions: Decision[] = [];
    const citedEvidenceIds = new Set<string>();

    const q = query.toLowerCase();
    for (const cp of history) {
      for (const dec of cp.decisions) {
        if (dec.description.toLowerCase().includes(q) || dec.rationale.toLowerCase().includes(q)) {
          matchedDecisions.push(dec);
          for (const evId of dec.evidence_ids) {
            citedEvidenceIds.add(evId);
          }
        }
      }
    }

    return {
      decisions: matchedDecisions,
      cited_evidence: Array.from(citedEvidenceIds)
    };
  }

  /**
   * FIND UNFINISHED WORK: Aggregates unresolved goals, blockers, open questions, and next actions
   */
  async findUnfinishedWork(threadId: string): Promise<{
    goal?: string;
    blockers: string[];
    open_questions: string[];
    pending_actions: string[];
  }> {
    const latest = await this.memory.getLatestCheckpoint(threadId);
    if (!latest) {
      throw new CheckpointNotFoundError(threadId);
    }

    return {
      goal: latest.goal.text,
      blockers: latest.blockers.map((b) => `${b.description} (${b.severity})`),
      open_questions: latest.open_questions,
      pending_actions: latest.next_actions.map((a) => a.description)
    };
  }

  /**
   * CREATE HANDOFF: Produces a compact, structured packet transferring context without losing reasoning
   */
  async createHandoff(
    threadId: string,
    currentState?: CurrentWorkspaceState
  ): Promise<HandoffPacket> {
    const checkpoint = await this.memory.getLatestCheckpoint(threadId);
    if (!checkpoint) {
      throw new CheckpointNotFoundError(threadId);
    }

    let changedDescriptions: string[] = [];
    let nextExperiment = checkpoint.next_actions[0];

    if (currentState) {
      const diff = computeContinuityDiff(checkpoint, currentState);
      changedDescriptions = diff.changed.map((c) => `${c.path}: ${c.diff_summary}`);
      nextExperiment = diff.recommended_next_action;
    }

    const failedAttempts = checkpoint.attempts
      .filter((a) => a.status === "failed")
      .map((a) => `Do not repeat failed attempt: ${a.description} (${a.error_details || "failed"})`);

    const packet: HandoffPacket = {
      format_version: "1.0.0",
      generated_at: new Date().toISOString(),
      thread_id: threadId,
      checkpoint_id: checkpoint.checkpoint_id,
      objective: checkpoint.goal.text,
      current_state: checkpoint.state_summary,
      decisions: checkpoint.decisions.map((d) => ({
        decision: d.description,
        why: d.rationale,
        evidence_ids: d.evidence_ids
      })),
      known_evidence: checkpoint.evidence.map((e) => ({
        id: e.id,
        type: e.type,
        fact: `${e.source}: ${e.content}`
      })),
      already_tried: checkpoint.attempts.map((a) => ({
        attempt: a.description,
        outcome: `${a.status}: ${a.learnings || a.error_details || "completed"}`
      })),
      do_not_repeat: failedAttempts,
      changed_since_checkpoint: changedDescriptions,
      open_questions: checkpoint.open_questions,
      next_experiment: nextExperiment,
      success_condition: checkpoint.goal.success_criteria.join("; ") || "Primary objective satisfied",
      relevant_artifacts: checkpoint.artifacts.map((art) => ({
        path: art.path_or_uri,
        version: art.version_or_hash,
        status: changedDescriptions.some((c) => c.includes(art.path_or_uri)) ? "modified" : "intact"
      }))
    };

    return validateHandoffPacket(packet);
  }

  /**
   * Generates a 30-second conversational voice summary suitable for Alexa+
   */
  private generateVoiceSummary(checkpoint: CognitiveCheckpoint, diff: ContinuityDiff): string {
    const goalText = checkpoint.goal.text;
    const hasChanges = diff.changed.length > 0;
    const hasStale = diff.stale_assumptions.length > 0;

    let summary = `You were working on: "${goalText}". `;

    if (checkpoint.decisions.length > 0) {
      summary += `Your last decision was: "${checkpoint.decisions[checkpoint.decisions.length - 1].description}". `;
    }

    if (hasChanges || hasStale) {
      summary += `While you were away, ${diff.changed.length} file(s) changed, `;
      if (hasStale) {
        summary += `and your assumption regarding "${diff.stale_assumptions[0].statement}" is now stale. `;
      }
      summary += `Recommended next move: ${diff.recommended_next_action.description}`;
    } else {
      summary += `All context is intact. Ready to continue: ${diff.recommended_next_action.description}`;
    }

    return summary;
  }
}
