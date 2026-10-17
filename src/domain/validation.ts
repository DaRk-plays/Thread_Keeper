import {
  CognitiveCheckpoint,
  CognitiveCheckpointSchema,
  ContinuityDiff,
  ContinuityDiffSchema,
  HandoffPacket,
  HandoffPacketSchema,
  ResumeBrief,
  ResumeBriefSchema
} from "./types.js";
import { InvalidEvidenceReferenceError, ValidationError } from "./errors.js";

/**
 * Validate that a Cognitive Checkpoint strictly adheres to schema and evidence reference integrity
 */
export function validateCheckpoint(data: unknown): CognitiveCheckpoint {
  const result = CognitiveCheckpointSchema.safeParse(data);
  if (!result.success) {
    throw new ValidationError("Failed to validate cognitive checkpoint schema", result.error.format());
  }

  const checkpoint = result.data;
  verifyEvidenceIntegrity(checkpoint);
  return checkpoint;
}

/**
 * Verify that all evidence_ids referenced across goals, decisions, attempts, assumptions,
 * blockers, and next actions actually exist in the checkpoint's evidence pool.
 */
export function verifyEvidenceIntegrity(checkpoint: CognitiveCheckpoint): void {
  const existingEvidenceIds = new Set(checkpoint.evidence.map((e) => e.id));

  // 1. Check Goal
  for (const id of checkpoint.goal.evidence_ids) {
    if (!existingEvidenceIds.has(id)) {
      throw new InvalidEvidenceReferenceError(id, "goal.evidence_ids");
    }
  }

  // 2. Check Decisions
  for (const decision of checkpoint.decisions) {
    for (const id of decision.evidence_ids) {
      if (!existingEvidenceIds.has(id)) {
        throw new InvalidEvidenceReferenceError(id, `decision[${decision.id}].evidence_ids`);
      }
    }
  }

  // 3. Check Attempts
  for (const attempt of checkpoint.attempts) {
    for (const id of attempt.evidence_ids) {
      if (!existingEvidenceIds.has(id)) {
        throw new InvalidEvidenceReferenceError(id, `attempt[${attempt.id}].evidence_ids`);
      }
    }
  }

  // 4. Check Assumptions
  for (const assumption of checkpoint.assumptions) {
    for (const id of assumption.evidence_ids) {
      if (!existingEvidenceIds.has(id)) {
        throw new InvalidEvidenceReferenceError(id, `assumption[${assumption.id}].evidence_ids`);
      }
    }
    if (assumption.invalidated_by_evidence_id && !existingEvidenceIds.has(assumption.invalidated_by_evidence_id)) {
      throw new InvalidEvidenceReferenceError(
        assumption.invalidated_by_evidence_id,
        `assumption[${assumption.id}].invalidated_by_evidence_id`
      );
    }
  }

  // 5. Check Blockers
  for (const blocker of checkpoint.blockers) {
    for (const id of blocker.evidence_ids) {
      if (!existingEvidenceIds.has(id)) {
        throw new InvalidEvidenceReferenceError(id, `blocker[${blocker.id}].evidence_ids`);
      }
    }
  }

  // 6. Check Next Actions
  for (const action of checkpoint.next_actions) {
    for (const id of action.evidence_ids) {
      if (!existingEvidenceIds.has(id)) {
        throw new InvalidEvidenceReferenceError(id, `next_action[${action.id}].evidence_ids`);
      }
    }
  }
}

export function validateContinuityDiff(data: unknown): ContinuityDiff {
  const result = ContinuityDiffSchema.safeParse(data);
  if (!result.success) {
    throw new ValidationError("Failed to validate continuity diff schema", result.error.format());
  }
  return result.data;
}

export function validateResumeBrief(data: unknown): ResumeBrief {
  const result = ResumeBriefSchema.safeParse(data);
  if (!result.success) {
    throw new ValidationError("Failed to validate resume brief schema", result.error.format());
  }
  return result.data;
}

export function validateHandoffPacket(data: unknown): HandoffPacket {
  const result = HandoffPacketSchema.safeParse(data);
  if (!result.success) {
    throw new ValidationError("Failed to validate handoff packet schema", result.error.format());
  }
  return result.data;
}
