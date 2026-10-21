# Decision Log

Use compact ADR-style entries for decisions that should survive agent/chat sessions.

## D-001 — Primary track is Alexa+

**Date:** 2026-10-04  
**Status:** Accepted

We will compete primarily in Alexa+. It fits an ambient continuity experience and lets us build around MCP without requiring physical hardware.

## D-002 — Build a real MCP server, not simulation-only

**Date:** 2026-10-04  
**Status:** Accepted

Although current rules permit a simulated Alexa+ alternative, the target build will include a genuine self-hosted MCP server meeting the required protocol/transport so technical implementation is a strength rather than merely an eligibility path.

## D-003 — AWS is meaningful but replaceable

**Date:** 2026-10-04  
**Status:** Accepted

Bedrock/AgentCore should perform real product functions and support the AWS Builder story. Core domain logic will depend on interfaces so cloud access failure does not destroy development, evaluation, or the central demo.

## D-004 — Primary coding agent is Gemini/Antigravity

**Date:** 2026-10-04  
**Status:** Accepted

Use Gemini/Antigravity as the primary coding environment to preserve the user's Codex allocation for job work. Repository context files carry project knowledge so we do not depend on one model/provider session.

## D-005 — Evidence-first continuity

**Date:** 2026-10-04  
**Status:** Accepted

ThreadKeeper must distinguish observed/derived/inferred/unknown information and preserve evidence provenance. Unsupported memory reconstruction is a product failure, not a cosmetic model issue.

## D-006 — Competition demo begins with developer continuity

**Date:** 2026-10-04  
**Status:** Accepted

Use a developer workspace as the first high-fidelity scenario because versioned code/tests provide strong evidence and a dramatic "state changed while you were away" story. Keep the domain architecture extensible to other knowledge work without building shallow connectors prematurely.

## D-007 — Local-first TypeScript architecture with NodeNext ESM & Zod

**Date:** 2026-10-17
**Status:** Accepted

Implemented Foundation Milestone 1 entirely in Node.js 25 with TypeScript (NodeNext / ESM) and Zod schema validation. Domain logic is strictly separated into `src/domain` and `src/engine` with zero AWS or cloud dependencies, allowing full deterministic testing and local execution.

**Consequences:** The core Continuity Engine runs fast, offline, and zero-cost, while remaining ready for pluggable cloud adapters.

## D-008 — MCP Streamable HTTP implementation using @modelcontextprotocol/sdk

**Date:** 2026-10-17
**Status:** Accepted

Implemented the self-hosted MCP server using the official `@modelcontextprotocol/sdk` (v1.32.1) `StreamableHTTPServerTransport` with stateful session support (`sessionIdGenerator`). All 6 core continuity tools (`capture_checkpoint`, `resume_thread`, `compare_current_state`, `find_decision`, `find_unfinished_work`, `create_handoff`) are exposed and verified over HTTP.

**Consequences:** Meets the competition's primary track requirement of self-hosted MCP >= 2025-11-25 over Streamable HTTP.

## D-009 — Deterministic staleness propagation and evidence integrity verification

**Date:** 2026-10-17
**Status:** Accepted

Enforce strict evidence integrity: every evidence ID referenced by a goal, decision, attempt, assumption, blocker, or next action must exist in the checkpoint's evidence pool. If an artifact changes, dependent assumptions are marked `stale` and dependent decisions are automatically marked for review.

**Consequences:** Prevents hallucinated memory and ensures returning users only receive grounded recommendations.

## D-010 — Safe read-only LocalGitWorkspaceProvider with SHA-256 artifact hashing

**Date:** 2026-10-17
**Status:** Accepted

Implement `LocalGitWorkspaceProvider` using Node's `child_process.execFile` (not shell `exec`) with strictly read-only Git commands (`git rev-parse`, `git log`, `git status --porcelain`, `git diff --stat`, `git ls-files`). Never execute mutating git commands (`commit`, `checkout`, `reset`, `stash`, `push`). Exclude sensitive file patterns (`.env`, `.key`, `id_rsa`, `id_ed25519`, `.pem`, `credentials.json`, `secret*`) from artifact tracking and evidence content. Compute deterministic SHA-256 hashes (`sha256-<hex>`) for tracked and dirty files up to 1MB. Include `git:head` and `git:branch` as first-class workspace artifacts.

**Consequences:** Guarantees user repositories are never mutated or leaked, while providing high-fidelity workspace state inspection, dirty file detection, and diff computation for real interruptions.

## D-011 — BedrockModelProvider with strict grounding contract and deterministic fallback

**Date:** 2026-10-18
**Status:** Accepted

Implement `BedrockModelProvider` targeting Amazon Nova Lite (`amazon.nova-lite-v1:0`) in `ap-southeast-2` using the AWS SDK for JavaScript v3 Bedrock Converse API. Provider selection is strictly explicit via `THREADKEEPER_MODEL_PROVIDER` (defaulting to `local`), ensuring credential presence never silently triggers paid Bedrock calls. The model output is governed by a strict structured grounding contract (`observed_facts`, `derived_assessment`, `interpretation`, `unknowns`, `recommended_next_action`) validated with Zod and referential integrity checks (every cited evidence ID must exist in supplied evidence; observed facts must be grounded; speculative bug-fix claims are rejected). Deterministic Continuity Diff and next actions remain the authoritative source of truth. Any Bedrock invocation failure, schema violation, or hallucination falls back safely and gracefully to deterministic behavior.

**Consequences:** Enables competition-grade semantic reasoning without risking ungrounded hallucinations, runaway cloud bills, or breaking offline testability (all normal test suites use mocks; live verification is restricted to explicit runs).

## Decision template

```markdown
## D-XXX — Title

**Date:** YYYY-MM-DD
**Status:** Proposed | Accepted | Superseded

Decision and rationale.

**Consequences:** ...
**Supersedes / superseded by:** ...
```

