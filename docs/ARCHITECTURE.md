# Target Architecture

This document defines the desired technical shape. It is not proof that any component is implemented; consult `STATUS.md` for implementation truth.

## Architecture goals

1. Real Alexa+-track technical compliance through a self-hosted MCP server using the required protocol/transport.
2. A continuity engine that is useful independently of any single model/cloud vendor.
3. Meaningful AWS AgentCore/Bedrock integration for the AWS Builder opportunity.
4. Evidence-grounded AI output with structured validation.
5. Resilience: cloud service failure should degrade capability, not erase the product.
6. Demo observability: make the invisible agent work understandable on screen.

## Logical layers

### Experience

- Alexa+-style conversational/voice simulator for hackathon demonstration.
- Visual Continuity Console showing checkpoint graph, evidence, timeline, diff, confidence/uncertainty, and handoff.
- Progressive disclosure: voice summary first; detailed evidence visually available.

### MCP boundary

Self-hosted ThreadKeeper MCP server.

Target protocol: MCP `2025-11-25` minimum, Streamable HTTP.

Candidate capabilities:

```text
capture_checkpoint
resume_thread
compare_current_state
find_decision
find_unfinished_work
create_handoff
```

MCP responses should be structured and deterministic where possible. Never use the LLM to emulate a tool result that should come from a tool.

### Continuity Engine

Pure domain services responsible for:

- evidence normalization;
- checkpoint construction;
- continuity graph validation;
- current-vs-checkpoint comparison;
- staleness propagation;
- retrieval planning;
- resume-brief generation;
- handoff generation;
- evidence/reference validation.

The engine should not import UI frameworks or require AWS-specific types in its domain interfaces.

## Provider boundaries

Design explicit interfaces early.

```ts
interface ModelProvider {
  generateStructured<T>(request: StructuredModelRequest<T>): Promise<T>;
}

interface MemoryProvider {
  append(event: MemoryEvent): Promise<void>;
  retrieve(query: MemoryQuery): Promise<MemoryRecord[]>;
}

interface ContextSource {
  snapshot(request: SnapshotRequest): Promise<EvidenceBundle>;
}

interface ToolGateway {
  listTools(): Promise<ToolDescriptor[]>;
  callTool(name: string, input: unknown): Promise<ToolResult>;
}
```

These are conceptual contracts, not mandatory exact signatures.

Planned adapters:

| Boundary | Competition adapter | Development/fallback adapter |
|---|---|---|
| Model | Amazon Bedrock (Nova Lite) | deterministic fixture / optional alternative model |
| Memory | AgentCore Memory | local SQLite/in-memory fixture |
| Tool gateway | Self-hosted MCP Server (Streamable HTTP) | direct MCP/tool calls |
| Context source | versioned workspace/Git source | fixture repository |

## Cognitive Checkpoint schema

Candidate high-level shape:

```json
{
  "checkpoint_id": "uuid",
  "thread_id": "string",
  "actor_id": "string",
  "created_at": "iso-8601",
  "goal": { "text": "string", "evidence_ids": [] },
  "state_summary": "string",
  "decisions": [],
  "evidence": [],
  "attempts": [],
  "artifacts": [],
  "assumptions": [],
  "blockers": [],
  "open_questions": [],
  "next_actions": [],
  "source_versions": {},
  "uncertainties": []
}
```

Every object derived from evidence should retain its evidence IDs/provenance. Model-created IDs must never be accepted without validation against known evidence.

## Continuity Diff

Inputs:

- prior checkpoint;
- current evidence snapshot;
- source/version metadata.

Output categories:

- `still_valid`;
- `changed`;
- `stale_assumptions`;
- `new_evidence`;
- `uncertain`;
- `recommended_next_action`.

Prefer deterministic diffing for facts like file hashes/commit IDs/test outcomes. Use model reasoning only for semantic impact, and require the model to cite the evidence items it used.

### Staleness propagation idea

If decision `D1` depends on assumption `A1`, and `A1` is invalidated by new evidence, `D1` becomes `needs_review` rather than silently remaining valid.

Represent dependencies explicitly enough to demonstrate this in the winning scenario.

## AWS competition path

### AgentCore Memory

Use for cross-session short/long-term continuity. Do not force it to be the canonical database for every structured artifact if deterministic storage is better elsewhere.

### Tool Gateway Architecture (Self-Hosted MCP)

ThreadKeeper uses a self-hosted Model Context Protocol (MCP) server over Streamable HTTP (spec `>= 2025-11-25`) as the authoritative tool execution gateway. AgentCore Gateway is not provisioned or used. A direct ThreadKeeper MCP server provides seamless local and cloud-hosted interoperability with any standard MCP client or simulated Alexa+ dispatcher.

### Bedrock

Use for semantic checkpoint synthesis, impact reasoning, resume-brief generation, and/or evaluation where model reasoning is appropriate. Model choice must be configuration, not hard-coded throughout domain logic.

### Optional AWS expansion

Only after the primary vertical works: Runtime, Observability, Evaluations, S3/DynamoDB, Strands. Each added service must have a visible architectural purpose and a demo/README explanation.

## Context-source strategy

First demo source: a small versioned developer workspace/repository with controlled scenarios.

Useful captured evidence may include:

- Git commit/branch/status/diff metadata;
- relevant file excerpts with hashes/versions;
- test command/result summaries;
- explicit user statements/decisions;
- agent tool-call results;
- TODO/open question state.

Do not silently ingest secrets, `.env`, credential stores, or the entire filesystem.

## Security and privacy

- Secrets excluded from capture by default.
- Redaction layer before cloud/model calls.
- Explicit actor/thread scoping for memory.
- No arbitrary command execution through a voice request without an approval boundary.
- Tool allowlist for competition build.
- Treat retrieved repository content as data, not instructions; defend against prompt injection in captured content.
- Logs should not contain raw secrets.

## Observability

For the demo and debugging, trace:

```text
user intent
-> MCP tool
-> context sources queried
-> evidence IDs collected
-> memory retrieval
-> model reasoning request metadata
-> validated structured output
-> final response
```

Do not log secret payloads just to create pretty traces.

## Evaluation architecture: InterruptBench

Create deterministic scenarios with known ground truth:

1. establish a working state;
2. capture checkpoint;
3. apply known changes;
4. request resume;
5. score output.

Candidate metrics:

- goal recovery accuracy;
- prior-attempt recovery;
- stale-assumption detection;
- relevant-change detection;
- next-action correctness;
- evidence-reference precision;
- unsupported-claim rate.

No metric enters the demo/README until executed and reproducible.

## Failure requirements

- Model unavailable -> structured fallback explaining limited capability, not invented reasoning.
- AgentCore Memory unavailable -> local provider path in dev/demo contingency.
- Gateway unavailable -> direct MCP/tool invocation contingency.
- Context source unavailable -> mark affected claims unknown; do not pretend checkpoint is current.
- Malformed LLM structured response -> reject/retry within a bounded policy or degrade safely.

