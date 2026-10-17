import { describe, it, expect } from "vitest";
import { computeContinuityDiff } from "../src/engine/diff.js";
import {
  getInterruptedWorkspaceState,
  getSeededCheckpoint,
  getUnchangedWorkspaceState
} from "../src/scenario/seeded.js";

describe("ContinuityDiff Engine & Staleness Propagation", () => {
  it("determines that all artifacts are intact when no changes occurred while away", () => {
    const cp = getSeededCheckpoint();
    const cleanState = getUnchangedWorkspaceState();

    const diff = computeContinuityDiff(cp, cleanState);

    expect(diff.changed.length).toBe(0);
    expect(diff.stale_assumptions.length).toBe(0);
    expect(diff.still_valid.length).toBeGreaterThan(0);
    expect(diff.recommended_next_action.description).toBe(cp.next_actions[0].description);
  });

  it("detects changed artifacts and computes version differences", () => {
    const cp = getSeededCheckpoint();
    const interruptedState = getInterruptedWorkspaceState();

    const diff = computeContinuityDiff(cp, interruptedState);

    expect(diff.changed.length).toBe(1);
    expect(diff.changed[0].path).toBe("components/InvoiceFilter.tsx");
    expect(diff.changed[0].then_version).toBe("v1.0.0-hash-a1b2c3d4");
    expect(diff.changed[0].now_version).toBe("v1.1.0-hash-e5f6g7h8");
  });

  it("flags assumptions as stale when their target artifact has changed", () => {
    const cp = getSeededCheckpoint();
    const interruptedState = getInterruptedWorkspaceState();

    const diff = computeContinuityDiff(cp, interruptedState);

    expect(diff.stale_assumptions.length).toBe(1);
    const stale = diff.stale_assumptions[0];
    expect(stale.assumption_id).toBe("asm-fe-mapping");
    expect(stale.statement).toContain("uppercase 'PAID'");
    expect(stale.reason_stale).toContain("invalidates assumption");
  });

  it("propagates staleness to dependent decisions", () => {
    const cp = getSeededCheckpoint();
    const interruptedState = getInterruptedWorkspaceState();

    const diff = computeContinuityDiff(cp, interruptedState);

    const stale = diff.stale_assumptions[0];
    // Decision dec-01 depends on assumption asm-fe-mapping
    expect(stale.affected_decision_ids).toContain("dec-01");
  });

  it("recommends an evidence-grounded next action referencing the changed artifact and new evidence", () => {
    const cp = getSeededCheckpoint();
    const interruptedState = getInterruptedWorkspaceState();

    const diff = computeContinuityDiff(cp, interruptedState);

    expect(diff.recommended_next_action.priority).toBe("immediate");
    expect(diff.recommended_next_action.target_artifact).toBe("components/InvoiceFilter.tsx");
    expect(diff.recommended_next_action.description).toContain("Re-evaluate assumption");
    // Evidence IDs cited should include the new diff evidence
    expect(diff.recommended_next_action.evidence_ids).toContain("ev-diff-04");
  });
});
