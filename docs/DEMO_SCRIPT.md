# ThreadKeeper — Official 3-Minute Demo Video Script

**Target Duration:** 2 minutes 40 seconds (Safely under the 3-minute hard limit)  
**Track:** Alexa+ & AWS Builder Mini-Challenge  
**Audio Style:** Clear, professional, natural pacing (no copyrighted music, no third-party clips).  

---

## Storyboard & Timing Breakdown

| Time Window | Section | Purpose | On-Screen Action |
| :--- | :--- | :--- | :--- |
| **0:00 – 0:15** | **The Hook** | Establish universal developer pain | Split screen showing code editor and incoming notification barrage. |
| **0:15 – 0:30** | **The Concept** | Introduce ThreadKeeper & thesis | Reveal ThreadKeeper Visual Continuity Console. |
| **0:30 – 1:00** | **The Departure ("Alexa, park this.")** | Capture cognitive checkpoint live | Voice command speaking to simulator; terminal shows AgentCore Memory save. |
| **1:00 – 1:20** | **The Interruption (Process Death & Code Change)** | Simulate being away from desk | Terminal shows Node process exit; code edit in `src/payment.ts`. |
| **1:20 – 1:50** | **The Return ("Alexa, where was I?")** | Clean process resume & spoken brief | Voice query; fresh process launches; audio playback of 5-sentence brief. |
| **1:50 – 2:15** | **THEN vs NOW & Epistemic Trust** | Prove grounding over hallucination | Inspect Visual Console: THEN vs NOW grid and 4 epistemic cards. |
| **2:15 – 2:35** | **Under the Hood (AWS & MCP Proof)** | Architecture & protocol validation | Show Streamable HTTP MCP handshake, AgentCore Memory ID, and 83 passing tests. |
| **2:35 – 2:45** | **Closing Payoff** | Memorable call to action | Final slide with GitHub repository link and hackathon summary. |

---

## Complete Video Script: Action & Narration

### Scene 1: The Hook (0:00 – 0:15)
* **Visual:** Close-up of VS Code with `src/payment.ts`. Multiple notification popups appear (Slack, Calendar alert for standup). The cursor freezes mid-line.
* **Narration:**
  > *"As developers, we don't forget the file when an interruption hits. We forget what we were thinking: our active hypotheses, the assumptions we made, and what we planned to do next. When we return 45 minutes later, our mental context is gone."*

---

### Scene 2: What ThreadKeeper Is (0:15 – 0:30)
* **Visual:** Cut to the **ThreadKeeper Visual Continuity Console** running in a browser, with the ambient command bar and clean dark theme.
* **Narration:**
  > *"Meet ThreadKeeper—an Alexa+ continuity agent powered by the open Model Context Protocol. ThreadKeeper captures your cognitive state before you leave, and reconstructs exactly what changed, what became stale, and what to do next when you return."*

---

### Scene 3: The Departure — "Alexa, park this." (0:30 – 1:00)
* **Visual:** The user clicks the ambient mic chip: `"Alexa, park this."`  
  Terminal log displays:
  ```text
  [ThreadKeeper] Capturing snapshot of .demo_fixture_repo (branch: main)
  [ThreadKeeper] Tracked artifact: src/payment.ts (hash: sha256-7dbd56ec...)
  [ThreadKeeper] Saving checkpoint cp-1ec1c459 to AWS AgentCore Memory...
  ```
  The simulator speaks and displays:
  > *"Parked your work on 'Implement strict multi-currency payment validation with audit logging'. Checkpoint cp-1ec1c459 is safely preserved in AgentCore Memory."*
* **Narration:**
  > *"Before stepping away, you say three words: 'Alexa, park this.' Without writing manual notes, ThreadKeeper captures your working objective, your active decisions, and real cryptographic SHA-256 evidence hashes from your Git workspace—persisting it directly into Amazon Bedrock AgentCore Memory."*

---

### Scene 4: The Interruption — Process Death & Code Change (1:00 – 1:20)
* **Visual:** 
  1. Terminal shows the ThreadKeeper process terminating completely (`process.exit(0)`).
  2. A code editor window opens: `src/payment.ts` is edited to introduce a currency whitelist (`["USD", "EUR", "GBP"]`).
  3. `git status` shows the working tree is now dirty.
