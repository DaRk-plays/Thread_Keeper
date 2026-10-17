# Product Context

## Product

**Name:** ThreadKeeper  
**Tagline:** The continuity layer for human attention.  
**Primary track:** Alexa+  
**Primary persona for the competition demo:** software developer / technical knowledge worker  
**Long-term market:** people doing interruption-heavy complex knowledge work

## Problem

Interruptions destroy more than time. They destroy the invisible state held in a person's head: the immediate goal, hypotheses, evidence, rejected approaches, dependencies, unresolved questions, and the exact next move.

Existing tools preserve pieces of the state:

- Git preserves code history.
- Editors preserve files/tabs.
- chat systems preserve conversations.
- task managers preserve declared tasks.
- AI memory preserves facts or prior interactions.

None of those alone reliably reconstruct **the user's working thread**.

## Core jobs to be done

When stopping:

> Preserve enough grounded cognitive state that future-me or another agent can continue without repeating investigation.

When returning:

> Tell me where I was, what changed, which prior reasoning is still valid, and the best next action.

When handing off:

> Transfer the goal, evidence, decisions, failed attempts, constraints, and next experiment without requiring the recipient to replay the whole history.

## Core interaction

### Park

User: **"Alexa, park this."**

ThreadKeeper captures a checkpoint with:

- objective/goal;
- current task state;
- decisions and rationale;
- evidence and provenance;
- attempts and outcomes;
- artifacts and relevant versions;
- assumptions;
- blockers/open questions;
- next intended action;
- timestamp and context-source state.

### Resume

User: **"Alexa, resume my thread."**

ThreadKeeper:

1. retrieves the last relevant checkpoint;
2. inspects the current available state;
3. computes a Continuity Diff;
4. identifies unchanged, changed, stale, and uncertain context;
5. produces an evidence-grounded resume brief;
6. recommends a next action;
7. allows drill-down: "why?", "what changed?", "show evidence", "full version".

## The Continuity Diff

This is a core differentiator.

A memory-only system replays the past. ThreadKeeper compares the checkpoint's past against current reality.

Conceptual output:

```json
{
  "still_valid": [],
  "changed": [],
  "stale_assumptions": [],
  "new_evidence": [],
  "uncertain": [],
  "recommended_next_action": {}
}
```

ThreadKeeper should never imply that an old checkpoint is current merely because it was stored successfully.

## Evidence-first behavior

Every meaningful reconstructed claim should fall into one of:

- **Observed:** directly supported by captured current/past evidence.
- **Derived:** computed deterministically from observed evidence.
- **Inferred:** model-generated interpretation with cited evidence and appropriate uncertainty.
- **Unknown:** insufficient evidence.

This is both a quality feature and a defense against hallucinated work history.

## Agent handoff

`create_handoff` should produce a compact packet such as:

```text
OBJECTIVE
CURRENT STATE
DECISIONS + WHY
KNOWN EVIDENCE
ALREADY TRIED + OUTCOME
DO NOT REPEAT
CHANGED SINCE CHECKPOINT
OPEN QUESTIONS
NEXT EXPERIMENT
SUCCESS CONDITION
RELEVANT ARTIFACTS
```

The recipient can be a human or coding agent. Handoff is not permission to autonomously mutate the user's project; execution remains a separate action/approval surface.

## Experience principles

1. **30-second usefulness:** returning users should get value before they get detail.
2. **Progressive disclosure:** short voice brief first, evidence/timeline visually available.
3. **Evidence over eloquence:** a plain grounded answer beats a beautiful hallucination.
4. **Ambient, not intrusive:** Alexa+ is a natural capture/resume surface, not a voice skin pasted on a dashboard.
5. **Honest uncertainty:** ThreadKeeper should say what it cannot know.
6. **User control:** capture scope, sensitive content, actions, and agent handoffs stay visible/controllable.

## Competition demo scope

The first compelling vertical is developer work because code repositories provide rich, versioned evidence for demonstrating Continuity Diff. Architecture should permit later sources such as documents, tickets, browsers, design tools, and calendars without requiring them in the first winning path.

## Anti-goals

Do not broaden the product merely to claim more integrations. A narrow, spectacular, working developer-continuity demo beats six shallow connectors.

Do not let "ambient memory" become surveillance. Capture must be deliberate/visible in the hackathon prototype.

Do not claim background awareness that the implementation cannot actually access.

## Success definition

The competition build succeeds when a judge can watch the demo and quickly understand all three:

1. **Problem:** interruptions destroy hidden working state.
2. **Magic:** ThreadKeeper reconstructs that state and detects what changed.
3. **Technical credibility:** Alexa+/MCP and AWS agentic services materially enable the workflow, with evidence and evaluation proving it is more than a scripted demo.

