# Agent Operating Contract

These instructions apply to any coding/research agent working in this repository.

## Mission

Build a competition-grade ThreadKeeper submission with genuine technical depth, exceptional demo clarity, and verifiable behavior. We are intentionally ambitious. Ambition does not excuse fragile architecture, fabricated evidence, or failure to ship.

## Work loop

For every non-trivial task:

1. **Orient** — read `docs/STATUS.md`, inspect relevant code, and load only the relevant skill/docs.
2. **Define done** — identify observable acceptance criteria before implementation.
3. **Implement vertically** — prefer an end-to-end working slice over disconnected scaffolding.
4. **Verify** — run the smallest relevant deterministic checks first, then broader checks when justified.
5. **Record truth** — update status/decision/friction docs when reality changed.
6. **Stop deliberately** — report what is proven, what remains, and the next highest-value action.

## Autonomy rules

- Make reversible implementation decisions without blocking on trivial questions.
- Do not silently make irreversible product, architecture, cost, security, or hackathon-eligibility decisions. Record significant decisions in `docs/DECISIONS.md`.
- If current official rules could have changed, verify them before relying on them.
- Never paste, request, or commit secret values. Use environment variables and `.env.example` placeholders.
- Do not run destructive cloud or repository operations without explicit approval.
- Do not introduce a paid external dependency when an existing/free dependency is adequate without calling out the reason and cost risk.

## Truth discipline

Never report:

- a test as passing unless it was actually run successfully;
- an integration as real if it is mocked;
- an AWS service as integrated if the code merely mentions it;
- an MCP tool as working unless a client can discover/call it through the intended transport;
- a benchmark number unless the benchmark was executed against the stated dataset/version;
- deployment as live unless the deployed URL was actually checked.

Use these labels when helpful: `PROVEN`, `PARTIAL`, `MOCKED`, `PLANNED`, `BLOCKED`.

## Product guardrails

ThreadKeeper is not a generic:

- chat assistant;
- todo list;
- note-taking app;
- vector-memory wrapper;
- Git history viewer;
- automatic code generator.

Its differentiator is **continuity after interruption**: reconstruct intent and reasoning, determine what changed, identify stale assumptions, and produce an evidence-grounded next action or handoff.

Every major feature should strengthen at least one of:

1. capture quality;
2. continuity/reconstruction quality;
3. change/staleness detection;
4. evidence/traceability;
5. cross-session/cross-agent handoff;
6. natural Alexa+/ambient interaction.

## Architecture guardrails

- Keep core domain logic independent of UI, AWS SDKs, and storage vendors.
- Use provider interfaces for model, memory, artifact/context sources, and tool gateway capabilities.
- Cloud adapters may fail; core development and evaluation must still run with deterministic/local adapters.
- Prefer structured data and schema validation at model boundaries.
- Evidence IDs referenced by generated output must correspond to real captured evidence.
- Treat user workspace content as sensitive by default.
- Design operations to be retry-safe where practical.
- Cost-bearing calls must be observable and bounded during development.

## Testing policy

At minimum, protect:

- checkpoint schema validation;
- evidence-reference integrity;
- continuity diff behavior;
- stale-context detection;
- provider fallback behavior;
- MCP tool discovery and invocation;
- failure behavior when model/memory/cloud dependencies are unavailable.

Do not chase raw test count. Protect the winning demo path and the architecture's truth claims.

## Hackathon policy

Before making eligibility/requirements assumptions, consult `docs/HACKATHON_SOURCE_OF_TRUTH.md`. If the decision is material and the snapshot may be stale, verify the official Devpost rules/resources and record the verification date.

Preserve friction as evidence: when an Amazon/AWS/MCP developer workflow behaves unexpectedly, add a useful entry to `docs/FRICTION_LOG.md` rather than merely complaining in chat.

## Context efficiency

- Do not re-read the whole repository for a narrow task.
- Do not load all `SKILL.md` files by default.
- Prefer `rg`/targeted inspection.
- Summarize tool output; do not paste massive logs into working context.
- Reuse established decisions rather than re-debating them unless new evidence exists.

## Documentation updates

Update `docs/STATUS.md` after a meaningful vertical milestone, integration change, deployment change, or verified blocker.

Add a decision record when a choice meaningfully changes architecture, product scope, security, cost, evaluation, or submission strategy.

Add a friction log entry when the problem is actionable feedback about a hackathon-required/relevant developer tool, API, SDK, onboarding path, documentation, or runtime behavior.