* **Narration:**
  > *"Now, the original process terminates completely. While you're away in meetings, the codebase evolves—someone introduces currency whitelist validation into `src/payment.ts`. The working tree is modified."*

---

### Scene 5: The Return — "Alexa, where was I?" (1:20 – 1:50)
* **Visual:** 
  A fresh, independent terminal process starts.  
  The user speaks: `"Alexa, where was I?"`  
  ThreadKeeper retrieves checkpoint `cp-1ec1c459` from AWS AgentCore Memory, diffs the Git workspace, and invokes Amazon Nova Lite.  
  Audio speaks the exact 5-sentence response with words highlighted on screen:
  > *"You were implementing strict multi-currency payment validation with audit logging.*  
  > *While you were away, src/payment.ts changed.*  
  > *That means your previous assumption—that the file accepts currencies without whitelist validation—needs review.*  
  > *I don't yet know whether the issue was fixed or who made the change.*  
  > *Next, inspect the changed currency-validation logic before continuing."*
* **Narration:**
  > *"When you sit back down, a fresh process starts and you ask: 'Alexa, where was I?' ThreadKeeper restores your cognitive state from AgentCore Memory, reads the current Git workspace, and immediately identifies that your previous assumption is stale—giving you a grounded, 20-second orientation."*

---

### Scene 6: THEN vs NOW & Epistemic Grounding (1:50 – 2:15)
* **Visual:** Zoom in on the Visual Continuity Console:
  1. Highlight the **THEN vs NOW** grid:
     - **THEN:** Baseline Hash (`sha256-7dbd...`), Assumption (*"Accepts any currency"*).
     - **NOW:** New Hash (`sha256-5ffe...`), Status (`STALE / NEEDS REVIEW`).
  2. Highlight the 4 **Epistemic Assessment Cards**:
     - **Observed:** `src/payment.ts changed while away`
     - **Derived:** `Artifact changed; assumption marked stale for re-evaluation`
     - **Inferred:** `Currency whitelist logic altered`
     - **Unknown:** `Who or what made the change`
* **Narration:**
  > *"On the console, ThreadKeeper provides a visual THEN vs NOW breakdown. Most importantly, it enforces strict epistemic grounding: verified facts are separated from deductions, inferences, and explicit unknowns. Notice it never hallucinates who changed the file—because the Git commit didn't prove it, ThreadKeeper marks the author as unknown."*

---

### Scene 7: Under the Hood — MCP & AWS Proof (2:15 – 2:35)
* **Visual:** Split screen showing:
  1. Terminal running `npm run verify:mcp` (Streamable HTTP, protocol `2025-11-25`, all 6 tools discovered and called).
  2. AWS Console / terminal showing active AgentCore Memory resource (`ThreadKeeperHackathonMemory-KkM33n8BE1`) in `ap-southeast-2`.
  3. Terminal running `npm test` showing 83 passing tests in under 2 seconds.
* **Narration:**
  > *"Under the hood, ThreadKeeper is a fully self-hosted MCP server running over modern Streamable HTTP. It integrates Amazon Bedrock Nova Lite for semantic reasoning and Bedrock AgentCore Memory for cross-process persistence—all backed by 83 deterministic automated tests."*

---

### Scene 8: Closing Payoff (2:35 – 2:45)
* **Visual:** Slide showing ThreadKeeper logo, GitHub repository URL (`https://github.com/DaRk-plays/Thread_Keeper`), and key summary badges:
  - `MCP 2025-11-25+`
  - `Streamable HTTP`
  - `AWS Bedrock AgentCore Memory`
  - `Amazon Nova Lite`
  - `Real Git Continuity`
* **Narration:**
  > *"ThreadKeeper gives developers an ambient safety net for their attention. Never lose your train of thought again. Thank you."*

---

## Technical Pacing Check

* **Total Word Count:** 368 words.
* **Estimated Speaking Rate:** 135 words per minute.
* **Estimated Audio Run Time:** 2 minutes 43 seconds.
* **Buffer Under 3-Minute Limit:** 17 seconds of safety margin.
