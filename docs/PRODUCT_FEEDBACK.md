# Product Feedback for Amazon & MCP Teams

This document provides constructive, actionable feedback on developer tooling, SDKs, and cloud APIs evaluated during the implementation of ThreadKeeper for the **Build, Ship, Shape: Amazon Developer Hackathon 2026**.

---

## A. Alexa+ / MCP Hackathon Developer Path

### 1. What We Used It For
We used the Alexa+ track guidelines to architect an ambient, voice-first continuity system using a self-hosted Model Context Protocol (MCP) server over Streamable HTTP paired with a conversational web simulator.

### 2. What Worked Well
* **Embracing Open Standards:** Choosing MCP as the architectural interface for Alexa+ is an outstanding strategic choice. It decouples conversational design from proprietary voice skill models and lets developers expose capabilities through structured JSON-RPC tools that any agentic client can consume.
* **Track Flexibility:** Providing alternative paths (Agent Skill, self-hosted MCP server, or conversational simulator) allowed us to build genuine technical depth without being blocked by gated private preview access.

### 3. Onboarding Experience
* The Devpost track description and FAQ were clear about protocol versions (MCP >= 2025-11-25) and transport expectations (Streamable HTTP).
* However, early confusion existed around whether official Alexa+ developer tools (Category SDK, MCP Toolkit, CLI, Web Simulator) were required. Finding the clarification in the FAQ that these tools are restricted to select partners took digging.

### 4. Concrete Friction
* **Simulator Availability Gap:** General hackathon participants do not have access to an official Alexa+ sandbox or web simulator. While the allowance for a custom web simulator is appreciated, an official, lightweight local CLI simulator or mock Alexa+ harness would allow builders to verify exact voice interaction models without guessing speech-bubble styling.

### 5. Suggested Improvement
* Release a public, unauthenticated local Alexa+ emulator (e.g. an `alexa-plus-sim` npm package or Docker image) that takes an MCP Streamable HTTP endpoint and renders a standard Echo Show / ambient card interface locally.

### 6. Would We Use It Again and Why?
* **Yes.** The combination of ambient voice input and MCP tool execution is the most compelling interaction model for real-world developer workflows.

---

## B. Model Context Protocol SDK (`@modelcontextprotocol/sdk`) & Streamable HTTP

### 1. What We Used It For
Hosting our core domain capabilities (`capture_checkpoint`, `resume_thread`, `compare_current_state`, etc.) over Streamable HTTP mounted on an Express / Node.js web server.

### 2. What Worked Well
* High-level abstractions (`McpServer`, `ResourceTemplate`, `StreamableHTTPServerTransport`) make registering tools with Zod input schemas clean, declarative, and type-safe.
* Once properly negotiated, client-server tool discovery (`tools/list`) and invocation (`tools/call`) operated with 100% deterministic reliability.

### 3. Onboarding Experience
* Smooth for standard stdio transports, but required substantial trial-and-error for Streamable HTTP due to evolving specification changes between legacy SSE and modern Streamable HTTP.

### 4. Concrete Friction
* **Header Negotiation & Session ID Requirements:** When mounting `StreamableHTTPServerTransport` with `sessionIdGenerator: undefined` (stateless mode), incoming HTTP requests fail with HTTP 406 (`Not Acceptable: Client must accept both application/json and text/event-stream`). Furthermore, omitting a session generator caused internal 500 errors on subsequent requests.
* **Documentation Gaps:** The official SDK examples heavily prioritize stdio or older SSE patterns; working end-to-end examples of stateful Streamable HTTP servers mounted in Express/Node were sparse.

### 5. Suggested Improvement
* Update official MCP SDK documentation and README to provide explicit Express/Fastify recipes demonstrating Streamable HTTP with dual `Accept` headers and `sessionIdGenerator` configuration.

### 6. Would We Use It Again and Why?
* **Yes.** Streamable HTTP provides a massive improvement over raw stdio for web applications, enabling unified HTTP servers that serve both visual consoles and agentic tool endpoints simultaneously.

---

## C. Amazon Bedrock Converse API & Amazon Nova Lite (`amazon.nova-lite-v1:0`)

### 1. What We Used It For
Evaluating the semantic gap between previous developer hypotheses and modified repository files; generating strictly grounded assessments (Observed, Derived, Inferred, Unknown) and safe next actions.

