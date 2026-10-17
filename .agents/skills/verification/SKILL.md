---
name: verification
description: Use for tests, bug fixes, evaluation, InterruptBench, reliability work, evidence claims, performance claims, or deciding whether a capability is genuinely complete.
---

# Verification + Evaluation

## Principle

The submission must be impressive because it works, not because the README is confident.

## Verification ladder

For each capability, prefer:

1. schema/unit tests;
2. domain integration test with deterministic providers;
3. real adapter integration test;
4. end-to-end winning-path test;
5. deployed smoke test where applicable.

Do not run expensive broad suites blindly when a focused failure can answer the question.

## Critical invariants

- Every referenced evidence ID exists.
- Evidence provenance survives checkpoint -> memory -> resume.
- Old evidence is not represented as current without comparison.
- Deterministic source changes produce deterministic diff facts.
- Model inference is labeled/validated separately from observed facts.
- A failed dependency produces controlled degraded behavior.
- Handoff does not invent attempts/decisions that never occurred.

## InterruptBench

Each scenario should define:

```text
initial workspace state
user goal
captured evidence
expected checkpoint essentials
interruption change-set
resume request
ground-truth valid/stale/changed facts
acceptable next action(s)
```

Prefer quality scenarios covering distinct failure modes over hundreds of weak synthetic cases.

Candidate metrics:

- goal recovery;
- attempted-work recovery;
- stale-assumption recall/precision;
- relevant-change recall/precision;
- next-action correctness;
- evidence citation precision;
- unsupported claim rate.

Define metric formulas before publishing numbers.

## Claim gate

Before adding a number to README/demo/Devpost:

- record benchmark commit/version;
- record scenario count;
- run the evaluation cleanly;
- save machine-readable results;
- verify metric calculation;
- state important limitations.

No cherry-picking a single successful run without disclosure.

## Bug-fix rule

Reproduce -> add/identify failing check -> fix -> rerun focused check -> run relevant regression surface.

Do not rewrite unrelated architecture during a narrow bug fix.

