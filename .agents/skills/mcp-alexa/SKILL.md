---
name: mcp-alexa
description: Use for ThreadKeeper MCP protocol, Streamable HTTP, tool schemas, Alexa+ simulator behavior, interoperability, or Alexa+ track compliance work.
---

# MCP + Alexa+ Integration

## Before coding

Read:

- `docs/HACKATHON_SOURCE_OF_TRUTH.md`
- `docs/ARCHITECTURE.md`
- official current MCP documentation for the exact SDK/version being used.

Do not trust old SSE-era tutorials when implementing Streamable HTTP.

## Competition constraints

Our target is a self-hosted MCP server compatible with the hackathon's required MCP version family and Streamable HTTP. The current snapshot says minimum `2025-11-25`; re-verify if the official rules change.

## Implementation order

1. Pin SDK/runtime versions.
2. Implement the smallest server with one health/test tool.
3. Prove `initialize`/capability discovery behavior appropriate to the negotiated protocol version.
4. Prove `tools/list`.
5. Prove one `tools/call` over actual Streamable HTTP.
6. Add ThreadKeeper domain tools one by one.
7. Add integration tests using a real MCP client library where practical.
8. Capture sanitized trace/evidence for demo/debugging.

## Tool design

Tools should represent domain capabilities, not database CRUD.

Prefer:

- `capture_checkpoint`
- `resume_thread`
- `compare_current_state`
- `find_decision`
- `create_handoff`

Avoid a huge surface of tiny tools unless orchestration evidence shows it is needed.

Each tool needs:

- narrow description;
- strict input schema;
- structured output;
- explicit error contract;
- actor/thread scoping;
- no implicit destructive actions.

## Alexa+ simulator

The simulator must demonstrate why voice/ambient interaction belongs:

- "park this" is effortless at interruption time;
- "resume my thread" yields a concise voice response;
- rich evidence/continuity graph appears visually;
- follow-ups like "what changed?" and "why?" drill down naturally.

Do not pretend the web simulator is a physical Alexa device. Describe exactly what is simulated versus what is real.

## Verification gate

Do not mark MCP integration PROVEN until:

- server starts cleanly;
- intended protocol/transport is confirmed;
- a real client discovers tools;
- a real client calls the winning-path tool;
- invalid input returns controlled errors;
- README contains reproducible run instructions.

Any relevant onboarding/protocol/documentation friction belongs in `docs/FRICTION_LOG.md`.

