# AWS Resource Ledger

This document tracks all AWS cloud infrastructure created for ThreadKeeper.

## Milestone Status: Milestone 3B (AgentCore Persistent Memory)

> **EXACTLY ONE AWS RESOURCE CREATED.**
>
> During Milestone 3B, exactly one Amazon Bedrock AgentCore Memory resource was provisioned in `ap-southeast-2` to provide persistent cognitive continuity across application/process restarts.

---

## Active Resources Ledger

| AWS Service | Region | Resource Name | ARN / ID | Purpose | Cost Behavior | Creation Date | Deletion Procedure | Deletion Date |
|---|---|---|---|---|---|---|---|---|
| Amazon Bedrock AgentCore Memory | ap-southeast-2 | ThreadKeeperHackathonMemory | ARN: `arn:aws:bedrock-agentcore:ap-southeast-2:175488706501:memory/ThreadKeeperHackathonMemory-KkM33n8BE1`<br>ID: `ThreadKeeperHackathonMemory-KkM33n8BE1` | Persistent continuity memory across process restarts | No always-on compute infrastructure was provisioned. Usage remains intentionally minimal. Exact billed consumption will be confirmed after AWS billing settles (7-day event retention). | 2026-10-21 | `aws bedrock-agentcore-control delete-memory --memory-id ThreadKeeperHackathonMemory-KkM33n8BE1 --profile threadkeeper --region ap-southeast-2` | Active |

---

## AWS Budget & Hackathon Credit Status

- **ThreadKeeper Hackathon Credit Allowance:** $150
- **Project Spend Limit:** $20
- **Cloud Usage:** Intentionally minimal (isolated to deterministic verification runners)
- **Billed Consumption:** Exact billed consumption pending AWS billing settlement