### 2. What Worked Well
* **Speed and Cost Efficiency:** Amazon Nova Lite provides exceptionally fast inference (often < 1,500 ms round-trip) at very low cost, making it ideal for interactive conversational agents.
* **Converse API Design:** The unified Converse API (`@aws-sdk/client-bedrock-runtime`) provides a clean, standardized message schema (`messages`, `system`, `inferenceConfig`) across all Bedrock foundation models without requiring model-specific request shapes.

### 3. Onboarding Experience
* Rapid and straightforward. Adding model access in the AWS Bedrock console in `ap-southeast-2` was instant, and the AWS SDK v3 client worked seamlessly with standard profile credentials.

### 4. Concrete Friction
* **Structured Output Enforcement:** While Nova Lite followed JSON format instructions well at `temperature: 0`, Bedrock Converse API does not yet offer a native `response_format: { type: "json_schema", schema: ... }` parameter equivalent to some competitors. Developers must enforce JSON schemas through rigorous system prompting and downstream client-side Zod validation.

### 5. Suggested Improvement
* Add native JSON schema enforcement / grammar-constrained decoding to the Bedrock Converse API request parameters to guarantee 100% syntactically valid schema compliance directly at the model boundary.

### 6. Would We Use It Again and Why?
* **Yes.** Nova Lite strikes the ideal balance of speed, cost, and reasoning capability for real-time developer continuity assistants.

---

## D. Amazon Bedrock AgentCore Memory

### 1. What We Used It For
Providing persistent cloud-backed storage for Cognitive Checkpoints that survives local application crashes, process restarts, and machine reboots.

### 2. What Worked Well
* **Managed Session State:** Storing cognitive checkpoints within actor sessions via short-term event APIs eliminates the need to provision, configure, and maintain separate DynamoDB tables or PostgreSQL databases.
* **7-Day Retention:** The automatic retention lifecycle ensures zero maintenance overhead and eliminates runaway storage accumulation.
* **Zero Infrastructure Overhead:** Creating a basic memory resource without custom IAM execution roles or KMS keys carries zero standing compute cost ($0.00/hour).

### 3. Onboarding Experience
* Creating the memory resource via the AWS CLI (`aws bedrock-agentcore-control create-memory`) was fast and completed in seconds.
* SDK installation was straightforward via `@aws-sdk/client-bedrock-agentcore`.

### 4. Concrete Friction
* **Session Discovery & Hierarchy Nuances:** Re-discovering previously stored checkpoints across process restarts requires navigating a strict hierarchy: `ListActors` -> `ListSessions` -> `ListEvents`. Because events are scoped strictly within a session, fetching the "latest checkpoint across all threads" requires iterative queries.
* **Semantic Strategy Constraints:** Enabling native AgentCore semantic long-term memory requires configuring custom IAM execution roles and incurring background LLM extraction compute. For hackathon entrants with strict cost and security guardrails, implementing provider-level discovery over standard event storage was preferable.

### 5. Suggested Improvement
* Introduce a native `GetLatestEventByActor` or `QueryEvents` API that allows querying events across an actor's sessions with metadata filtering, avoiding the need for multi-tier pagination (`ListSessions` -> `ListEvents`).

### 6. Would We Use It Again and Why?
* **Yes.** For agentic systems that require state to outlive individual process lifecycles without spinning up heavy databases, AgentCore Memory is a massive productivity accelerator.

---

## E. AWS CLI & Authentication Resolution

### 1. What We Used It For
Cloud preflight verification, identity checks (`aws sts get-caller-identity`), and memory resource provisioning.

### 2. What Worked Well
* AWS CLI v2 with named profiles (`--profile threadkeeper`) makes isolating credentials and regional targeting clean and reproducible.

### 3. Concrete Friction
* **Environment Variable Resolution in Child Processes:** When child processes or automated runners execute, `AWS_PROFILE` must be explicitly passed down. If `AWS_PROFILE` is not exported, SDK clients silently fall back to the default profile, which often targets `us-east-1` and causes regional Service Control Policy (SCP) rejections.
* **AWS MCP Tooling Defaults:** The AWS MCP server CLI (`awsmcp`) defaulted to `us-east-1` and unauthenticated endpoints unless explicitly configured with `--region ap-southeast-2` and SigV4 flags.

### 4. Suggested Improvement
* Improve error messages in AWS SDKs when a profile or region is inferred from defaults, explicitly warning developers if an operation is redirected to `us-east-1` when credentials originate from a regionally constrained profile.

### 5. Would We Use It Again and Why?
* **Yes.** AWS Named Profiles and SigV4 authentication remain the enterprise gold standard for secure cloud credential management.
