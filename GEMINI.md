# ThreadKeeper — Gemini Project Context

You are working on **ThreadKeeper**, an Alexa+-first continuity agent being built to compete seriously in the Amazon Build, Ship, Shape Developer Hackathon 2026.

The repository, not prior chat history, is the durable project brain.

@./AGENTS.md
@./docs/CONTEXT.md
@./docs/HACKATHON_SOURCE_OF_TRUTH.md
@./docs/STATUS.md

## Context loading policy

Keep always-loaded context small. Read deeper documents only when the task requires them:

- Architecture/integration/schema work -> read `docs/ARCHITECTURE.md` and `.agents/skills/mcp-alexa/SKILL.md` or `.agents/skills/aws-agentcore/SKILL.md` as relevant.
- Product/feature decisions -> read `.agents/skills/product-guardian/SKILL.md` and `docs/DECISIONS.md`.
- Tests, evaluation, bug fixes, claims -> read `.agents/skills/verification/SKILL.md`.
- Demo, README, Devpost, judging, final polish -> read `.agents/skills/submission/SKILL.md`.
- Planning -> read `docs/BUILD_PLAN.md` and `docs/DECISIONS.md`.

Do not load every skill for every task.

## First action in a fresh session

1. Read the automatically loaded context above.
2. Inspect the repository before assuming code exists.
3. Read the relevant on-demand skill for the requested task.
4. State the current checkpoint in one compact sentence: **current state -> requested goal -> verification target**.
5. Work autonomously within scope.

Use `/memory show` when debugging context-loading issues and `/memory reload` after changing project context files.

