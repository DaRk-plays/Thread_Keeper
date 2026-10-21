import {
  BedrockModelProvider,
  createModelProvider
} from "../providers/model.js";
import { LocalMemoryProvider } from "../providers/memory.js";
import { ContinuityEngine } from "../engine/continuity.js";
import { CognitiveCheckpoint } from "../domain/types.js";
import { CurrentWorkspaceState } from "../engine/diff.js";
import { GroundedReasoningResponseSchema, validateGroundedReasoning } from "../domain/grounding.js";

async function main() {
  console.log("=================================================");
  console.log("THREADKEEPER MILESTONE 3A: LIVE BEDROCK VERIFICATION");
  console.log("=================================================\n");

  const region = "ap-southeast-2";
  const profile = "threadkeeper";
  const modelId = "amazon.nova-lite-v1:0";

  console.log(`Targeting AWS Region:  ${region}`);
  console.log(`Targeting AWS Profile: ${profile}`);
  console.log(`Targeting Model ID:    ${modelId}\n`);

  // 1. Explicit Provider Creation
  const provider = createModelProvider({
    provider: "bedrock",
    region,
    profile,
    modelId,
    maxTokens: 300,
    temperature: 0.0
  });

  if (!(provider instanceof BedrockModelProvider)) {
    throw new Error(`Expected BedrockModelProvider instance, got ${provider.constructor.name}`);
  }

  console.log(`[PASS] BedrockModelProvider instantiated successfully via factory.`);
  console.log(`       Provider name: ${provider.name}`);
  console.log(`       Region:        ${provider.region}`);
  console.log(`       Model ID:      ${provider.modelId}`);

  // 2. Scenario Setup
  const memory = new LocalMemoryProvider();
  const threadId = "thread-bedrock-verify-3a";
  const evidenceId = "ev-art-src-payment-ts";

  const checkpoint: CognitiveCheckpoint = {
    checkpoint_id: "cp-bedrock-verify",
    thread_id: threadId,
    actor_id: "developer",
    created_at: new Date().toISOString(),
    goal: {
      text: "Implement strict multi-currency payment validation",
      success_criteria: ["Validate currency ISO codes"],
      evidence_ids: [evidenceId]
    },
    state_summary: "Working on payment currency validation",
    work_context: {
      project_name: "ThreadKeeper",
      workspace_root: "/workspace",
      branch: "main",
      active_file: "src/payment.ts"
    },
    evidence: [
      {
        id: evidenceId,
        type: "file_hash",
        source: "src/payment.ts",
        content: "hash-initial-1111",
        captured_at: new Date().toISOString(),
        epistemic_status: "observed"
      }
    ],
    attempts: [],
    decisions: [
      {
        id: "dec-currency-baseline",
        description: "Allow any currency without whitelist validation",
        rationale: "Rapid prototype phase",
        status: "active",
        assumptions: ["asm-currency-accepts-all"],
        evidence_ids: [evidenceId]
      }
    ],
    artifacts: [
      {
        id: "art-src-payment-ts",
        path_or_uri: "src/payment.ts",
        version_or_hash: "hash-initial-1111",
        type: "code",
        last_modified: new Date().toISOString()
      }
    ],
    assumptions: [
      {
        id: "asm-currency-accepts-all",
        statement: "src/payment.ts accepts currencies without whitelist validation.",
        status: "active",
        target_artifact_id: "art-src-payment-ts",
        evidence_ids: [evidenceId]
      }
    ],
    blockers: [],
    open_questions: [],
    next_actions: [
      {
        id: "na-add-whitelist",
        description: "Add currency whitelist validation to src/payment.ts",
        priority: "immediate",
        rationale: "Secure payment endpoint",
        target_artifact: "src/payment.ts",
        evidence_ids: [evidenceId]
      }
    ],
    uncertainties: []
  };

  await memory.saveCheckpoint(checkpoint);
  console.log(`[PASS] Seeded baseline checkpoint with evidence ID '${evidenceId}'.`);

  // Current state: src/payment.ts changed while user was away
  const currentState: CurrentWorkspaceState = {
    timestamp: new Date().toISOString(),
    git_branch: "main",
    git_status: "M src/payment.ts",
    artifacts: [
      {
        id: "art-src-payment-ts",
        path_or_uri: "src/payment.ts",
        version_or_hash: "hash-modified-9999",
        type: "code",
        last_modified: new Date().toISOString()
      }
    ],
    evidence: [
      {
        id: evidenceId,
        type: "file_hash",
        source: "src/payment.ts",
        content: "hash-modified-9999",
        captured_at: new Date().toISOString(),
        epistemic_status: "observed"
      }
    ]
  };

  // 3. Execute Continuity Resume with Live Bedrock Model Provider
  console.log(`\nExecuting SINGLE live Bedrock Converse invocation through ContinuityEngine...`);
  const engine = new ContinuityEngine({
    memoryProvider: memory,
    modelProvider: provider
  });

  const resumeBrief = await engine.resume(threadId, currentState);

  // 4. Assertions and Verifications
  console.log("\n--- VERIFICATION AUDIT ---");

  // Check 1: Deterministic continuity diff exists and is authoritative
  if (!resumeBrief.continuity_diff) {
    throw new Error("Continuity diff was not computed.");
  }
  if (resumeBrief.stale_assumption_count !== 1) {
    throw new Error(`Expected 1 stale assumption, found ${resumeBrief.stale_assumption_count}`);
  }
  console.log(`[PASS] Deterministic Continuity Diff correctly marked assumption stale:`);
  console.log(`       "${resumeBrief.continuity_diff.stale_assumptions[0].statement}"`);

  // Check 2: Deterministic next action is authoritative
  const detAction = resumeBrief.grounded_next_action;
  if (!detAction || !detAction.description) {
    throw new Error("Missing deterministic grounded next action.");
  }
  console.log(`[PASS] Deterministic Grounded Next Action remains authoritative:`);
  console.log(`       "${detAction.description}"`);

  // Check 3: Semantic interpretation was generated and validated
  const semantic = resumeBrief.semantic_interpretation;
  if (!semantic) {
    throw new Error("Semantic interpretation was not returned by BedrockModelProvider.");
  }

  // Check 4: Zod Schema Validation
  const schemaCheck = GroundedReasoningResponseSchema.safeParse(semantic);
  if (!schemaCheck.success) {
    throw new Error(`Semantic response failed schema validation: ${schemaCheck.error.message}`);
  }
  console.log(`[PASS] Structured model output conforms 100% to GroundedReasoningResponseSchema.`);

  // Check 5: Evidence ID Validation (No Hallucinations)
  const allowedEvidence = new Set([evidenceId, "art-src-payment-ts"]);
  const allowedFacts = ["src/payment.ts changed while the user was away."];
  const groundingCheck = validateGroundedReasoning(semantic, allowedEvidence, allowedFacts);

  if (!groundingCheck.valid) {
    throw new Error(`Grounding validation failed: ${groundingCheck.error}`);
  }
  console.log(`[PASS] Evidence ID Validation: Zero hallucinated IDs. All citations match [${evidenceId}].`);
  console.log(`[PASS] Unsupported-Fact Audit: No speculative or unsupported facts found.`);

  // Check 6: Usage metadata captured
  const usage = provider.lastUsage;
  if (!usage || usage.inputTokens <= 0 || usage.outputTokens <= 0) {
    throw new Error("Missing or invalid token usage metadata.");
  }
  console.log(`[PASS] Bedrock Usage Metadata captured:`);
  console.log(`       Input Tokens:  ${usage.inputTokens}`);
  console.log(`       Output Tokens: ${usage.outputTokens}`);
  console.log(`       Total Tokens:  ${usage.totalTokens}`);
  if (usage.latencyMs) {
    console.log(`       Latency:       ${usage.latencyMs} ms`);
  }

  console.log("\n--- LIVE STRUCTURED MODEL OUTPUT ---");
  console.log(JSON.stringify(semantic, null, 2));

  console.log("\n--- CONVERSATIONAL VOICE BRIEF ---");
  console.log(`"${resumeBrief.voice_summary}"`);

  console.log("\n=================================================");
  console.log("MILESTONE 3A LIVE VERIFICATION COMPLETE: ALL PASS");
  console.log("=================================================");
}

main().catch((err) => {
  console.error("\n[FAIL] Live Bedrock verification failed:", err);
  process.exit(1);
});
