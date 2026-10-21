import { z } from "zod";
import {
  GroundedReasoningResponseSchema
} from "./grounding.js";

export * from "./grounding.js";

/**
 * Epistemic status of an evidence item
 */
export const EpistemicStatusSchema = z.enum([
  "observed",  // Directly observed from system/workspace/user
  "derived",   // Computed deterministically from observed evidence
  "inferred",  // LLM/heuristic deduction with cited evidence
  "unknown"    // Inconclusive / unverified
]);
export type EpistemicStatus = z.infer<typeof EpistemicStatusSchema>;

/**
 * Evidence item preserving provenance
 */
export const EvidenceSchema = z.object({
  id: z.string(),
  type: z.enum([
    "file_hash",
    "git_status",
    "test_result",
    "api_response",
    "user_statement",
    "runtime_log",
    "code_snippet"
  ]),
  source: z.string(), // e.g. "services/invoice.ts", "terminal:npm test", "git:branch"
  content: z.string(), // Exact observed fact or structured summary
  captured_at: z.string(), // ISO-8601
  epistemic_status: EpistemicStatusSchema.default("observed"),
  metadata: z.record(z.string(), z.unknown()).optional()
});
export type Evidence = z.infer<typeof EvidenceSchema>;

/**
 * Goal definition
 */
export const GoalSchema = z.object({
  text: z.string(),
  success_criteria: z.array(z.string()).default([]),
  evidence_ids: z.array(z.string()).default([])
});
export type Goal = z.infer<typeof GoalSchema>;

/**
 * Attempt definition (answers: What did I try? What failed?)
 */
export const AttemptSchema = z.object({
  id: z.string(),
  description: z.string(),
  status: z.enum(["succeeded", "failed", "in_progress", "abandoned"]),
  timestamp: z.string(),
  error_details: z.string().optional(),
  learnings: z.string().optional(),
  evidence_ids: z.array(z.string()).default([])
});
export type Attempt = z.infer<typeof AttemptSchema>;

/**
 * Decision definition (answers: What did I decide and why?)
 */
export const DecisionSchema = z.object({
  id: z.string(),
  description: z.string(),
  rationale: z.string(),
  status: z.enum(["active", "superseded", "needs_review"]).default("active"),
  assumptions: z.array(z.string()).default([]), // Assumption IDs or statements
  evidence_ids: z.array(z.string()).default([])
});
export type Decision = z.infer<typeof DecisionSchema>;

/**
 * Blocker definition (answers: What was blocking me?)
 */
export const BlockerSchema = z.object({
  id: z.string(),
  description: z.string(),
  severity: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  open_questions: z.array(z.string()).default([]),
  evidence_ids: z.array(z.string()).default([])
});
export type Blocker = z.infer<typeof BlockerSchema>;

/**
 * Artifact representation (file, config, test, PR, etc.)
 */
export const ArtifactSchema = z.object({
  id: z.string(),
  path_or_uri: z.string(),
  type: z.enum(["code", "config", "test", "doc", "api_payload", "build_artifact"]),
  version_or_hash: z.string(),
  summary: z.string().optional(),
  last_modified: z.string().optional()
});
export type Artifact = z.infer<typeof ArtifactSchema>;

/**
 * Assumption definition (crucial for Continuity Diff staleness detection)
 */
export const AssumptionSchema = z.object({
  id: z.string(),
  statement: z.string(),
  status: z.enum(["active", "stale", "invalidated", "validated"]).default("active"),
  target_artifact_id: z.string().optional(),
  evidence_ids: z.array(z.string()).default([]),
  invalidated_by_evidence_id: z.string().optional()
});
export type Assumption = z.infer<typeof AssumptionSchema>;

/**
 * Grounded Next Action
 */
export const NextActionSchema = z.object({
  id: z.string(),
  description: z.string(),
  priority: z.enum(["immediate", "next", "later"]).default("immediate"),
  rationale: z.string(),
  target_artifact: z.string().optional(),
  evidence_ids: z.array(z.string()).default([])
});
export type NextAction = z.infer<typeof NextActionSchema>;

/**
 * Work Context metadata
 */
export const WorkContextSchema = z.object({
  project_name: z.string(),
  workspace_root: z.string(),
  branch: z.string(),
  active_file: z.string().optional(),
  environment_details: z.record(z.string(), z.string()).optional()
});
export type WorkContext = z.infer<typeof WorkContextSchema>;

