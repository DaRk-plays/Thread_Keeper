# AWS Cost & Usage Notes

This document records all cloud invocation activity, token usage, and cost dimensions for ThreadKeeper.

## Guiding Principles

1. **Credit Protection:** Never perform unauthorized or unconstrained model calls.
2. **Explicit Provider Opt-In:** The default provider is always `local` (`FixtureModelProvider`). Having AWS credentials present NEVER triggers paid Bedrock calls silently.
3. **Billing Truth Discipline:** Do not claim exact billed dollar amounts until confirmed in the AWS Billing console after billing settles.

---

## Foundation Model Usage (Amazon Bedrock)

### Configuration
* **Model ID:** `amazon.nova-lite-v1:0`
* **Region:** `ap-southeast-2` (Asia Pacific - Sydney)
* **Pricing Tier:** Standard On-Demand Inference
* **Pricing Baseline:** ~$0.00006 per 1,000 input tokens; ~$0.00024 per 1,000 output tokens (subject to AWS rate card)

### Cumulative Invocation Log

| Event | Date | Model | Input Tokens | Output Tokens | Latency | Status | Estimated Cost |
|---|---|---|---|---|---|---|---|
| **Brain Test #1** | 2026-10-18 | `amazon.nova-lite-v1:0` | 127 | 150 | 1,075 ms | Success | < $0.0001 |
| **Brain Test #2** | 2026-10-18 | `amazon.nova-lite-v1:0` | 411 | 298 | 987 ms | Success | < $0.0001 |
| **Milestone 3A Live Verification** | 2026-10-18 | `amazon.nova-lite-v1:0` | 399 | 281 | 1,111 ms | Success | < $0.0001 |

* **Total Live Invocations:** 3
* **Total Cumulative Input Tokens:** 937
* **Total Cumulative Output Tokens:** 729
* **Estimated Incurred Cost:** Usage intentionally minimal; exact billed consumption pending AWS billing settlement (ThreadKeeper hackathon credit allowance: $150; project spend limit: $20)
* **Settled Incurred Cost:** Pending AWS Billing Console cycle settlement

---

## Standing Cloud Resources

* **Persistent Resources:** Exactly One (1)
  - **Resource Name:** `ThreadKeeperHackathonMemory`
  - **Resource ID:** `ThreadKeeperHackathonMemory-KkM33n8BE1`
  - **Resource ARN:** `arn:aws:bedrock-agentcore:ap-southeast-2:175488706501:memory/ThreadKeeperHackathonMemory-KkM33n8BE1`
  - **Region:** `ap-southeast-2`
  - **Retention:** 7-day event expiry
  - **Hourly Infrastructure Cost:** $0.00/hour. No always-on compute infrastructure was provisioned. Usage remains intentionally minimal. Exact billed consumption will be confirmed after AWS billing settles.
* **AgentCore Memory Architecture:**
  - **Native AgentCore Long-Term Semantic Memory:** NOT ENABLED (no strategy configured to avoid IAM execution roles and unnecessary background compute)
  - **ThreadKeeper Cross-Session Discovery:** IMPLEMENTED (provider-level discovery over AgentCore short-term event/session storage)
* **AgentCore Gateway Resources:** None (Planned Milestone 3C)
