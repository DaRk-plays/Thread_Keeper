---
name: aws-agentcore
description: Use for AWS Bedrock, AgentCore Memory, Gateway, Runtime, Observability, IAM, budgets, model access, cloud deployment, or AWS Builder mini-challenge work.
---

# AWS + AgentCore

## Goal

Use AWS to create real product capability and a strong AWS Builder story while keeping cost/security/failure bounded.

## Read first

- `docs/ARCHITECTURE.md`
- `docs/HACKATHON_SOURCE_OF_TRUTH.md`
- `docs/STATUS.md`
- current official AWS docs for the exact service/region/model.

AWS behavior and model availability change; verify time-sensitive details.

## Access spike order

Do small isolated proofs before wiring services into the application:

1. verify AWS identity/region;
2. verify budgets/alerts and credit status separately;
3. Bedrock: invoke one chosen model with a tiny request;
4. AgentCore Memory: create/write/read a minimal memory flow;
5. AgentCore Gateway: expose/discover/call one controlled tool if Gateway is in current scope;
6. record exact PROVEN/PARTIAL/BLOCKED state in `docs/STATUS.md`;
7. only then implement production adapters.

## Cost discipline

- No unbounded loops/retries.
- Do not leave persistent expensive compute running unnecessarily.
- Use tiny fixtures during development.
- Prefer usage-based/serverless paths for prototype scale where technically appropriate.
- Make model name, region, and providers configurable.
- Record a friction entry for confusing cost/onboarding behavior when useful.

## Credential discipline

- Never commit AWS credentials or session tokens.
- Prefer standard AWS credential resolution/profile/role flows.
- Scope IAM to necessary actions as architecture stabilizes.
- `.env.example` contains names/placeholders only.
- Sanitize logs and screenshots.

## AgentCore Memory role

Use it for useful cross-session context/memory. Do not force deterministic checkpoint artifacts into a memory abstraction if a normal structured store is the safer canonical representation.

Validate actor/thread separation. Retrieval must not mix unrelated threads.

## Gateway role

Use AgentCore Gateway where tool orchestration/discovery/security meaningfully benefits. ThreadKeeper's direct MCP server remains a first-class path; Gateway failure must not erase the Alexa+ core.

## Bedrock role

Use semantic reasoning only where it earns its cost/uncertainty: checkpoint synthesis, semantic impact/staleness analysis, resume/handoff generation, evaluation.

Do deterministic operations deterministically.

Require structured outputs/schema validation when behavior feeds product logic.

## AWS Builder evidence

Maintain enough evidence to explain:

- exactly which AWS services are used;
- what product responsibility each has;
- where the code invokes them;
- why AWS improves the architecture;
- fallback behavior;
- notable developer friction.

Do not add an AWS service solely for an architecture diagram.

