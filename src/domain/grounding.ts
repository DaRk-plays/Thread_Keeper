import { z } from "zod";

/**
 * Strict Grounding Contract Schemas based on Brain Test #2
 */

export const GroundedFactSchema = z.object({
  statement: z.string().min(1),
  evidence_ids: z.array(z.string().min(1)).min(1)
});
export type GroundedFact = z.infer<typeof GroundedFactSchema>;

export const DerivedAssessmentSchema = z.object({
  status: z.enum(["still_valid", "stale", "needs_review", "unknown"]),
  reason: z.string().min(1),
  evidence_ids: z.array(z.string().min(1)).min(1)
});
export type DerivedAssessment = z.infer<typeof DerivedAssessmentSchema>;

export const InterpretationSchema = z.object({
  statement: z.string().min(1),
  confidence: z.enum(["low", "medium", "high"]),
  evidence_ids: z.array(z.string().min(1)).min(1)
});
export type Interpretation = z.infer<typeof InterpretationSchema>;

export const RecommendedNextActionSchema = z.object({
  action: z.string().min(1),
  reason: z.string().min(1),
  evidence_ids: z.array(z.string().min(1)).min(1)
});
export type RecommendedNextAction = z.infer<typeof RecommendedNextActionSchema>;

export const GroundedReasoningResponseSchema = z.object({
  observed_facts: z.array(GroundedFactSchema).min(1),
  derived_assessment: DerivedAssessmentSchema,
  interpretation: InterpretationSchema,
  unknowns: z.array(z.string()),
  recommended_next_action: RecommendedNextActionSchema
});
export type GroundedReasoningResponse = z.infer<typeof GroundedReasoningResponseSchema>;

export interface GroundingValidationResult {
  valid: boolean;
  error?: string;
  data?: GroundedReasoningResponse;
}

/**
 * Validates a model-generated reasoning response against strict grounding rules:
 * 1. Zod schema validity
 * 2. Evidence ID referential integrity (no hallucinated IDs)
 * 3. Fact grounding (observed facts must be rooted in allowed facts)
 * 4. No unsupported code modifications or bug-fix assertions
 */
export function validateGroundedReasoning(
  candidate: unknown,
  allowedEvidenceIds: Set<string> | string[],
  allowedFactStatements?: string[]
): GroundingValidationResult {
  const allowedSet = allowedEvidenceIds instanceof Set
    ? allowedEvidenceIds
    : new Set(allowedEvidenceIds);

  const parsed = GroundedReasoningResponseSchema.safeParse(candidate);
  if (!parsed.success) {
    return {
      valid: false,
      error: `Schema validation failed: ${parsed.error.message}`
    };
  }

  const data = parsed.data;

  // 1. Evidence ID referential integrity check
  const allReferencedIds: string[] = [];
  for (const fact of data.observed_facts) {
    allReferencedIds.push(...fact.evidence_ids);
  }
  allReferencedIds.push(...data.derived_assessment.evidence_ids);
  allReferencedIds.push(...data.interpretation.evidence_ids);
  allReferencedIds.push(...data.recommended_next_action.evidence_ids);

  for (const id of allReferencedIds) {
    if (!allowedSet.has(id)) {
      return {
        valid: false,
        error: `Hallucinated evidence ID detected: '${id}'. Must be in [${Array.from(allowedSet).join(", ")}]`
      };
    }
  }

  // 2. Observed facts grounding check
  if (allowedFactStatements && allowedFactStatements.length > 0) {
    const allowedLower = allowedFactStatements.map((s) => s.toLowerCase());
    for (const fact of data.observed_facts) {
      const factLower = fact.statement.toLowerCase();
      // Fact statement must have meaningful grounding in at least one allowed statement
      const isGrounded = allowedLower.some((allowed) => {
        // Direct containment either way or significant word overlap
        return (
          factLower.includes(allowed) ||
          allowed.includes(factLower) ||
          hasSignificantTokenOverlap(factLower, allowed)
        );
      });

      if (!isGrounded) {
        return {
          valid: false,
          error: `Unsupported observed fact: '${fact.statement}'. Not grounded in verified evidence statements.`
        };
      }
    }
  }

  // 3. Prohibited causal or bug-fix assertions check
  const fullText = JSON.stringify(data).toLowerCase();
  const prohibitedClaims = [
    "bug is fixed",
    "bug was fixed",
    "bug has been fixed",
    "validation was added",
    "validation has been added",
    "fixed the issue",
    "inspected the code",
    "reviewed the file contents"
  ];

  for (const prohibited of prohibitedClaims) {
    if (fullText.includes(prohibited)) {
      return {
        valid: false,
        error: `Unsupported speculative claim detected: '${prohibited}'. Bug-fixes and internal code inspections must not be claimed without file content inspection evidence.`
      };
    }
  }

  return {
    valid: true,
    data
  };
}

function hasSignificantTokenOverlap(a: string, b: string): boolean {
  const getTokens = (str: string) =>
    new Set(
      str
        .replace(/[^a-zA-Z0-9_/.-]/g, " ")
        .split(/\s+/)
        .map((t) => t.trim())
        .filter((t) => t.length > 2)
    );

  const tokensA = getTokens(a);
  const tokensB = getTokens(b);
  if (tokensA.size === 0 || tokensB.size === 0) return false;

  let common = 0;
  for (const t of tokensA) {
    if (tokensB.has(t)) common++;
  }

  // Overlap ratio relative to the smaller set
  const minSize = Math.min(tokensA.size, tokensB.size);
  return common / minSize >= 0.5;
}

export const THREADKEEPER_GROUNDING_SYSTEM_PROMPT = `You are ThreadKeeper's cognitive grounding engine.
Analyze what observed evidence means for previous assumptions.
Follow these strict rules:
1. observed_facts may contain ONLY facts directly provided in evidence.
2. Do not invent who changed any file.
3. Do not claim currency validation was added or the bug was fixed.
4. Do not claim to have inspected file contents.
5. Interpretation must be clearly weaker than observed fact.
6. If evidence cannot support something, place it in unknowns.
7. Every conclusion must cite supplied evidence IDs.
8. The safest valid conclusion is that the previous assumption requires re-evaluation because its underlying artifact changed.
9. Return valid JSON only, without any markdown formatting or surrounding text.`;

export function buildGroundingPrompt(
  observedFacts: Array<{ evidence_id: string; fact: string }>,
  previousAssumptions: Array<{ statement: string }>
): string {
  const factsText = observedFacts
    .map((f) => `- Evidence ID: ${f.evidence_id}\n  Observed fact: ${f.fact}`)
    .join("\n");

  const assumptionsText = previousAssumptions
    .map((a) => `- ${a.statement}`)
    .join("\n");

  return `Observed evidence:
${factsText}

Previous assumption(s):
${assumptionsText}

IMPORTANT:
"while the user was away" does NOT tell us WHO or WHAT changed any file.
Do not infer automation, teammate activity, deployment, scheduled jobs, or any other cause.

Return JSON ONLY with exactly this structure:
{
  "observed_facts": [
    {
      "statement": "...",
      "evidence_ids": ["..."]
    }
  ],
  "derived_assessment": {
    "status": "still_valid | stale | needs_review | unknown",
    "reason": "...",
    "evidence_ids": ["..."]
  },
  "interpretation": {
    "statement": "...",
    "confidence": "low | medium | high",
    "evidence_ids": ["..."]
  },
  "unknowns": [
    "..."
  ],
  "recommended_next_action": {
    "action": "...",
    "reason": "...",
    "evidence_ids": ["..."]
  }
}`;
}
