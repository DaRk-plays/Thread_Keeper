# ThreadKeeper — Devpost Submission Entry

**Tagline:** Never lose your train of thought. An Alexa+ continuity agent that captures working context before an interruption and reconstructs what changed, what became stale, and what to do next.

**Primary Track:** Alexa+  
**Mini-Challenge:** AWS Builder  
**GitHub Repository:** https://github.com/DaRk-plays/Thread_Keeper  
**Demo Video:** [Link to 2:40 YouTube Video]  

---

## Inspiration

> *"You don't forget the file. You forget what you were thinking."*

Every developer knows the agony of the modern context switch. You are deep inside a complex debugging session, holding seven moving pieces of state in your head:
- *"I tested the database pool, that's not the issue."*
- *"I noticed `src/payment.ts` doesn't validate currency codes against a whitelist."*
- *"I'm assuming this function accepts any string without throwing."*
- *"Next, I need to write an audit logging test."*

Then, an urgent Slack message arrives. Or your team has an all-hands meeting. Or you step away for lunch.

When you return 45 minutes later, your code editor still has the file open. Git still shows your dirty lines. But your **mental working memory is completely gone**. 

Existing AI tools don't solve this:
- **Chatbots** ask *"How can I help you today?"* as if you just met.
- **Git** shows line diffs, but doesn't tell you *what hypothesis you were testing*.
- **Note-taking apps** require minutes of manual typing that nobody does when rushing to an interruption.

We built **ThreadKeeper** to give human attention a durable continuity layer.

---

## What It Does

ThreadKeeper is an ambient continuity agent powered by Alexa+ and the open Model Context Protocol (MCP).

1. **Ambient Parking ("Alexa, park this."):**
   Before stepping away, you say three words: *"Alexa, park this."* Without opening another app, ThreadKeeper captures your active cognitive checkpoint: your current goal, recent decisions, working assumptions, and cryptographic SHA-256 evidence hashes from your local Git workspace.

2. **Persistent Cloud Memory:**
   The checkpoint is stored in **Amazon Bedrock AgentCore Memory**. Even if your computer sleeps, your editor closes, or your machine restarts, your cognitive state survives in the cloud.

3. **Workspace Tracking (While Away):**
   While you are away, your repository evolves. A teammate pushes a commit, an automated script runs, or background files change.

4. **Continuity Diff ("Alexa, where was I?"):**
   When you sit back down, you say: *"Alexa, where was I?"*
   A fresh ThreadKeeper process launches, retrieves your checkpoint from AgentCore Memory, reads the current Git workspace, and calculates a **Continuity Diff**:
   - It identifies which files changed.
   - It checks whether any of your previous *mental assumptions* were invalidated by the changed code.
   - It consults **Amazon Bedrock Nova Lite** to evaluate the semantic impact under strict grounding rules (no hallucinations, no guessing).

5. **Concise Spoken Orientation:**
   Alexa speaks a natural 5-sentence brief in under 20 seconds:
   > *"You were implementing strict multi-currency payment validation with audit logging. While you were away, src/payment.ts changed. That means your previous assumption—that the file accepts currencies without whitelist validation—needs review. I don't yet know whether the issue was fixed or who made the change. Next, inspect the changed currency-validation logic before continuing."*

6. **Visual Continuity Console:**
   For visual drill-down, a companion web console displays a clear **THEN vs NOW** comparison grid, side-by-side evidence hashes, and an epistemic assessment card separating **Observed Facts**, **Derived Knowledge**, **Inferred Context**, and **Unknowns**.

---

## How We Built It

We designed ThreadKeeper around strict architectural boundaries, local determinism, and official open protocols:

* **Alexa+ Conversational Dispatcher:** Built natural intent mapping for core ambient phrases (`park_this`, `where_was_i`, `what_changed`, `what_should_i_do_next`, `why_is_that_assumption_stale`) with conversational speech synthesis.
* **Self-Hosted MCP Server (Spec 2025-11-25+):** Implemented a native MCP server using `@modelcontextprotocol/sdk` running over modern **Streamable HTTP** at `/mcp`. It exposes six domain tools (`capture_checkpoint`, `resume_thread`, `compare_current_state`, `find_decision`, `find_unfinished_work`, `create_handoff`).
* **Amazon Bedrock AgentCore Memory:** Provisioned an active memory resource in `ap-southeast-2` (`ThreadKeeperHackathonMemory-KkM33n8BE1`). Checkpoints are serialized losslessly as structured session event payloads, proving full continuity across separate Node.js processes.
* **Amazon Bedrock Nova Lite (`amazon.nova-lite-v1:0`):** Used the Bedrock Converse API with temperature 0 and strict Zod schema validation to provide advisory semantic reasoning. If Nova cannot ground an observation in physical evidence, it explicitly marks the fact as **Unknown**.
* **Real Git Workspace Provider:** Built a non-mutating Git inspection engine using Node.js `execFile` argument arrays and SHA-256 file hashing to track uncommitted changes while filtering sensitive patterns (`.env`, secrets, keys).
* **Deterministic Diff Engine:** Built a rule-based continuity diff calculator that flags invalidated assumptions before model invocation, guaranteeing reliable operation even if cloud APIs are offline.

