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
import { LocalGitWorkspaceProvider, WorkspaceProvider } from "../providers/workspace.js";
import { computeContinuityDiff, CurrentWorkspaceState } from "./diff.js";
import { randomUUID } from "node:crypto";
import path from "node:path";

export interface ContinuityEngineOptions {
  memoryProvider: MemoryProvider;
  modelProvider?: ModelProvider;
  workspaceProvider?: WorkspaceProvider;
}

export interface ParkWorkspaceOptions {
  workspacePath: string;
  goalText?: string;
  stateSummary?: string;
  actorId?: string;
  threadId?: string;
  activeHypothesis?: string;
  nextActionDescription?: string;
  assumptions?: Array<{ id?: string; statement: string; target_artifact?: string }>;
  decisions?: Array<{ id?: string; description: string; rationale: string; assumptions?: string[] }>;
}

export interface ResumeWorkspaceOptions {
  threadId: string;
  workspacePath: string;
}

/**
 * ThreadKeeper Continuity Engine
 * Pure domain service managing checkpoints, diffs, resume briefs, and handoffs.
 * Zero external AWS or UI dependencies.
 */
export class ContinuityEngine {
  private memory: MemoryProvider;
  private model?: ModelProvider;
  private workspace: WorkspaceProvider;

  constructor(options: ContinuityEngineOptions) {
    this.memory = options.memoryProvider;
    this.model = options.modelProvider;
    this.workspace = options.workspaceProvider || new LocalGitWorkspaceProvider();
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
   * REAL PARK: Inspects a real local Git repository and creates an evidence-backed checkpoint
   */
  async parkWorkspace(options: ParkWorkspaceOptions): Promise<CognitiveCheckpoint> {
    const snapshot = await this.workspace.captureSnapshot(options.workspacePath);
    const repoName = path.basename(snapshot.repository_root);
    const threadId = options.threadId || `thread-${repoName}`;
    const actorId = options.actorId || "developer";
    const checkpointId = `cp-${randomUUID().slice(0, 8)}`;

    const goalText =
      options.goalText || `Continue work on ${repoName} (${snapshot.branch})`;

    const stateSummary =
      options.stateSummary ||
      (snapshot.is_clean
        ? `Clean working tree on branch '${snapshot.branch}' at commit ${snapshot.head_commit.short_hash}: "${snapshot.head_commit.message}".`
        : `Active work in progress on branch '${snapshot.branch}' with ${snapshot.file_statuses.length} modified file(s).`);

    const evidenceList = [...snapshot.evidence];

    // Build decisions
    const decisions: Decision[] = [];
    if (options.decisions && options.decisions.length > 0) {
      options.decisions.forEach((d, idx) => {
        decisions.push({
          id: d.id || `dec-${idx + 1}`,
          description: d.description,
          rationale: d.rationale,
          status: "active",
          assumptions: d.assumptions || ["asm-git-branch"],
          evidence_ids: ["ev-git-status"]
        });
      });
    } else if (!snapshot.is_clean) {
      const topFile = snapshot.file_statuses[0]?.path || "workspace";
      decisions.push({
        id: "dec-active-work",
        description: `Working tree modified in ${topFile} reflects active investigation`,
        rationale: "Uncommitted local changes observed in Git working tree",
        status: "active",
        assumptions: ["asm-git-branch"],
        evidence_ids: ["ev-git-status"]
      });
    } else {
      decisions.push({
        id: "dec-clean-base",
        description: `Current base is commit ${snapshot.head_commit.short_hash}`,
        rationale: `Working tree is clean; HEAD message: "${snapshot.head_commit.message}"`,
        status: "active",
        assumptions: ["asm-git-branch"],
        evidence_ids: ["ev-git-head"]
      });
    }

    // Build assumptions
    const assumptions = [];
    if (options.assumptions && options.assumptions.length > 0) {
      options.assumptions.forEach((a, idx) => {
        assumptions.push({
          id: a.id || `asm-${idx + 1}`,
          statement: a.statement,
          status: "active" as const,
          target_artifact_id: a.target_artifact ? `art-${a.target_artifact.replace(/[/\\.]/g, "-")}` : undefined,
          evidence_ids: ["ev-git-branch"]
        });
      });
    } else {
      const topArtifact = snapshot.artifacts[0];
      assumptions.push({
        id: "asm-git-branch",
        statement: `Active branch '${snapshot.branch}' and HEAD ${snapshot.head_commit.short_hash} remain the baseline for current task`,
        status: "active" as const,
        target_artifact_id: topArtifact?.id,
        evidence_ids: ["ev-git-branch"]
      });
    }

    // Build next actions
    const nextActions = [];
    if (options.nextActionDescription) {
      nextActions.push({
        id: "na-user-next",
        description: options.nextActionDescription,
        priority: "immediate" as const,
        rationale: "Explicit next action specified by user prior to interruption.",
        target_artifact: snapshot.file_statuses[0]?.path,
        evidence_ids: ["ev-git-status"]
      });
    } else if (!snapshot.is_clean) {
      const topFile = snapshot.file_statuses[0].path;
      nextActions.push({
        id: "na-inspect-dirty",
        description: `Review uncommitted changes in ${topFile} and verify tests`,
        priority: "immediate" as const,
        rationale: "Resume active work on uncommitted local modifications.",
        target_artifact: topFile,
        evidence_ids: ["ev-git-status"]
      });
    } else {
      nextActions.push({
        id: "na-clean-continue",
        description: `Proceed with implementation on branch ${snapshot.branch}`,
        priority: "immediate" as const,
        rationale: "Clean working tree on HEAD commit.",
        evidence_ids: ["ev-git-head"]
      });
    }

    const checkpoint: CognitiveCheckpoint = {
      checkpoint_id: checkpointId,
      thread_id: threadId,
      actor_id: actorId,
      created_at: snapshot.captured_at,
      goal: {
        text: goalText,
        success_criteria: [],
        evidence_ids: ["ev-git-head"]
      },
      state_summary: stateSummary,
      work_context: {
        project_name: repoName,
        workspace_root: snapshot.repository_root,
        branch: snapshot.branch,
        active_file: snapshot.file_statuses[0]?.path
      },
      evidence: evidenceList,
      attempts: [],
      decisions,
      artifacts: snapshot.artifacts,
      assumptions,
      blockers: [],
      open_questions: [],
      next_actions: nextActions,
      uncertainties: []
    };

    return this.park(checkpoint);
  }

  /**
   * REAL RESUME: Inspects the real local Git repository, compares against stored checkpoint,
   * detects changes, stale assumptions, and returns a grounded resume brief.
   */
  async resumeWorkspace(options: ResumeWorkspaceOptions): Promise<ResumeBrief> {
    const snapshot = await this.workspace.captureSnapshot(options.workspacePath);
    const currentState: CurrentWorkspaceState = {
      timestamp: snapshot.captured_at,
      git_branch: snapshot.branch,
      git_status: snapshot.is_clean
        ? "clean"
        : snapshot.file_statuses.map((f) => `${f.staged ? "S" : "U"} ${f.path}`).join("; "),
      artifacts: snapshot.artifacts,
      evidence: snapshot.evidence
    };
    return this.resume(options.threadId, currentState);
  }

  /**
   * REAL COMPARE: Inspects current Git state and compares against a specific historical checkpoint
   */
  async compareWorkspace(checkpointId: string, workspacePath: string): Promise<ContinuityDiff> {
    const snapshot = await this.workspace.captureSnapshot(workspacePath);
    const currentState: CurrentWorkspaceState = {
      timestamp: snapshot.captured_at,
      git_branch: snapshot.branch,
      git_status: snapshot.is_clean ? "clean" : "dirty",
      artifacts: snapshot.artifacts,
      evidence: snapshot.evidence
    };
    return this.compareCurrentState(checkpointId, currentState);
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
