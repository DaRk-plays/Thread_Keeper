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

## Decision template

```markdown
## D-XXX — Title

**Date:** YYYY-MM-DD
**Status:** Proposed | Accepted | Superseded

Decision and rationale.

**Consequences:** ...
**Supersedes / superseded by:** ...
```

