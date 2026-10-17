# Developer Friction Log

This log exists for two reasons:

1. turn actual developer problems into better engineering decisions;
2. preserve submission-ready feedback for the hackathon's optional friction-log bonus.

Only log issues involving relevant Amazon/AWS/MCP developer tooling, APIs, SDKs, documentation, onboarding, compatibility, or runtime behavior. Do not manufacture entries.

## Severity

- `S1 Blocker` — cannot progress without workaround/support.
- `S2 Major` — large time loss or breaks important workflow.
- `S3 Moderate` — confusing/incorrect behavior with reasonable workaround.
- `S4 Minor` — polish/documentation issue.

## Entry template

### F-XXX — Short title

**Date:**  
**Tool/API/SDK:**  
**Version/region/environment:**  
**Severity:**  

**Task attempted**  
What were we trying to accomplish?

**Steps taken**

1. ...
2. ...

**Expected**  
...

**Actual**  
...

**Evidence**  
Error code/log/doc URL/reproduction details. Remove secrets and personal data.

**Workaround**  
...

**Actionable suggestion**  
Specific documentation/product/API improvement.

### F-001 — Streamable HTTP transport session ID requirement and dual Accept header negotiation

**Date:** 2026-10-17
**Tool/API/SDK:** `@modelcontextprotocol/sdk` (v1.32.1) / MCP Streamable HTTP
**Version/region/environment:** Node.js v25.9.0 / macOS
**Severity:** S3 Moderate

**Task attempted**
Mounting `StreamableHTTPServerTransport` on an Express / Node HTTP server in stateless mode (`sessionIdGenerator: undefined`) and connecting with standard `fetch` or `StreamableHTTPClientTransport`.

**Steps taken**
1. Configured `const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });`.
2. Sent initialize POST request with header `Content-Type: application/json`.
3. Sent tool call from client.

**Expected**
Stateless requests would be handled transparently without requiring session state or specialized Accept headers.

**Actual**
1. Server returned HTTP 406 (`{"jsonrpc":"2.0","error":{"code":-32000,"message":"Not Acceptable: Client must accept both application/json and text/event-stream"}}`).
2. Subsequent client connection attempts threw `StreamableHTTPError: 500` when `sessionIdGenerator` was `undefined`.

**Evidence**
```text
Transport error: Error: Not Acceptable: Client must accept both application/json and text/event-stream
at WebStandardStreamableHTTPServerTransport.handlePostRequest
Status: 406
```

**Workaround**
1. Configured `sessionIdGenerator: () => randomUUID()` to activate stateful Streamable HTTP sessions.
2. Verified that client transports include `Accept: application/json, text/event-stream`.

**Actionable suggestion**
The MCP SDK documentation should explicitly note that HTTP clients interacting with Streamable HTTP endpoints must send `Accept: application/json, text/event-stream`, and provide a clear example of stateful session generation with Express/Node HTTP servers.

**Status**
Resolved (worked around with stateful session generator).

