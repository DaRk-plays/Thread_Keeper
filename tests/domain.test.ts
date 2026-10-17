import { describe, it, expect } from "vitest";
import { EvidenceSchema } from "../src/domain/types.js";
import { validateCheckpoint, verifyEvidenceIntegrity } from "../src/domain/validation.js";
import { InvalidEvidenceReferenceError, ValidationError } from "../src/domain/errors.js";
import { getSeededCheckpoint } from "../src/scenario/seeded.js";

describe("Domain Models & Schema Validation", () => {
  it("successfully validates the seeded cognitive checkpoint", () => {
    const cp = getSeededCheckpoint();
    const validated = validateCheckpoint(cp);
    expect(validated.checkpoint_id).toBe("cp-invoice-001");
    expect(validated.goal.text).toContain("Fix invoice filtering");
    expect(validated.evidence.length).toBe(3);
    expect(validated.decisions.length).toBe(1);
    expect(validated.assumptions.length).toBe(1);
  });

  it("fails schema validation when required fields are missing", () => {
    const invalidData = {
      checkpoint_id: "cp-broken",
      // missing thread_id, actor_id, goal, etc.
    };
    expect(() => validateCheckpoint(invalidData)).toThrow(ValidationError);
  });

  it("enforces epistemic status validation on evidence items", () => {
    const validEvidence = {
      id: "ev-01",
      type: "git_status" as const,
      source: "git:status",
      content: "branch clean",
      captured_at: new Date().toISOString(),
      epistemic_status: "observed" as const
    };
    expect(EvidenceSchema.parse(validEvidence).epistemic_status).toBe("observed");

    const invalidEvidence = {
      ...validEvidence,
      epistemic_status: "hallucinated" // not in enum
    };
    expect(() => EvidenceSchema.parse(invalidEvidence)).toThrow();
  });

  it("throws InvalidEvidenceReferenceError when a decision references non-existent evidence", () => {
    const cp = getSeededCheckpoint();
    // Reference a ghost evidence ID that is not in cp.evidence
    cp.decisions[0].evidence_ids.push("ev-ghost-999");

    expect(() => verifyEvidenceIntegrity(cp)).toThrow(InvalidEvidenceReferenceError);
  });

  it("throws InvalidEvidenceReferenceError when an assumption references non-existent evidence", () => {
    const cp = getSeededCheckpoint();
    cp.assumptions[0].evidence_ids.push("ev-ghost-888");

    expect(() => verifyEvidenceIntegrity(cp)).toThrow(InvalidEvidenceReferenceError);
  });

  it("throws InvalidEvidenceReferenceError when next action references non-existent evidence", () => {
    const cp = getSeededCheckpoint();
    cp.next_actions[0].evidence_ids.push("ev-ghost-777");

    expect(() => verifyEvidenceIntegrity(cp)).toThrow(InvalidEvidenceReferenceError);
  });
});
