import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  BedrockModelProvider,
  createModelProvider,
  FixtureModelProvider
} from "../src/providers/model.js";
import {
  GroundedReasoningResponse,
  GroundedReasoningResponseSchema,
  validateGroundedReasoning
} from "../src/domain/grounding.js";
import {
  ModelConfigurationError,
  ModelInvocationError,
  ValidationError
} from "../src/domain/errors.js";
import { ContinuityEngine } from "../src/engine/continuity.js";
import { LocalMemoryProvider } from "../src/providers/memory.js";
import { CognitiveCheckpoint } from "../src/domain/types.js";
import { CurrentWorkspaceState } from "../src/engine/diff.js";

// Mock helper to build an AWS SDK Bedrock response
function makeBedrockResponse(text: string, usage = { inputTokens: 50, outputTokens: 40, totalTokens: 90 }, latencyMs = 250) {
  return {
    output: {
      message: {
        role: "assistant",
        content: [{ text }]
      }
    },
    usage,
    metrics: { latencyMs },
    stopReason: "end_turn"
  };
}

describe("BedrockModelProvider & Grounding Contract (Milestone 3A)", () => {
  const originalEnv = process.env.THREADKEEPER_MODEL_PROVIDER;

  beforeEach(() => {
    vi.restoreAllMocks();
    if (originalEnv !== undefined) {
      process.env.THREADKEEPER_MODEL_PROVIDER = originalEnv;
    } else {
      delete process.env.THREADKEEPER_MODEL_PROVIDER;
    }
  });

  const validSampleJson: GroundedReasoningResponse = {
    observed_facts: [
      {
        statement: "src/payment.ts changed while the user was away.",
        evidence_ids: ["ev-art-src-payment-ts"]
      }
    ],
    derived_assessment: {
      status: "needs_review",
      reason: "Underlying file changed; previous currency validation assumption requires verification.",
      evidence_ids: ["ev-art-src-payment-ts"]
    },
    interpretation: {
      statement: "Previous assumption about unvalidated currencies might be affected.",
      confidence: "medium",
      evidence_ids: ["ev-art-src-payment-ts"]
    },
    unknowns: [
      "Exact code changes made to src/payment.ts",
      "Actor or cause of the change"
    ],
    recommended_next_action: {
      action: "Inspect git diff for src/payment.ts before resuming implementation.",
      reason: "Verify whether whitelist validation was introduced.",
      evidence_ids: ["ev-art-src-payment-ts"]
    }
  };

  it("parses valid structured Bedrock response and captures usage metrics", async () => {
    const mockSend = vi.fn().mockResolvedValue(
      makeBedrockResponse(JSON.stringify(validSampleJson), { inputTokens: 120, outputTokens: 95, totalTokens: 215 }, 310)
    );
    const mockClient = { send: mockSend } as any;

    const provider = new BedrockModelProvider({ client: mockClient });
    const result = await provider.generateStructured({
      systemPrompt: "system",
      userPrompt: "user",
      schema: GroundedReasoningResponseSchema
    });

    expect(result).toEqual(validSampleJson);
    expect(provider.lastUsage).toEqual({
      modelId: "amazon.nova-lite-v1:0",
      inputTokens: 120,
      outputTokens: 95,
      totalTokens: 215,
      latencyMs: 310
    });
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  it("handles markdown-fenced json response cleanly", async () => {
    const wrappedText = "```json\n" + JSON.stringify(validSampleJson) + "\n```";
    const mockClient = { send: vi.fn().mockResolvedValue(makeBedrockResponse(wrappedText)) } as any;

    const provider = new BedrockModelProvider({ client: mockClient });
    const result = await provider.generateStructured({
      systemPrompt: "system",
      userPrompt: "user",
      schema: GroundedReasoningResponseSchema
    });

    expect(result.derived_assessment.status).toBe("needs_review");
  });

  it("throws ModelInvocationError on malformed JSON response", async () => {
    const mockClient = { send: vi.fn().mockResolvedValue(makeBedrockResponse("Sorry, I cannot format this as JSON.")) } as any;

    const provider = new BedrockModelProvider({ client: mockClient });
    await expect(
      provider.generateStructured({
        systemPrompt: "system",
        userPrompt: "user",
        schema: GroundedReasoningResponseSchema
      })
    ).rejects.toThrow(ModelInvocationError);
  });

  it("throws ValidationError on schema-invalid response", async () => {
    const invalidJson = {
      observed_facts: [], // min 1 required
      derived_assessment: { status: "invalid_status", reason: "" }
    };
    const mockClient = { send: vi.fn().mockResolvedValue(makeBedrockResponse(JSON.stringify(invalidJson))) } as any;

    const provider = new BedrockModelProvider({ client: mockClient });
    await expect(
      provider.generateStructured({
        systemPrompt: "system",
        userPrompt: "user",
        schema: GroundedReasoningResponseSchema
      })
    ).rejects.toThrow(ValidationError);
  });

  it("detects and rejects hallucinated evidence IDs", () => {
    const hallucinatedCandidate = {
      ...validSampleJson,
      derived_assessment: {
        ...validSampleJson.derived_assessment,
        evidence_ids: ["ev-phantom-unseen-id"]
      }
    };

    const allowed = new Set(["ev-art-src-payment-ts"]);
    const validation = validateGroundedReasoning(hallucinatedCandidate, allowed);

    expect(validation.valid).toBe(false);
    expect(validation.error).toContain("Hallucinated evidence ID detected: 'ev-phantom-unseen-id'");
  });

  it("detects and rejects unsupported observed facts", () => {
    const unsupportedFactCandidate = {
      ...validSampleJson,
      observed_facts: [
        {
          statement: "The database schema was dropped by deployment script.",
          evidence_ids: ["ev-art-src-payment-ts"]
        }
      ]
    };

    const allowedIds = new Set(["ev-art-src-payment-ts"]);
    const allowedFacts = ["src/payment.ts changed while the user was away."];
    const validation = validateGroundedReasoning(unsupportedFactCandidate, allowedIds, allowedFacts);

    expect(validation.valid).toBe(false);
    expect(validation.error).toContain("Unsupported observed fact");
  });

  it("detects and rejects prohibited speculative bug-fix claims", () => {
    const speculativeCandidate = {
      ...validSampleJson,
      interpretation: {
        statement: "The bug was fixed and validation was added to the service.",
        confidence: "high" as const,
        evidence_ids: ["ev-art-src-payment-ts"]
      }
    };

    const allowedIds = new Set(["ev-art-src-payment-ts"]);
    const allowedFacts = ["src/payment.ts changed while the user was away."];
    const validation = validateGroundedReasoning(speculativeCandidate, allowedIds, allowedFacts);

    expect(validation.valid).toBe(false);
    expect(validation.error).toContain("Unsupported speculative claim detected");
  });

  it("throws ModelInvocationError on Bedrock API failure", async () => {
    const mockClient = {
      send: vi.fn().mockRejectedValue(new Error("ThrottlingException: Rate limit exceeded"))
    } as any;

    const provider = new BedrockModelProvider({ client: mockClient });
    await expect(
      provider.generateStructured({
        systemPrompt: "system",
        userPrompt: "user",
        schema: GroundedReasoningResponseSchema
      })
    ).rejects.toThrow(ModelInvocationError);
  });

  it("falls back to deterministic behavior when model fails or throws during resume", async () => {
    const memory = new LocalMemoryProvider();
    const failingModel: any = {
      name: "failing-bedrock",
      generateStructured: vi.fn().mockRejectedValue(new Error("Bedrock service timeout"))
    };

    const checkpoint: CognitiveCheckpoint = {
      checkpoint_id: "cp-test",
      thread_id: "thread-test",
      actor_id: "user",
      created_at: new Date().toISOString(),
      goal: { text: "Fix payment", success_criteria: [], evidence_ids: ["ev-art-src-payment-ts"] },
      state_summary: "Working on payment",
      work_context: { project_name: "test", workspace_root: "/test", branch: "main" },
      evidence: [
        { id: "ev-art-src-payment-ts", type: "file_hash", source: "src/payment.ts", content: "hash-then", captured_at: new Date().toISOString() }
      ],
      attempts: [],
      decisions: [],
      artifacts: [
        { id: "art-src-payment-ts", path_or_uri: "src/payment.ts", version_or_hash: "hash-then", type: "code", captured_at: new Date().toISOString() }
      ],
      assumptions: [
        { id: "asm-payment", statement: "src/payment.ts accepts any currency", status: "active", target_artifact_id: "art-src-payment-ts", evidence_ids: ["ev-art-src-payment-ts"] }
      ],
      blockers: [],
      open_questions: [],
      next_actions: [
        { id: "na-1", description: "Implement whitelist", priority: "immediate", rationale: "Security", evidence_ids: ["ev-art-src-payment-ts"] }
      ],
      uncertainties: []
    };

    await memory.saveCheckpoint(checkpoint);

    const currentState: CurrentWorkspaceState = {
      timestamp: new Date().toISOString(),
      git_branch: "main",
      git_status: "M src/payment.ts",
      artifacts: [
        { id: "art-src-payment-ts", path_or_uri: "src/payment.ts", version_or_hash: "hash-now", type: "code", captured_at: new Date().toISOString() }
      ],
      evidence: [
        { id: "ev-art-src-payment-ts-now", type: "file_hash", source: "src/payment.ts", content: "hash-now", captured_at: new Date().toISOString() }
      ]
    };

    const engine = new ContinuityEngine({
      memoryProvider: memory,
      modelProvider: failingModel
    });

    // Should NOT throw! Must fall back gracefully to deterministic diff
    const brief = await engine.resume("thread-test", currentState);

    expect(brief.thread_id).toBe("thread-test");
    expect(brief.stale_assumption_count).toBe(1);
    expect(brief.continuity_diff.stale_assumptions[0].statement).toBe("src/payment.ts accepts any currency");
    expect(brief.grounded_next_action).toBeDefined();
    // Semantic interpretation is safely undefined because model failed
    expect(brief.semantic_interpretation).toBeUndefined();
  });

  it("verifies provider selection: default is 'local' and requires explicit configuration", () => {
    delete process.env.THREADKEEPER_MODEL_PROVIDER;

    // Default must always be local FixtureModelProvider
    const defaultProvider = createModelProvider();
    expect(defaultProvider).toBeInstanceOf(FixtureModelProvider);
    expect(defaultProvider.name).toBe("fixture-local");

    // Explicit local
    const explicitLocal = createModelProvider({ provider: "local" });
    expect(explicitLocal).toBeInstanceOf(FixtureModelProvider);

    // Environment variable local
    process.env.THREADKEEPER_MODEL_PROVIDER = "local";
    const envLocal = createModelProvider();
    expect(envLocal).toBeInstanceOf(FixtureModelProvider);

    // Explicit bedrock
    const bedrockProvider = createModelProvider({ provider: "bedrock", client: {} as any });
    expect(bedrockProvider).toBeInstanceOf(BedrockModelProvider);
    expect(bedrockProvider.name).toBe("bedrock");

    // Unknown provider throws ModelConfigurationError
    expect(() => createModelProvider({ provider: "invalid-vendor" })).toThrow(ModelConfigurationError);
  });

  it("handles missing/invalid AWS configuration gracefully", () => {
    const provider = new BedrockModelProvider({
      region: "invalid-region-@@@",
      profile: "non-existent-profile-xyz"
    });

    expect(provider.region).toBe("invalid-region-@@@");
    expect(provider.profile).toBe("non-existent-profile-xyz");
  });

  it("deterministic evidence overrides conflicting model interpretation", async () => {
    const memory = new LocalMemoryProvider();

    // Model returns conflicting status: claims assumption is "still_valid", but deterministic file diff proves it changed!
    const conflictingModel: any = {
      name: "conflicting-model",
      lastUsage: { modelId: "test-nova", inputTokens: 100, outputTokens: 80, totalTokens: 180 },
      generateStructured: vi.fn().mockResolvedValue({
        observed_facts: [
          { statement: "src/payment.ts changed while the user was away.", evidence_ids: ["art-src-payment-ts"] }
        ],
        derived_assessment: {
          status: "still_valid", // Conflicting!
          reason: "Model mistakenly thinks it is still valid.",
          evidence_ids: ["art-src-payment-ts"]
        },
        interpretation: {
          statement: "Everything is fine.",
          confidence: "low",
          evidence_ids: ["art-src-payment-ts"]
        },
        unknowns: [],
        recommended_next_action: {
          action: "Do nothing.",
          reason: "Assumption is fine.",
          evidence_ids: ["art-src-payment-ts"]
        }
      })
    };

    const checkpoint: CognitiveCheckpoint = {
      checkpoint_id: "cp-conflict",
      thread_id: "thread-conflict",
      actor_id: "user",
      created_at: new Date().toISOString(),
      goal: { text: "Goal", success_criteria: [], evidence_ids: ["ev-art-src-payment-ts"] },
      state_summary: "Working",
      work_context: { project_name: "test", workspace_root: "/test", branch: "main" },
      evidence: [
        { id: "ev-art-src-payment-ts", type: "file_hash", source: "src/payment.ts", content: "hash-1", captured_at: new Date().toISOString() }
      ],
      attempts: [],
      decisions: [],
      artifacts: [
        { id: "art-src-payment-ts", path_or_uri: "src/payment.ts", version_or_hash: "hash-1", type: "code", captured_at: new Date().toISOString() }
      ],
      assumptions: [
        { id: "asm-1", statement: "src/payment.ts accepts any currency", status: "active", target_artifact_id: "art-src-payment-ts", evidence_ids: ["ev-art-src-payment-ts"] }
      ],
      blockers: [],
      open_questions: [],
      next_actions: [
        { id: "na-1", description: "Deterministic next action", priority: "immediate", rationale: "Baseline", evidence_ids: ["ev-art-src-payment-ts"] }
      ],
      uncertainties: []
    };

    await memory.saveCheckpoint(checkpoint);

    const currentState: CurrentWorkspaceState = {
      timestamp: new Date().toISOString(),
      git_branch: "main",
      git_status: "M src/payment.ts",
      artifacts: [
        { id: "art-src-payment-ts", path_or_uri: "src/payment.ts", version_or_hash: "hash-2", type: "code", captured_at: new Date().toISOString() }
      ],
      evidence: [
        { id: "ev-art-src-payment-ts-2", type: "file_hash", source: "src/payment.ts", content: "hash-2", captured_at: new Date().toISOString() }
      ]
    };

    const engine = new ContinuityEngine({
      memoryProvider: memory,
      modelProvider: conflictingModel
    });

    const brief = await engine.resume("thread-conflict", currentState);

    // CRITICAL: Deterministic diff is AUTHORITATIVE.
    // The assumption IS stale in continuity_diff regardless of model's opinion!
    expect(brief.continuity_diff.stale_assumptions.length).toBe(1);
    expect(brief.continuity_diff.stale_assumptions[0].statement).toBe("src/payment.ts accepts any currency");
    expect(brief.stale_assumption_count).toBe(1);

    // Deterministic recommended next action remains the authoritative action:
    expect(brief.grounded_next_action.description).toContain("Re-evaluate assumption for src/payment.ts");
    expect(brief.grounded_next_action.description).not.toContain("Do nothing");

    // Semantic interpretation is attached for advisory inspection:
    expect(brief.semantic_interpretation).toBeDefined();
    expect(brief.semantic_interpretation?.derived_assessment.status).toBe("still_valid");
  });
});
