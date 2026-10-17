import { describe, it, expect, beforeEach } from "vitest";
import { ContinuityEngine } from "../src/engine/continuity.js";
import { LocalMemoryProvider } from "../src/providers/memory.js";
import { FixtureModelProvider } from "../src/providers/model.js";
import { CheckpointNotFoundError } from "../src/domain/errors.js";
import {
  getInterruptedWorkspaceState,
  getSeededCheckpoint,
  getUnchangedWorkspaceState
} from "../src/scenario/seeded.js";

describe("ContinuityEngine", () => {
  let memory: LocalMemoryProvider;
  let model: FixtureModelProvider;
  let engine: ContinuityEngine;

  beforeEach(() => {
    memory = new LocalMemoryProvider();
    model = new FixtureModelProvider();
    engine = new ContinuityEngine({ memoryProvider: memory, modelProvider: model });
  });

  it("parks a cognitive checkpoint and stores it in memory", async () => {
    const cp = getSeededCheckpoint();
    const parked = await engine.park(cp);

    expect(parked.checkpoint_id).toBe(cp.checkpoint_id);
    const stored = await memory.getCheckpoint(cp.checkpoint_id);
    expect(stored).not.toBeNull();
  });

  it("resumes a thread, returning a 30-second voice summary and structured continuity diff", async () => {
    const cp = getSeededCheckpoint();
    await engine.park(cp);

    const interruptedState = getInterruptedWorkspaceState();
    const brief = await engine.resume(cp.thread_id, interruptedState);

    expect(brief.thread_id).toBe(cp.thread_id);
    expect(brief.voice_summary).toContain("You were working on");
    expect(brief.voice_summary).toContain("stale");
    expect(brief.changed_artifact_count).toBe(1);
    expect(brief.stale_assumption_count).toBe(1);
    expect(brief.grounded_next_action).toBeDefined();
    expect(brief.last_decision?.description).toBe(cp.decisions[0].description);
  });

  it("throws CheckpointNotFoundError when resuming a non-existent thread", async () => {
    const emptyState = getUnchangedWorkspaceState();
    await expect(engine.resume("thread-ghost", emptyState)).rejects.toThrow(
      CheckpointNotFoundError
    );
  });

  it("finds decisions and citations matching a query", async () => {
    const cp = getSeededCheckpoint();
    await engine.park(cp);

    const result = await engine.findDecision(cp.thread_id, "backend");
    expect(result.decisions.length).toBe(1);
    expect(result.decisions[0].id).toBe("dec-01");
    expect(result.cited_evidence).toContain("ev-api-01");
  });

  it("recovers unfinished work including blockers and open questions", async () => {
    const cp = getSeededCheckpoint();
    await engine.park(cp);

    const unfinished = await engine.findUnfinishedWork(cp.thread_id);
    expect(unfinished.goal).toBe(cp.goal.text);
    expect(unfinished.blockers.length).toBe(1);
    expect(unfinished.open_questions.length).toBe(1);
    expect(unfinished.pending_actions.length).toBe(1);
  });

  it("creates a standardized lossless agent handoff packet", async () => {
    const cp = getSeededCheckpoint();
    await engine.park(cp);

    const interruptedState = getInterruptedWorkspaceState();
    const handoff = await engine.createHandoff(cp.thread_id, interruptedState);

    expect(handoff.format_version).toBe("1.0.0");
    expect(handoff.objective).toBe(cp.goal.text);
    expect(handoff.decisions.length).toBe(1);
    expect(handoff.known_evidence.length).toBe(3);
    expect(handoff.changed_since_checkpoint.length).toBe(1);
    expect(handoff.next_experiment.target_artifact).toBe("components/InvoiceFilter.tsx");
  });
});
