# ThreadKeeper

> **The continuity layer for human attention.**
>
> Your apps remember data. AI remembers conversations. ThreadKeeper remembers what you were doing.

ThreadKeeper is an Alexa+-first ambient continuity agent for people doing complex work. Before an interruption, a user can say **"Alexa, park this"** and ThreadKeeper captures a structured cognitive checkpoint: goal, evidence, decisions, attempts, blockers, open questions, artifacts, assumptions, and the next intended action. When the user returns, **"Alexa, resume my thread"** reconstructs the work state, compares it with what changed while they were away, and produces a grounded resume brief.

This repository is being built for the **Alexa+ track of the Build, Ship, Shape: Amazon Developer Hackathon 2026**.

## The winning thesis

Normal memory systems answer: **"What did we talk about?"**

ThreadKeeper answers harder questions:

- What was I trying to accomplish?
- Why had I reached this conclusion?
- What did I already try so I do not repeat it?
- What changed while I was away?
- Which old assumptions are now stale?
- What is the safest, highest-value next action?
- Can I hand the reconstructed context to another agent without losing the reasoning trail?

The core primitive is a **Cognitive Checkpoint**, represented as a continuity graph:

`Goal -> Evidence -> Attempt -> Decision -> Artifact -> Blocker -> Next Action`

## Intended demo

1. A developer is investigating a real problem.
2. The user says: **"Alexa, park this."**
3. ThreadKeeper creates a cognitive checkpoint backed by evidence from the workspace/tools.
4. The underlying project changes while the user is away.
5. The user returns and says: **"Alexa, resume my thread."**
6. ThreadKeeper reconstructs the previous state, detects stale context, explains what changed, and proposes the next action with evidence.
7. The user can ask **"Why did I decide that?"**, **"What changed?"**, or **"Hand this to my coding agent."**

The demo must feel magical in under 30 seconds and remain technically defensible under inspection.

## Target architecture

```text
Alexa+ experience / web simulator
              |
              v
ThreadKeeper MCP server
MCP >= 2025-11-25 / Streamable HTTP
              |
              v
Continuity Engine
  |           |             |
  v           v             v
Model      Memory          Tools
  |           |             |
Bedrock   AgentCore      AgentCore
           Memory         Gateway
  |           |             |
  +------ provider interfaces ------+
              |
      deterministic fallbacks
```

AWS enhances the system but must not become a single point of failure. Provider boundaries must allow development/test fallbacks.

## Planned MCP capabilities

- `capture_checkpoint` — turn live context into a structured cognitive checkpoint.
- `resume_thread` — reconstruct a useful, evidence-grounded resume brief.
- `compare_current_state` — compute a Continuity Diff between checkpoint state and current reality.
- `find_decision` — answer why a decision was made with supporting evidence.
- `find_unfinished_work` — recover unresolved work across sessions.
- `create_handoff` — generate a structured context packet another human or coding agent can continue from.

Exact tool names may evolve. The behavior and evidence contract matter more than the names.

## Competition targets

Primary: **Alexa+**.

Secondary target: **AWS Builder mini challenge**, using AWS services meaningfully rather than decoratively.

Stretch target: **Open Source mini challenge**, through a separate meaningful open-source contribution or reusable continuity component produced during the hackathon window.

Bonus target: maintain high-quality developer **friction logs** from the start. The official rules allow the Stage 2 panel to apply up to a 10% judging bonus based on friction-log review.

## Non-negotiables

- Ship before expanding.
- No fake integrations. Required technology must be invoked at runtime where the selected entry route requires it.
- No fake test passes, mocked success presented as live success, or unsupported benchmark numbers.
- Every AI conclusion shown as factual must be traceable to evidence or explicitly marked as an inference.
- Never make AWS credentials, API keys, tokens, user content, or private workspace data part of the repository.
- Preserve a non-cloud development path so AWS access/cost problems do not kill the core product.
- Do not turn ThreadKeeper into a generic task manager, chatbot, or "AI remembers everything" product.
- Optimize the three-minute submission demo from the beginning.

## Repository brain

This starter pack is designed so coding agents do not depend on chat history.

- `GEMINI.md` — Gemini CLI entry context; intentionally compact and modular.
- `AGENTS.md` — operating contract for coding agents.
- `docs/CONTEXT.md` — product intent and boundaries.
- `docs/HACKATHON_SOURCE_OF_TRUTH.md` — external competition requirements and official links.
- `docs/ARCHITECTURE.md` — target architecture, contracts, data model, and fallbacks.
- `docs/BUILD_PLAN.md` — phased path from zero to competition build.
- `docs/STATUS.md` — current implementation truth and next actions.
- `docs/DECISIONS.md` — architecture/product decision log.
- `docs/FRICTION_LOG.md` — Amazon developer-experience friction log.
- `.agents/skills/*/SKILL.md` — on-demand specialist playbooks.

## Source-of-truth order

When documents conflict, use this order:

1. Latest explicit user instruction.
2. Official current hackathon/AWS/MCP documentation for external requirements.
3. `docs/HACKATHON_SOURCE_OF_TRUTH.md` for our last verified snapshot of those requirements.
4. `docs/DECISIONS.md` for accepted product/technical decisions.
5. `docs/CONTEXT.md` and `docs/ARCHITECTURE.md` for intended product/system behavior.
6. `docs/STATUS.md` for what is actually implemented now.
7. `docs/BUILD_PLAN.md` for planned work.
8. Old chat summaries, speculative notes, and TODOs.

Implementation and tests are evidence of current behavior, not permission to silently override product decisions.

## Current status

**Foundation / Day 0. No production implementation should be assumed to exist yet.**

Read `docs/STATUS.md` before starting work and update it at meaningful checkpoints.

## Official links

- Hackathon: https://amazonappdev2026.devpost.com/
- Rules: https://amazonappdev2026.devpost.com/rules
- Resources: https://amazonappdev2026.devpost.com/resources
- MCP: https://modelcontextprotocol.io/
- AWS AgentCore: https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/
- AgentCore pricing: https://aws.amazon.com/bedrock/agentcore/pricing/

