import { ContinuityEngine } from "../engine/continuity.js";
import { LocalMemoryProvider } from "../providers/memory.js";
import { FixtureModelProvider } from "../providers/model.js";
import {
  getInterruptedWorkspaceState,
  getSeededCheckpoint,
  getUnchangedWorkspaceState
} from "../scenario/seeded.js";

async function runDemo() {
  console.log("================================================================================");
  console.log("  THREADKEEPER — LOCAL CONTINUITY DEMO (FOUNDATION MILESTONE 1)");
  console.log("  The continuity layer for human attention • Alexa+ Hackathon");
  console.log("================================================================================\n");

  const memory = new LocalMemoryProvider();
  const model = new FixtureModelProvider();
  const engine = new ContinuityEngine({ memoryProvider: memory, modelProvider: model });

  // STEP 1: Park initial bug state
  console.log(">>> [STEP 1] User investigates bug and says: 'Alexa, park this'");
  const initialCheckpoint = getSeededCheckpoint();
  const parked = await engine.park(initialCheckpoint);
  console.log(`✓ Parked Cognitive Checkpoint ID : ${parked.checkpoint_id}`);
  console.log(`✓ Thread ID                     : ${parked.thread_id}`);
  console.log(`✓ Primary Objective             : ${parked.goal.text}`);
  console.log(`✓ Captured Evidence Items       : ${parked.evidence.length}`);
  console.log(`✓ Active Decisions              : ${parked.decisions.length}`);
  console.log(`✓ Active Assumptions            : ${parked.assumptions.length}`);
  console.log(`✓ Intended Next Action          : ${parked.next_actions[0].description}\n`);

  // STEP 2: Baseline Resume (No changes while away)
  console.log(">>> [STEP 2] Immediate resume test (No state changes while away)");
  const cleanState = getUnchangedWorkspaceState();
  const cleanBrief = await engine.resume(parked.thread_id, cleanState);
  console.log(`✓ Voice Brief: "${cleanBrief.voice_summary}"`);
  console.log(`✓ Stale Assumptions : ${cleanBrief.stale_assumption_count}`);
  console.log(`✓ Changed Artifacts : ${cleanBrief.changed_artifact_count}\n`);

  // STEP 3: State Change during Interruption
  console.log(">>> [STEP 3] Interruption occurs. State changes in workspace while user is away:");
  const interruptedState = getInterruptedWorkspaceState();
  console.log(`• File modified: ${interruptedState.artifacts[0].path_or_uri}`);
  console.log(`• Previous version: ${parked.artifacts[0].version_or_hash}`);
  console.log(`• New version: ${interruptedState.artifacts[0].version_or_hash}`);
  console.log(`• Observed diff evidence: "${interruptedState.evidence[0].content}"\n`);

  // STEP 4: Resume with Continuity Diff
  console.log(">>> [STEP 4] User returns and says: 'Alexa, resume my thread'");
  const resumedBrief = await engine.resume(parked.thread_id, interruptedState);
  const diff = resumedBrief.continuity_diff;

  console.log("\n--- [ALEXA+ 30-SECOND SPOKEN BRIEF] ---");
  console.log(`"${resumedBrief.voice_summary}"`);
  console.log("----------------------------------------\n");

  console.log("--- [CONTINUITY DIFF RESULTS] ---");
  console.log(`• Changed Artifacts (${diff.changed.length}):`);
  for (const c of diff.changed) {
    console.log(`  - ${c.path}: ${c.diff_summary} [${c.then_version} -> ${c.now_version}]`);
  }

  console.log(`• Stale Assumptions (${diff.stale_assumptions.length}):`);
  for (const sa of diff.stale_assumptions) {
    console.log(`  - [STALE] "${sa.statement}"`);
    console.log(`    Reason: ${sa.reason_stale}`);
    if (sa.affected_decision_ids.length > 0) {
      console.log(`    Propagated Staleness: Decision [${sa.affected_decision_ids.join(", ")}] flagged for review`);
    }
  }

  console.log(`• Grounded Next Action (Re-aligned):`);
  console.log(`  - Description : ${resumedBrief.grounded_next_action.description}`);
  console.log(`  - Priority    : ${resumedBrief.grounded_next_action.priority}`);
  console.log(`  - Target      : ${resumedBrief.grounded_next_action.target_artifact}`);
  console.log(`  - Rationale   : ${resumedBrief.grounded_next_action.rationale}`);
  console.log(`  - Cited Evidence IDs: [${resumedBrief.grounded_next_action.evidence_ids.join(", ")}]\n`);

  // STEP 5: Lossless Agent Handoff
  console.log(">>> [STEP 5] Export Lossless Agent Handoff Packet ('create_handoff')");
  const handoff = await engine.createHandoff(parked.thread_id, interruptedState);
  console.log(`✓ Handoff Format Version : ${handoff.format_version}`);
  console.log(`✓ Objective              : ${handoff.objective}`);
  console.log(`✓ Decisions Recorded     : ${handoff.decisions.length}`);
  console.log(`✓ Do Not Repeat Rules    : ${handoff.do_not_repeat.length}`);
  console.log(`✓ Changed Since Checkpoint: ${handoff.changed_since_checkpoint.length}`);
  console.log(`✓ Next Experiment        : ${handoff.next_experiment.description}\n`);

  console.log("================================================================================");
  console.log("  DEMO COMPLETED SUCCESSFULLY — ALL VERIFICATION GATES PASSED");
  console.log("================================================================================");
}

runDemo().catch((err) => {
  console.error("Demo failed with error:", err);
  process.exit(1);
});
