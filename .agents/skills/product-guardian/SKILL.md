---
name: product-guardian
description: Use when proposing, prioritizing, rejecting, or reshaping ThreadKeeper features or user flows so work strengthens the continuity thesis and competition story.
---

# Product Guardian

## Goal

Keep ThreadKeeper ambitious without letting it collapse into a generic AI assistant or feature collection.

## Read first

- `docs/CONTEXT.md`
- `docs/DECISIONS.md`
- `docs/STATUS.md`
- For competition prioritization: `docs/HACKATHON_SOURCE_OF_TRUTH.md`

## Feature test

For every proposed feature, answer:

1. What interruption/continuity problem does this solve?
2. Which core primitive does it strengthen: capture, reconstruction, diff/staleness, evidence, handoff, ambient interaction?
3. What exact moment would a judge/user see?
4. Does it materially improve Tech, Design, Impact, or Idea quality?
5. What new dependency/failure/cost/security surface does it introduce?
6. Can we prove it works?

Reject or defer features whose strongest justification is "it would be cool" or "other agents have it."

## Protect the magic

The strongest demo transformation is:

```text
I was interrupted and lost my mental state
          ->
ThreadKeeper reconstructs it
          ->
ThreadKeeper notices reality changed
          ->
ThreadKeeper tells me what remains valid and what to do next
```

New features should intensify that transformation.

## UX rule

Design voice for brevity and screen for evidence/detail. Do not make Alexa read a dashboard aloud.

Default resume response should communicate:

- prior goal;
- current delta/risk;
- next action;
- offer to expand.

## Decision output

When evaluating a feature, conclude with one of:

- `BUILD NOW` — core/winning path.
- `BUILD AFTER P0` — high value, not a blocker.
- `EXPERIMENT` — uncertainty requires a time-boxed spike.
- `DEFER` — useful post-hackathon.
- `REJECT` — dilutes product or creates unjustified risk.

If accepted work materially changes scope/architecture, add/update `docs/DECISIONS.md`.