/**
 * Complete Cognitive Checkpoint
 * The fundamental primitive: Goal -> Evidence -> Attempt -> Decision -> Artifact -> Blocker -> Next Action
 */
export const CognitiveCheckpointSchema = z.object({
  checkpoint_id: z.string(),
  thread_id: z.string(),
  actor_id: z.string(),
  created_at: z.string(), // ISO-8601
  goal: GoalSchema,
  state_summary: z.string(),
  work_context: WorkContextSchema,
  evidence: z.array(EvidenceSchema).default([]),
  attempts: z.array(AttemptSchema).default([]),
  decisions: z.array(DecisionSchema).default([]),
  artifacts: z.array(ArtifactSchema).default([]),
  assumptions: z.array(AssumptionSchema).default([]),
  blockers: z.array(BlockerSchema).default([]),
  open_questions: z.array(z.string()).default([]),
  next_actions: z.array(NextActionSchema).default([]),
  uncertainties: z.array(z.string()).default([])
});
export type CognitiveCheckpoint = z.infer<typeof CognitiveCheckpointSchema>;

/**
 * Continuity Diff
 * Compares Checkpoint THEN against current reality NOW
 */
export const ContinuityDiffSchema = z.object({
  checkpoint_id: z.string(),
  thread_id: z.string(),
  evaluated_at: z.string(),
  still_valid: z.array(z.object({
    id: z.string(),
    type: z.enum(["decision", "assumption", "artifact", "goal"]),
    summary: z.string()
  })),
  changed: z.array(z.object({
    artifact_id: z.string(),
    path: z.string(),
    then_version: z.string(),
    now_version: z.string(),
    diff_summary: z.string()
  })),
  stale_assumptions: z.array(z.object({
    assumption_id: z.string(),
    statement: z.string(),
    reason_stale: z.string(),
    invalidating_evidence: EvidenceSchema.optional(),
    affected_decision_ids: z.array(z.string()).default([])
  })),
  new_evidence: z.array(EvidenceSchema),
  uncertain: z.array(z.string()),
  recommended_next_action: NextActionSchema
});
export type ContinuityDiff = z.infer<typeof ContinuityDiffSchema>;

/**
 * Resume Brief
 * High-level voice summary for Alexa+ plus rich structured drill-down
 */
export const ResumeBriefSchema = z.object({
  thread_id: z.string(),
  checkpoint_id: z.string(),
  voice_summary: z.string(), // 30-second concise voice brief
  original_goal: GoalSchema,
  continuity_diff: ContinuityDiffSchema,
  grounded_next_action: NextActionSchema,
  last_decision: DecisionSchema.optional(),
  stale_assumption_count: z.number(),
  changed_artifact_count: z.number(),
  semantic_interpretation: GroundedReasoningResponseSchema.optional(),
  model_usage: z.object({
    model_id: z.string(),
    input_tokens: z.number(),
    output_tokens: z.number(),
    latency_ms: z.number().optional()
  }).optional()
});
export type ResumeBrief = z.infer<typeof ResumeBriefSchema>;

/**
 * Handoff Packet
 * Lossless cross-agent / cross-session transfer packet
 */
export const HandoffPacketSchema = z.object({
  format_version: z.literal("1.0.0"),
  generated_at: z.string(),
  thread_id: z.string(),
  checkpoint_id: z.string(),
  objective: z.string(),
  current_state: z.string(),
  decisions: z.array(z.object({
    decision: z.string(),
    why: z.string(),
    evidence_ids: z.array(z.string())
  })),
  known_evidence: z.array(z.object({
    id: z.string(),
    type: z.string(),
    fact: z.string()
  })),
  already_tried: z.array(z.object({
    attempt: z.string(),
    outcome: z.string()
  })),
  do_not_repeat: z.array(z.string()),
  changed_since_checkpoint: z.array(z.string()),
  open_questions: z.array(z.string()),
  next_experiment: NextActionSchema,
  success_condition: z.string(),
  relevant_artifacts: z.array(z.object({
    path: z.string(),
    version: z.string(),
    status: z.string()
  }))
});
export type HandoffPacket = z.infer<typeof HandoffPacketSchema>;
