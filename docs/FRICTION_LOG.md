# Developer Friction Log — Amazon & AWS Tooling

This document records genuine developer friction encountered during the design, implementation, and verification of ThreadKeeper for the **Build, Ship, Shape: Amazon Developer Hackathon 2026**. 

In accordance with official hackathon rules, these entries are provided as constructive developer feedback for the optional **Stage 1 / Stage 2 Friction Log Judging Bonus (up to 10%)**.

---

## Severity Scale
* `S1 Blocker` — Cannot progress without external intervention or core architectural workaround.
* `S2 Major` — Significant time loss (> 2 hours) or severely degrades developer workflow.
* `S3 Moderate` — Unexpected behavior with a clear, reasonable engineering workaround.
* `S4 Minor` — Ergonomic, documentation, or CLI output polish issue.

---

# Part 1: Amazon Developer Tooling, AWS SDK & Cloud API Friction

### F-001 — AWS MCP (`awsmcp`) Tooling: Python/uvx Dependency and Regional Endpoint Defaults

* **Date:** 2026-10-18
* **Tool / API / SDK:** AWS MCP Server CLI (`awsmcp`)
* **Environment / Region:** macOS / Python 3.12 / `ap-southeast-2`
* **Severity:** S2 Major

**Task Attempted:**  
Configuring the official AWS MCP server to discover regional Bedrock and AgentCore capabilities via AI coding assistants.

**Steps Taken:**  
1. Configured standard MCP client settings pointing to `awsmcp`.
2. Executed client startup using the default AWS MCP invocation command.
3. Observed connection failure.

**Expected:**  
The MCP client would seamlessly establish a connection and inherit the active AWS region from local AWS CLI credentials.

**Actual:**  
1. The tool failed on systems where `uv` / `uvx` was not globally installed, failing silently in client background threads.
2. Once installed, `awsmcp` defaulted internally to `us-east-1` (`https://aws-mcp.us-east-1.api.aws/mcp`) without falling back to `AWS_REGION` or the configured profile's default region.
3. Because our hackathon project was strictly pinned by organization Service Control Policies (SCP) to `ap-southeast-2`, all default MCP operations failed with authorization/endpoint mismatch errors.

**Evidence:**  
```text
Error: Failed to spawn awsmcp: uvx not found in PATH
Endpoint resolution: https://aws-mcp.us-east-1.api.aws/mcp (HTTP 403 Forbidden - Region restricted by SCP)
```

**Workaround:**  
1. Explicitly installed `uv` via standalone installer.
2. Repaired client configuration to explicitly specify the regional endpoint (`https://aws-mcp.ap-southeast-2.api.aws/mcp`), `--region ap-southeast-2`, `--profile threadkeeper`, and `--read-only`.

**Actionable Suggestion:**  
1. The AWS MCP distribution should provide a standalone binary or npm package alongside Python `uvx`.
2. `awsmcp` should automatically read `AWS_REGION` or `~/.aws/config` default region rather than hardcoding `us-east-1`.

---

### F-002 — Bedrock AgentCore Memory: Hierarchical Session Discovery and Lack of Global Event Queries

* **Date:** 2026-10-21
* **Tool / API / SDK:** AWS SDK for JavaScript v3 (`@aws-sdk/client-bedrock-agentcore`)
* **Environment / Region:** Node.js v25.9.0 / `ap-southeast-2`
* **Severity:** S3 Moderate

**Task Attempted:**  
Recovering a previously parked cognitive checkpoint across a process death boundary where the fresh process only knows the `threadId` (which maps to an actor or session).

**Steps Taken:**  
1. Created a new `AgentCoreMemoryClient`.
2. Attempted to query the latest checkpoint event across the memory resource.

**Expected:**  
A single unified query API such as `GetLatestEventByActor` or `QueryEvents({ memoryId, actorId, limit: 1 })` to fetch the most recent cognitive state.

**Actual:**  
AgentCore Memory's short-term event APIs enforce a strict three-tier hierarchy:
`Memory` -> `ListActors` -> `ListSessions` -> `ListEvents`.
Events cannot be queried globally across sessions; they are strictly scoped inside individual session IDs. To find the latest checkpoint for a thread, the client is forced to issue sequential API calls: list sessions for the actor, sort sessions chronologically, and query events for that specific session.

