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

## D-012 — AgentCore Persistent Memory architecture and process-death continuity

**Date:** 2026-10-21
**Status:** Accepted

Implement `AgentCoreMemoryProvider` targeting Amazon Bedrock AgentCore Memory in `ap-southeast-2` (`ThreadKeeperHackathonMemory`, ID: `ThreadKeeperHackathonMemory-KkM33n8BE1`) using the AWS SDK for JavaScript v3 (`@aws-sdk/client-bedrock-agentcore`). Provider selection is strictly explicit via `THREADKEEPER_MEMORY_PROVIDER` (defaulting to `local`), ensuring credential presence never silently invokes AWS AgentCore Memory.

The memory resource is provisioned with 7-day retention without requiring custom IAM roles or KMS keys, ensuring predictable zero standing costs ($0.00). Checkpoints are stored as structured JSON payloads in actor session events (`actor_id`, `thread_id` -> `sessionId`, `checkpoint_id` in metadata). Reconstructed checkpoints undergo strict schema validation via `validateCheckpoint()`.

Native AgentCore long-term Semantic Memory is explicitly **NOT ENABLED** (to eliminate custom IAM execution role requirements and avoid background LLM extraction costs). Instead, ThreadKeeper provider-level cross-session discovery over AgentCore short-term event/session storage is **IMPLEMENTED** directly within `AgentCoreMemoryProvider.searchMemory()`.

To survive process crashes/restarts, the provider queries actors and sessions using `ListActorsCommand`, `ListSessionsCommand`, and `ListEventsCommand`, ensuring that thread history and cognitive checkpoints can be fully recovered in fresh application instances with zero in-memory cache. Continuity Diff runs against the restored AgentCore state, accurately detecting file mutations and flagging stale assumptions across process restarts. Normal test suites use Vitest mocks, while live verification is isolated to `npm run verify:memory`.

**Consequences:** Enables persistent, cloud-backed cognitive continuity across application lifecycles and machine boundaries while keeping the core domain completely decoupled from cloud storage vendors and guaranteeing zero-cost offline local fallback.

## D-013 — Judge-Ready Alexa+ Vertical Slice Architecture and Epistemic Grounding Contract

**Date:** 2026-10-21
**Status:** Accepted

Implement a competition-grade, judge-ready conversational continuity slice for the Alexa+ hackathon track. The vertical slice ties together the real Git workspace provider, AWS Bedrock AgentCore Memory (`ThreadKeeperHackathonMemory-KkM33n8BE1` in `ap-southeast-2`), and Amazon Nova Lite semantic interpretation behind an ambient conversational interface (`AlexaDispatcher`).

Key architectural principles:
1. **Conversational Intent Dispatcher (`AlexaDispatcher`):** Maps natural developer phrases (`"Alexa, park this."`, `"Alexa, where was I?"`, `"Alexa, what changed?"`, `"Alexa, what should I do next?"`, `"Alexa, why is that assumption stale?"`) to deterministic domain continuity operations.
2. **Concise, Spoken Epistemic Response:** Spoken Alexa answers cleanly separate:
   - What the user was doing (Goal & context)
   - What changed while away (Observed Git evidence)
   - What needs review (Derived stale assumptions and affected decisions)
   - What is unknown (Explicit grounding boundaries: unknown author/intent, unverified fixes)
   - Safe next step (Evidence-grounded action with domain-aware recommendation)
3. **Visual Continuity Console (THEN vs NOW & Assessment):** Side-by-side comparison of baseline captured state versus current reality, displaying 4 distinct epistemic assessment cards (Observed Facts, Derived Knowledge, Inferred Context, Unknowns), subtle provenance badges (`Git Evidence`, `AgentCore Memory`, `Nova Lite`, `Grounded`, `Needs Review`), and interactive command chips.
4. **Reproducible Demo Fixture Stepper (`demo-fixture.ts` & `verify-demo.ts`):** Programmatic one-touch demo workflow demonstrating the core story:
   - Developer working on multi-currency payment prototype in real Git repo.
   - User says "Alexa, park this" -> cognitive checkpoint saved to AWS AgentCore Memory.
   - Process terminates completely.
   - Controlled interruption: external modification adds currency whitelist validation to `src/payment.ts`.
   - Fresh process starts -> user asks "Alexa, where was I?".
   - Checkpoint restored from AgentCore, Continuity Diff computed, stale assumption detected, and Nova Lite provides grounded semantic reasoning without hallucination.
5. **Domain-Aware Recommendation Copy:** Context-sensitive recommendations replace generic placeholders with domain-specific guidance (e.g. `"Re-evaluate assumption for src/payment.ts and inspect the changed currency-validation logic before proceeding."`).
6. **Zero Cloud Invocations in Unit Tests:** All 12 Alexa unit tests and 88 overall unit tests run in <2 seconds with 100% deterministic local mocks; live AWS testing is strictly isolated to explicit verification runners (`verify:demo`, `verify:memory`, `verify:bedrock`).

**Consequences:** Produces an end-to-end, reproducible, competition-grade vertical slice for the Alexa+ Developer Hackathon 2026 with verified persistence across process restarts, strict grounding integrity, and verifiable zero-cost local testability.

## Decision template

```markdown
## D-XXX — Title

**Date:** YYYY-MM-DD
**Status:** Proposed | Accepted | Superseded

Decision and rationale.

**Consequences:** ...
**Supersedes / superseded by:** ...
```