---

## Challenges We Ran Into

1. **True Process-Death Persistence:** Proving persistence didn't just mean saving an object in RAM. We had to ensure Process A (saving to AgentCore Memory) could terminate completely, and Process B could launch with an empty heap and restore the exact cognitive state using cloud API session queries.
2. **Eliminating Hallucinations at the Boundary:** LLMs love to guess causes—e.g., claiming *"Your teammate Alice fixed the bug."* We established a strict Epistemic Grounding Contract: if the Git log or evidence doesn't explicitly name an actor or verify a test pass, the model is forced to output `"Unknown"`.
3. **Streamable HTTP Nuances:** Modern MCP specification (2025-11-25+) replaces legacy SSE transports with Streamable HTTP. Ensuring seamless dual-negotiation (`Accept: application/json, text/event-stream`) with stateful session IDs required careful low-level transport tuning.
4. **Natural Spoken Cadence:** Formatting voice responses for speech is fundamentally different from chat text. We had to strip leading action verbs, eliminate awkward punctuation, and structure responses so a returning developer receives maximum clarity in 20 seconds.

---

## Accomplishments We're Proud Of

* **True Continuity Over Chat History:** We didn't build another chat wrapper. ThreadKeeper mathematically detects when code changes break cognitive assumptions.
* **83 Automated Tests with 100% Deterministic Pass Rate:** Our full test suite passes in under 2 seconds completely offline with zero paid cloud calls, while dedicated verification runners prove live AWS integrations against real services.
* **Zero Runaway Costs:** Zero always-on compute infrastructure provisioned ($0.00 standing cost), with usage bounded strictly to verification runners.
* **Clean 7-Gate Pre-Demo Verification:** A single command (`npm run verify:demo`) tests AWS STS identity, AgentCore Memory health, Git fixture creation, Alexa park, file mutation, and Alexa resume end-to-end.

---

## What We Learned

* **Grounding requires schema enforcement, not just prompting:** Telling a model *"don't hallucinate"* fails; validating output against Zod schemas that cross-reference valid evidence IDs guarantees truthfulness.
* **Ambient voice is the ideal interface for context switches:** When you're interrupted, you have zero patience to navigate a web UI. Voice capture meets humans where they are.
* **MCP is a powerful interoperability standard:** Building on MCP 2025-11-25 allows ThreadKeeper tools to connect to Alexa+, IDE sidecars, or autonomous coding agents with zero changes to domain logic.

---

## What's Next

* **IDE Companion Plugin:** Surface visual Continuity Diff highlights directly in VS Code / JetBrains editors when an assumption becomes stale.
* **Cross-Agent Handoff Execution:** Feed ThreadKeeper handoff packets directly into autonomous coding agents (like Claude Code or Gemini CLI) so an agent can autonomously resolve stale assumptions while the developer is in meetings.
* **Extended Multi-Repo Workspaces:** Track cognitive continuity across microservice architectures spanning multiple Git repositories.

---

## Built With

* **Languages & Runtimes:** TypeScript 5.9, Node.js (NodeNext ESM), Express
* **Protocols & Standards:** Model Context Protocol (MCP 2025-11-25+, Streamable HTTP), JSON-RPC 2.0
* **AWS Cloud Services:** Amazon Bedrock Converse API, Amazon Nova Lite (`amazon.nova-lite-v1:0`), Amazon Bedrock AgentCore Memory (`ap-southeast-2`)
* **Local Tools & Testing:** Git CLI, Vitest, Zod, ESLint

---

## Alexa+ Track Alignment

ThreadKeeper fulfills the Alexa+ track requirements through:
1. **Self-Hosted MCP Server:** Full implementation of MCP specification `>= 2025-11-25` over Streamable HTTP (`POST /mcp`), hosting six domain continuity tools.
2. **Conversational Intent Dispatcher:** Maps ambient speech phrases to structured continuity workflows, returning concise spoken briefs and structured visual cards.
3. **Simulated Alexa+ Surface:** An interactive Visual Continuity Console simulating the ambient Alexa+ device surface with real-time audio transcriptions and visual THEN vs NOW cards.

---

## AWS Builder Mini-Challenge Alignment

ThreadKeeper materially leverages AWS services for core continuity capabilities:
1. **Amazon Bedrock AgentCore Memory:** Solves the process-death problem by persisting serialized Cognitive Checkpoints into AWS-managed actor sessions in `ap-southeast-2`, verified live across independent processes.
2. **Amazon Bedrock Nova Lite:** Evaluates the semantic gap between previous developer hypotheses and current code reality, generating structured facts and safe next actions without hallucination.
