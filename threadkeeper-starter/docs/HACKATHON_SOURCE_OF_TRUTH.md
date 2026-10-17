# Hackathon Source of Truth

**Competition:** Build, Ship, Shape: Amazon Developer Hackathon 2026  
**Snapshot verified:** 2026-10-04  
**Official rules prevail over this file if they change.**

## Official sources

- Overview: https://amazonappdev2026.devpost.com/
- Rules: https://amazonappdev2026.devpost.com/rules
- Resources: https://amazonappdev2026.devpost.com/resources
- MCP: https://modelcontextprotocol.io/
- AgentCore docs: https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/

## Timing

Official submission deadline: **October 23, 2026 at 12:00 PM Pacific Time**. At the currently applicable PDT offset, this is approximately **October 24, 2026 at 12:30 AM IST**. Do not plan to submit at the deadline.

Judging is scheduled for November 9–20, 2026, with winners announced on or around December 3, 2026, per the rules snapshot.

## Eligibility snapshot

The hackathon is open to individuals who have reached the age of majority where they reside, subject to the countries/territories and conflict restrictions listed in the official rules. India is not listed among the named exclusions in the 2026-10-04 rules snapshot.

## Our primary track: Alexa+

Official rules snapshot permits:

- a working Agent Skill; or
- a self-hosted MCP server implementing **MCP 2025-11-25 or later** over **Streamable HTTP**; or
- the specified simulated Alexa+ alternative using an AI/agentic tool, with the simulation source in the repository and working behavior shown in the demo.

Our planned competition route is stronger than the minimum simulation route: **real ThreadKeeper MCP server + Alexa+-style simulator/experience**.

Do not downgrade to a basic MCP wrapper. The rules' judging guidance explicitly treats basic single-turn Q&A/basic wrappers as obvious and cites agentic orchestration and context-aware state across sessions as creative Alexa+ directions.

## Mini challenges

### AWS Builder

Any primary-track project incorporating documented AWS services such as Bedrock, AgentCore, Strands, Kiro Crew, SageMaker, etc. can qualify under the snapshot rules.

Our plan: make AgentCore Memory/Gateway and Bedrock materially responsible for continuity behavior, not decorative architecture boxes.

### Open Source

The snapshot rules require an **additional** open-source project or contribution during the hackathon window alongside the primary submission. It may be a new repo or meaningful contribution/fork/PR. Required submission information includes contribution URL, project repo URL, GitHub username, and explanation of what/why.

Do not assume merely making the main ThreadKeeper repository public satisfies this mini challenge.

## AWS promotional credits

Registered entrants may request **$150 AWS Promotional Credits**, while supplies last. The rules snapshot gives a request deadline of **October 21, 2026 at 12 PM PT**.

Credits are funding, not separate authorization for AgentCore. Additional AWS charges remain the entrant's responsibility. Configure budgets/alerts and bounded development usage.

## Submission requirements relevant to us

The submission must include:

- a working project meeting the chosen track requirements;
- text description explaining functionality;
- GitHub repository with necessary source/assets/run instructions;
- either public open-source repo with license or private repo shared with the required Devpost/Amazon reviewers described in current rules;
- working demo video under three minutes, publicly visible on YouTube or Vimeo, in English;
- product feedback for each used tool/API/SDK;
- selected primary track and mini challenge(s);
- explanation of hackathon-period updates if a project existed before the submission period.

Do not include third-party copyrighted music/footage/trademarks in the demo unless permitted by the rules/licensing.

The rules state judges are not required to execute the project and may judge from text, images, and video. Therefore the demo/video is a primary product surface.

## Judging

The four Stage 2 criteria are equally weighted in the current rules snapshot:

1. **Tech Implementation** — build quality and effective use of required technology.
2. **Design** — complete/coherent experience and appropriate interaction model.
3. **Potential Impact** — credible customer need and beyond-hackathon potential.
4. **Quality of the Idea** — creativity and understanding of ecosystem/user need.

### Friction-log bonus

Optional friction-log entries are reviewed during Stage 1 and can produce a recommended bonus of **up to 10%** for the Stage 2 score under the current rules.

Each useful entry should include:

- task attempted;
- steps taken;
- expected behavior;
- actual behavior;
- severity;
- workaround;
- actionable suggestion.

Use `docs/FRICTION_LOG.md` continuously.

## External tool / AI coding assistance

The rules permit third-party integrations when the entrant is authorized to use them and contain provisions permitting third-party technical assistance subject to ownership/original-work requirements. The Alexa+ simulation alternative explicitly allows the entrant's preferred AI/agentic tool.

Our development agent is expected to be **Gemini/Antigravity**. The tool used to write code does not replace the requirement that our entry genuinely satisfy the chosen Alexa+/MCP runtime requirements.

## Change control

Before final submission, and before any major decision that depends on eligibility/required technology:

1. re-open the official rules;
2. compare material requirements with this snapshot;
3. update this file and its verification date if necessary;
4. record a material change in `docs/DECISIONS.md` if it affects architecture or submission strategy.