**Evidence:**  
```text
ResourceNotFoundException: SessionId is required to query events within memory ThreadKeeperHackathonMemory-KkM33n8BE1
```

**Workaround:**  
Implemented a multi-tier resolution loop in `AgentCoreMemoryProvider`:
1. Queries `ListSessionsCommand` filtered by actor ID.
2. Identifies the active session ID matching the thread.
3. Calls `ListEventsCommand` on that specific session to retrieve the serialized checkpoint payload.

**Actionable Suggestion:**  
Provide a top-level `GetLatestEvent` or `SearchEvents` API that accepts an `actorId` without requiring an explicit `sessionId`, simplifying process-death recovery workflows.

---

### F-003 — Amazon Bedrock Converse API: Lack of Native JSON Schema Grammar Enforcement

* **Date:** 2026-10-18
* **Tool / API / SDK:** Amazon Bedrock Converse API (`@aws-sdk/client-bedrock-runtime`) / Amazon Nova Lite
* **Environment / Region:** `ap-southeast-2`
* **Severity:** S3 Moderate

**Task Attempted:**  
Requesting structured, grounded epistemic reasoning JSON from Amazon Nova Lite (`amazon.nova-lite-v1:0`) via the Bedrock Converse API.

**Steps Taken:**  
1. Configured Converse API request with `inferenceConfig: { temperature: 0.0 }`.
2. Provided JSON schema instructions in the system prompt.
3. Parsed model response.

**Expected:**  
A dedicated API parameter (e.g. `response_format: { type: "json_schema", schema: ... }`) ensuring the model's raw token stream strictly adheres to the schema.

