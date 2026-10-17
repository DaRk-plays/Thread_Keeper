# Build Plan

**Start:** 2026-10-04  
**Official submission deadline:** 2026-10-23 12:00 PM PT  
**Internal target:** submit a complete V1 by 2026-10-20.

This is an aggressive competition plan. We are building a monster, but it must become submission-capable early.

## Phase 0 — Foundation and access

Target: Oct 4–5.

- Join hackathon.
- Request $150 AWS promotional credits while available.
- Confirm AWS account/billing/budget alerts.
- Establish repository brain/context files.
- Confirm development environment: Git, Node 20+, Python 3.10+ if AgentCore CLI path needs it.
- Prove a minimal Bedrock model call if AWS account is ready.
- Prove AgentCore Memory create/write/read if accessible.
- Prove a minimal Streamable HTTP MCP server/client handshake for required protocol family.
- Start friction log immediately.

Exit: we know which cloud primitives actually work in our account and have fallbacks recorded.

## Phase 1 — Skeleton alive

Target: Oct 6–8.

Build one thin vertical:

`park -> capture evidence -> create checkpoint -> persist -> resume -> useful brief`

Requirements:

- versioned fixture/dev workspace;
- validated checkpoint schema;
- self-hosted MCP server;
- one Alexa+-style simulator interaction;
- local memory/model fixture path;
- baseline automated tests.

Exit: a real end-to-end demonstration works even if AWS is temporarily disabled.

## Phase 2 — Submission-capable

Target: Oct 9–12.

- Real AWS integration for planned minimum stack.
- Continuity Diff v1.
- Evidence references visible in UI.
- `why did I decide that?` flow.
- deployment path proven.
- basic README/run instructions.
- first end-to-end demo recording as disaster backup.

Exit: if work stopped here, we could submit a legitimate project.

## Phase 3 — Monster alive

Target: Oct 13–16.

- stale-assumption/dependency propagation;
- temporal reasoning on changed source state;
- structured agent handoff;
- multi-checkpoint timeline/thread recovery;
- polished visual Continuity Console;
- meaningful AgentCore/Bedrock pipeline;
- observability/traces where useful;
- security/redaction pass;
- InterruptBench harness and first scenarios.

Exit: core differentiation is visible and measurable.

## Phase 4 — Competition build

Target: Oct 17–19.

- 15–25 high-quality InterruptBench scenarios if feasible;
- run benchmark and freeze truthful results;
- performance/reliability cleanup;
- polished empty/loading/error/degraded states;
- verify AWS cost controls;
- meaningful open-source contribution/component if we are entering that mini challenge;
- submission architecture graphic/screenshots;
- Devpost draft and product feedback draft;
- turn friction log into submission-ready entries.

Exit: no major feature is required to make the pitch credible.

## Phase 5 — Submit V1

Target: Oct 20.

- production deploy verified;
- clean clone/setup test;
- repo/license/reviewer path correct;
- record final demo under three minutes;
- public video verified;
- Devpost fields completed;
- submit V1;
- preserve evidence of submission.

## Phase 6 — Buffer / polish

Oct 21–23.

Only:

- fix genuine defects;
- improve demo/submission clarity;
- re-verify official rules;
- final documentation polish;
- controlled submission updates allowed before deadline.

Do not introduce a new architectural dependency here.

## Feature priority

### P0 — must work

- park/resume loop;
- real checkpoint;
- evidence grounding;
- real MCP compliance/transport for chosen route;
- continuity diff;
- AWS integration sufficient for AWS Builder claim if entered;
- deployable demo;
- three-minute story.

### P1 — wins points

- stale-assumption propagation;
- decision provenance;
- agent handoff;
- rich continuity console;
- InterruptBench;
- excellent error/degraded states;
- meaningful observability.

### P2 — only after P0/P1 quality

- multiple external work-source connectors;
- proactive reminders;
- multi-user/team continuity;
- extra AWS services without a clear judging story;
- broad autonomous execution.

## Rule for scope expansion

A new feature enters the active build only if it passes at least two tests:

1. materially improves one official judging criterion;
2. strengthens the park/resume/continuity thesis;
3. produces a compelling moment in the three-minute demo;
4. improves measurable evaluation quality;
5. reduces a material reliability/security risk.

One of the two should normally be #2 or #3.

