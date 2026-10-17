import { describe, it, expect } from "vitest";
import {
  getInterruptedWorkspaceState,
  getSeededCheckpoint,
  getUnchangedWorkspaceState
} from "../src/scenario/seeded.js";
import { computeContinuityDiff } from "../src/engine/diff.js";
import { ContinuityEngine } from "../src/engine/continuity.js";
import { LocalMemoryProvider } from "../src/providers/memory.js";

describe("Seeded Demo Scenario Verification", () => {
  it("executes the complete repeatable scenario lifecycle", async () => {
    const memory = new LocalMemoryProvider();
    const engine = new ContinuityEngine({ memoryProvider: memory });

    // Step 1: Park initial bug state
    const cp = getSeededCheckpoint();
    const parked = await engine.park(cp);
    expect(parked.checkpoint_id).toBe("cp-invoice-001");

    // Step 2: Validate baseline with clean state
    const cleanState = getUnchangedWorkspaceState();
    const cleanBrief = await engine.resume(parked.thread_id, cleanState);
    expect(cleanBrief.changed_artifact_count).toBe(0);
    expect(cleanBrief.stale_assumption_count).toBe(0);
    expect(cleanBrief.grounded_next_action.description).toBe(
      "Inspect frontend filter mapping in components/InvoiceFilter.tsx"
    );

    // Step 3: Simulate interruption & state change
    const interruptedState = getInterruptedWorkspaceState();
    const diff = computeContinuityDiff(parked, interruptedState);

    // Step 4: Verify Continuity Diff properties
    expect(diff.changed.length).toBe(1);
    expect(diff.changed[0].path).toBe("components/InvoiceFilter.tsx");
    expect(diff.stale_assumptions.length).toBe(1);
    expect(diff.stale_assumptions[0].assumption_id).toBe("asm-fe-mapping");
    expect(diff.stale_assumptions[0].affected_decision_ids).toContain("dec-01");

    // Step 5: Resume thread and verify voice brief
    const resumeBrief = await engine.resume(parked.thread_id, interruptedState);
    expect(resumeBrief.voice_summary).toContain("You were working on");
    expect(resumeBrief.voice_summary).toContain("stale");
    expect(resumeBrief.grounded_next_action.evidence_ids).toContain("ev-diff-04");

    // Step 6: Generate agent handoff
    const handoff = await engine.createHandoff(parked.thread_id, interruptedState);
    expect(handoff.do_not_repeat.length).toBe(0); // All attempts succeeded so far
    expect(handoff.relevant_artifacts.find((a) => a.path === "components/InvoiceFilter.tsx")?.status).toBe("modified");
  });
});