**Actual:**  
The Bedrock Converse API does not currently offer a native JSON schema constraint parameter. Without strict defensive prompting, models occasionally wrap JSON in markdown fences (` ```json `) or preface output with conversational pleasantries (*"Here is the evaluation:"*), which breaks automated JSON parsers.

**Evidence:**  
```text
SyntaxError: Unexpected token '`', "```json\n{\n"... is not valid JSON
```

**Workaround:**  
1. Added strict formatting instructions: *"Return JSON ONLY with no markdown backticks, no code formatting, and no commentary."*
2. Built a defensive regex pre-parser that strips markdown code blocks if present before validating against Zod schemas.

**Actionable Suggestion:**  
Introduce native JSON Schema decoding / grammar constraints directly into the Bedrock Converse API request parameters.

---

### F-004 — Model Context Protocol: Streamable HTTP Header Negotiation & Session ID Requirements

* **Date:** 2026-10-17
* **Tool / API / SDK:** `@modelcontextprotocol/sdk` (v1.32.1) / MCP Streamable HTTP
* **Environment / Region:** Node.js v25.9.0 / Express
* **Severity:** S3 Moderate

**Task Attempted:**  
Mounting `StreamableHTTPServerTransport` on an Express HTTP server in stateless mode (`sessionIdGenerator: undefined`) and connecting with standard `fetch` or `StreamableHTTPClientTransport`.

**Steps Taken:**  
1. Configured `const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });`.
2. Sent initialize POST request with header `Content-Type: application/json`.
3. Sent tool call from client.

**Expected:**  
Stateless requests would be handled transparently without requiring session state or specialized Accept headers.

**Actual:**  
1. Server returned HTTP 406 (`{"jsonrpc":"2.0","error":{"code":-32000,"message":"Not Acceptable: Client must accept both application/json and text/event-stream"}}`).
2. Subsequent client connection attempts threw `StreamableHTTPError: 500` when `sessionIdGenerator` was `undefined`.

**Evidence:**  
```text
Transport error: Error: Not Acceptable: Client must accept both application/json and text/event-stream
at WebStandardStreamableHTTPServerTransport.handlePostRequest
Status: 406
```

**Workaround:**  
1. Configured `sessionIdGenerator: () => randomUUID()` to activate stateful Streamable HTTP sessions.
2. Verified that client transports include `Accept: application/json, text/event-stream`.

**Actionable Suggestion:**  
The MCP SDK documentation should explicitly note that HTTP clients interacting with Streamable HTTP endpoints must send `Accept: application/json, text/event-stream`, and provide a clear example of stateful session generation with Express/Node HTTP servers.

---

### F-005 — AWS SDK Named Profile Resolution in Child Process Environments

* **Date:** 2026-10-21
* **Tool / API / SDK:** AWS SDK for JavaScript v3 / AWS CLI
* **Environment / Region:** macOS / Node.js child processes / `ap-southeast-2`
* **Severity:** S3 Moderate

**Task Attempted:**  
Executing automated integration tests and pre-demo verifiers that spawn independent Node.js processes to prove persistence across process restarts.

**Steps Taken:**  
1. Authenticated locally with named profile `threadkeeper`.
2. Executed a verification script via `node dist/cli/verify-demo.js`.
3. Script spawned child processes or invoked SDK clients without explicitly re-exporting `AWS_PROFILE`.

**Expected:**  
The AWS SDK default credentials chain in child processes would automatically inherit the calling environment's active profile or fall back cleanly.

**Actual:**  
Child processes defaulted to the global default profile in `~/.aws/credentials`. If the default profile pointed to `us-east-1` or lacked Bedrock permissions, child processes failed with `UnrecognizedClientException` or SCP access rejections, even though the parent shell was fully authenticated.

**Evidence:**  
```text
AccessDeniedException: User: ... is not authorized to perform: bedrock:Converse on resource: ... with an explicit deny (Region us-east-1 not permitted by SCP)
```

**Workaround:**  
Added explicit environment injection in all CLI entry points:
```ts
if (!process.env.AWS_PROFILE) process.env.AWS_PROFILE = "threadkeeper";
if (!process.env.AWS_REGION) process.env.AWS_REGION = "ap-southeast-2";
```

**Actionable Suggestion:**  
AWS SDK v3 should provide a more descriptive error log when credentials fail, explicitly listing which profile and region were resolved from the credentials chain.

---

# Part 2: Ecosystem & Workspace Engineering Friction

### F-006 — Git CLI Porcelain Whitespace Ingestion in Automated Continuity Agents

* **Date:** 2026-10-17
* **Tool / API / SDK:** Git CLI (`git status --porcelain=v1`)
* **Environment / Region:** Git 2.39+ / Node.js child_process
* **Severity:** S3 Moderate

**Task Attempted:**  
Parsing `git status --porcelain=v1` to reliably identify staged, unstaged, and untracked files in local developer workspaces.

**Steps Taken:**  
1. Captured Git status via `execFile("git", ["status", "--porcelain=v1"])`.
2. Passed stdout through a generic CLI wrapper returning `stdout.trim()`.
3. Extracted status flags from index 0/1 and path from `line.slice(3).trim()`.

**Expected:**  
All file paths would parse identically whether staged (`"M  <file>"`), unstaged (`" M <file>"`), or untracked (`"?? <file>"`).

**Actual:**  
When the first entry in porcelain output is an unstaged modification, column 0 is a space character (`" M src/payment.ts"`). Applying `stdout.trim()` stripped this leading space from the entire output string, turning the first line into `"M src/payment.ts"`. Consequently:
1. Index and worktree status inverted (treated unstaged change as staged).
2. Slicing from index 3 chopped the first letter off the path (e.g. `"src/payment.ts"` became `"rc/payment.ts"`).
3. The corrupted path bypassed `git ls-files` deduplication, producing phantom duplicate artifacts and corrupted continuity diff rationales.

**Evidence:**  
```text
Raw stdout:       " M src/payment.ts\n?? src/currency.ts\n"
stdout.trim():    "M src/payment.ts\n?? src/currency.ts"
line.slice(3):    "rc/payment.ts"  <-- 's' truncated!
```

**Workaround:**  
1. Switched `runGit` wrapper from `stdout.trim()` to `stdout.trimEnd()` so leading whitespace in column 0 is preserved.
2. Added defensive column parsing in `getFileStatuses`: checks if `line[2] === " "` (standard) or `line[1] === " "` (defensive fallback if leading space was trimmed upstream).
3. Applied `path.normalize(cleanPath).replace(/^(\.\/|\/)/, "")` for safe path canonicalization.

**Actionable Suggestion:**  
Developer tooling, CLI wrappers, and continuity agents parsing Git porcelain output must never call `String.prototype.trim()` on the raw output string because column 0 is an information-bearing column where space denotes an unmodified index state.
