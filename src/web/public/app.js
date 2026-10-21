// Visual Continuity Console Interactive Logic — Milestone 4
document.addEventListener("DOMContentLoaded", () => {
  const currentThreadId = "thread-demo-currency-validation";

  // Elements: Conversational Alexa
  const inputAlexaCommand = document.getElementById("input-alexa-command");
  const btnAlexaSend = document.getElementById("btn-alexa-send");
  const chips = document.querySelectorAll(".chip");
  const voiceBadges = document.getElementById("voice-badges");
  const voiceBriefText = document.getElementById("voice-brief-text");

  // Elements: Demo Stepper
  const demoStageBadge = document.getElementById("demo-stage-badge");
  const btnDemoSetup = document.getElementById("btn-demo-setup");
  const btnDemoPark = document.getElementById("btn-demo-park");
  const btnDemoInterrupt = document.getElementById("btn-demo-interrupt");
  const btnDemoResume = document.getElementById("btn-demo-resume");

  // Elements: Legacy Scenario Stepper & Workspace
  const btnStep1 = document.getElementById("btn-step-1");
  const btnStep2 = document.getElementById("btn-step-2");
  const btnStep3 = document.getElementById("btn-step-3");
  const btnStep4 = document.getElementById("btn-step-4");
  const btnAlexaPark = document.getElementById("btn-alexa-park");
  const btnAlexaResume = document.getElementById("btn-alexa-resume");
  const inputWorkspacePath = document.getElementById("input-workspace-path");
  const btnWorkspacePark = document.getElementById("btn-workspace-park");
  const btnWorkspaceResume = document.getElementById("btn-workspace-resume");

  // Elements: Grounded Next Action
  const nextActionDesc = document.getElementById("next-action-desc");
  const nextActionPriority = document.getElementById("next-action-priority");
  const nextActionTarget = document.getElementById("next-action-target");
  const nextActionRationale = document.getElementById("next-action-rationale");

  // Elements: THEN vs NOW Grid
  const thenGoal = document.getElementById("then-goal");
  const thenAssumption = document.getElementById("then-assumption");
  const thenDecision = document.getElementById("then-decision");
  const thenCheckpointId = document.getElementById("then-checkpoint-id");
  const thenEvidenceHash = document.getElementById("then-evidence-hash");

  const nowChangedFiles = document.getElementById("now-changed-files");
  const nowAssumptionStatus = document.getElementById("now-assumption-status");
  const nowInvalidationReason = document.getElementById("now-invalidation-reason");
  const nowEvidenceHash = document.getElementById("now-evidence-hash");
  const nowDeltaSummary = document.getElementById("now-delta-summary");

  // Elements: Epistemic Assessment Cards
  const assessmentObserved = document.getElementById("assessment-observed");
  const assessmentDerived = document.getElementById("assessment-derived");
  const assessmentInferred = document.getElementById("assessment-inferred");
  const assessmentUnknown = document.getElementById("assessment-unknown");

  // Elements: Diff Tab Metrics & Lists
  const metricStale = document.getElementById("metric-stale");
  const metricChanged = document.getElementById("metric-changed");
  const metricValid = document.getElementById("metric-valid");
  const staleList = document.getElementById("stale-assumptions-list");
  const changedList = document.getElementById("changed-artifacts-list");
  const validList = document.getElementById("valid-context-list");

  // Elements: Checkpoint Tab
  const cpGoal = document.getElementById("cp-goal");
  const cpDecisions = document.getElementById("cp-decisions");
  const cpEvidence = document.getElementById("cp-evidence");
  const cpAttempts = document.getElementById("cp-attempts");
  const cpAssumptions = document.getElementById("cp-assumptions");
  const handoffJson = document.getElementById("handoff-json");

  // Tab switching
  const tabs = document.querySelectorAll(".pill");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      const target = tab.dataset.tab;
      document.querySelectorAll(".tab-content").forEach((tc) => tc.classList.remove("active"));
      const targetContent = document.getElementById(`tab-${target}`);
      if (targetContent) targetContent.classList.add("active");
    });
  });

  // Badge renderer
  function renderBadges(badges) {
    if (!voiceBadges) return;
    if (!badges || badges.length === 0) {
      voiceBadges.innerHTML = "";
      return;
    }
    voiceBadges.innerHTML = badges
      .map((b) => {
        let cls = "badge-neutral";
        if (b.includes("AgentCore") || b.includes("Memory")) cls = "badge-success";
        else if (b.includes("Nova")) cls = "badge-info";
        else if (b.includes("Review") || b.includes("Stale")) cls = "badge-danger";
        else if (b.includes("Git") || b.includes("Grounded")) cls = "badge-info";
        return `<span class="badge ${cls}">${b}</span>`;
      })
      .join(" ");
  }

  // Render THEN vs NOW Grid
  function renderThenNow(thenState, nowState) {
    if (thenState) {
      if (thenGoal) thenGoal.textContent = thenState.goal || "--";
      if (thenAssumption) thenAssumption.textContent = thenState.active_assumption || "--";
      if (thenDecision) thenDecision.textContent = thenState.relevant_decision || "--";
      if (thenCheckpointId) thenCheckpointId.textContent = thenState.checkpoint_id || "--";
      if (thenEvidenceHash) thenEvidenceHash.textContent = thenState.old_evidence_hash ? `${thenState.old_evidence_hash.slice(0, 24)}...` : "--";
    }

    if (nowState) {
      if (nowChangedFiles) {
        nowChangedFiles.textContent = nowState.changed_artifacts && nowState.changed_artifacts.length > 0
          ? nowState.changed_artifacts.join(", ")
          : "None (Clean Working Tree)";
      }
      if (nowAssumptionStatus) {
        nowAssumptionStatus.textContent = nowState.stale_assumption_status || "--";
        nowAssumptionStatus.className = nowState.stale_assumption_status?.includes("STALE")
          ? "detail-val text-danger"
          : "detail-val text-success";
      }
      if (nowInvalidationReason) nowInvalidationReason.textContent = nowState.invalidation_reason || "--";
      if (nowEvidenceHash) nowEvidenceHash.textContent = nowState.new_evidence_hash ? `${nowState.new_evidence_hash.slice(0, 24)}...` : "--";
      if (nowDeltaSummary) {
        nowDeltaSummary.textContent = nowState.changed_artifacts && nowState.changed_artifacts.length > 0
          ? `External modification detected while user was away.`
          : `State fully synchronized with captured checkpoint.`;
      }
    }
  }

  // Render Epistemic Assessment Cards
  function renderAssessment(assessment) {
    if (!assessment) return;

    if (assessmentObserved && assessment.observed) {
      assessmentObserved.innerHTML = assessment.observed.map((item) => `<li>${item}</li>`).join("");
    }
    if (assessmentDerived && assessment.derived) {
      assessmentDerived.innerHTML = assessment.derived.map((item) => `<li>${item}</li>`).join("");
    }
    if (assessmentInferred && assessment.inferred) {
      assessmentInferred.innerHTML = assessment.inferred.map((item) => `<li>${item}</li>`).join("");
    }
    if (assessmentUnknown && assessment.unknown) {
      assessmentUnknown.innerHTML = assessment.unknown.map((item) => `<li>${item}</li>`).join("");
    }
  }

  // Render Grounded Next Action
  function renderNextAction(action) {
    if (!action) return;
    if (nextActionDesc) nextActionDesc.textContent = action.description;
    if (nextActionPriority) {
      nextActionPriority.textContent = action.priority ? action.priority.toUpperCase() : "IMMEDIATE";
      nextActionPriority.className =
        action.priority === "immediate" ? "badge badge-success" : "badge badge-neutral";
    }
    if (nextActionTarget) nextActionTarget.textContent = action.target || action.target_artifact || "general";
    if (nextActionRationale) nextActionRationale.textContent = `Rationale: ${action.rationale || ""}`;
  }

  // Render Full Checkpoint Details
  function renderCheckpoint(cp) {
    if (!cp) return;
    if (cpGoal) cpGoal.textContent = cp.goal.text;

    if (cpDecisions) {
      cpDecisions.innerHTML = cp.decisions
        .map(
          (d) => `
        <div class="item-card">
          <span class="card-title">${d.description}</span>
          <span class="card-detail">Rationale: ${d.rationale}</span>
          <span class="card-provenance">Evidence: [${d.evidence_ids.join(", ")}]</span>
        </div>
      `
        )
        .join("");
    }

    if (cpEvidence) {
      cpEvidence.innerHTML = cp.evidence
        .map(
          (e) => `
        <div class="item-card">
          <span class="card-title">${e.source} (${e.type})</span>
          <span class="card-detail">${e.content}</span>
          <span class="card-provenance">ID: ${e.id} &bull; Status: ${e.epistemic_status}</span>
        </div>
      `
        )
        .join("");
    }

    if (cpAttempts) {
      cpAttempts.innerHTML = cp.attempts
        .map(
          (a) => `
        <div class="item-card">
          <span class="card-title">${a.description}</span>
          <span class="card-detail">Status: ${a.status} &bull; ${a.learnings || ""}</span>
        </div>
      `
        )
        .join("");
    }

    if (cpAssumptions) {
      cpAssumptions.innerHTML = cp.assumptions
        .map(
          (a) => `
        <div class="item-card">
          <span class="card-title">${a.statement}</span>
          <span class="card-detail">Target: ${a.target_artifact_id || "workspace"} &bull; Status: ${a.status}</span>
        </div>
      `
        )
        .join("");
    }
  }

  // Conversational Alexa Dispatcher API Call
  async function executeAlexaCommand(cmd) {
    if (!cmd || !cmd.trim()) return;
    if (voiceBriefText) voiceBriefText.textContent = `🎙️ "${cmd}" — Asking Alexa+...`;

    try {
      const res = await fetch("/api/alexa/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command: cmd.trim(),
          threadId: currentThreadId
        })
      });
      const data = await res.json();
      if (data.status === "error") {
        if (voiceBriefText) voiceBriefText.textContent = `Error: ${data.message}`;
        return;
      }

      const resp = data.response;
      if (voiceBriefText) voiceBriefText.textContent = resp.spoken_response;
      renderBadges(resp.badges);
      renderThenNow(resp.then_state, resp.now_state);
      renderAssessment(resp.assessment);
      if (resp.next_action) renderNextAction(resp.next_action);

      // Switch to THEN vs NOW tab to show findings
      const thenNowTab = document.querySelector('[data-tab="then-now"]');
      if (thenNowTab) thenNowTab.click();
    } catch (err) {
      if (voiceBriefText) voiceBriefText.textContent = `Network Error: ${err.message}`;
    }
  }

  // Ambient Conversational Input Wiring
  if (btnAlexaSend && inputAlexaCommand) {
    btnAlexaSend.addEventListener("click", () => {
      const val = inputAlexaCommand.value;
      if (val) {
        executeAlexaCommand(val);
        inputAlexaCommand.value = "";
      }
    });

    inputAlexaCommand.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        btnAlexaSend.click();
      }
    });
  }

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const cmd = chip.dataset.cmd;
      if (cmd) executeAlexaCommand(cmd);
    });
  });

  // Judge-Ready Demo Stepper Handlers
  async function runDemoSetup() {
    if (voiceBriefText) voiceBriefText.textContent = 'Setting up clean Git fixture repository in .demo_fixture_repo...';
    try {
      const res = await fetch("/api/demo/setup", { method: "POST" });
      const data = await res.json();
      if (data.status === "success") {
        if (demoStageBadge) demoStageBadge.textContent = "Stage: Fixture Initialized";
        if (voiceBriefText) voiceBriefText.textContent = "Demo Git repository initialized with prototype multi-currency payment service. Working tree clean.";
        renderBadges(["Git Evidence", "Clean Baseline"]);
      } else {
        if (voiceBriefText) voiceBriefText.textContent = `Setup failed: ${data.message}`;
      }
    } catch (err) {
      if (voiceBriefText) voiceBriefText.textContent = `Setup error: ${err.message}`;
    }
  }

  async function runDemoPark() {
    if (voiceBriefText) voiceBriefText.textContent = 'Executing "Alexa, park this" to persist checkpoint into AgentCore Memory...';
    try {
      const res = await fetch("/api/demo/park", { method: "POST" });
      const data = await res.json();
      if (data.status === "success" && data.response) {
        if (demoStageBadge) demoStageBadge.textContent = "Stage: Parked to AgentCore";
        const resp = data.response;
        if (voiceBriefText) voiceBriefText.textContent = resp.spoken_response;
        renderBadges(resp.badges);
        renderThenNow(resp.then_state, resp.now_state);
        renderAssessment(resp.assessment);
        if (resp.next_action) renderNextAction(resp.next_action);
      } else {
        if (voiceBriefText) voiceBriefText.textContent = `Park failed: ${data.message}`;
      }
    } catch (err) {
      if (voiceBriefText) voiceBriefText.textContent = `Park error: ${err.message}`;
    }
  }

  async function runDemoInterrupt() {
    if (voiceBriefText) voiceBriefText.textContent = 'Simulating interruption: src/payment.ts changed while the developer was away...';
    try {
      const res = await fetch("/api/demo/interrupt", { method: "POST" });
      const data = await res.json();
      if (data.status === "success") {
        if (demoStageBadge) demoStageBadge.textContent = "Stage: Interrupted (Dirty)";
        if (voiceBriefText) voiceBriefText.textContent = "⚡ Workspace changed while the developer was away: src/payment.ts modified, introducing currency whitelist [\"USD\", \"EUR\", \"GBP\"].";
        renderBadges(["Git Evidence", "Dirty Tree", "Needs Review"]);
      } else {
        if (voiceBriefText) voiceBriefText.textContent = `Interrupt failed: ${data.message}`;
      }
    } catch (err) {
      if (voiceBriefText) voiceBriefText.textContent = `Interrupt error: ${err.message}`;
    }
  }

  async function runDemoResume() {
    if (voiceBriefText) voiceBriefText.textContent = 'Asking "Alexa, where was I?" — Fresh process retrieving from AgentCore Memory and inspecting workspace...';
    try {
      const res = await fetch("/api/demo/resume", { method: "POST" });
      const data = await res.json();
      if (data.status === "success" && data.response) {
        if (demoStageBadge) demoStageBadge.textContent = "Stage: Resumed & Verified";
        const resp = data.response;
        if (voiceBriefText) voiceBriefText.textContent = resp.spoken_response;
        renderBadges(resp.badges);
        renderThenNow(resp.then_state, resp.now_state);
        renderAssessment(resp.assessment);
        if (resp.next_action) renderNextAction(resp.next_action);

        const thenNowTab = document.querySelector('[data-tab="then-now"]');
        if (thenNowTab) thenNowTab.click();
      } else {
        if (voiceBriefText) voiceBriefText.textContent = `Resume failed: ${data.message}`;
      }
    } catch (err) {
      if (voiceBriefText) voiceBriefText.textContent = `Resume error: ${err.message}`;
    }
  }

  if (btnDemoSetup) btnDemoSetup.addEventListener("click", runDemoSetup);
  if (btnDemoPark) btnDemoPark.addEventListener("click", runDemoPark);
  if (btnDemoInterrupt) btnDemoInterrupt.addEventListener("click", runDemoInterrupt);
  if (btnDemoResume) btnDemoResume.addEventListener("click", runDemoResume);

  // Sync initial demo state from server
  fetch("/api/demo/status")
    .then((r) => r.json())
    .then((data) => {
      if (data?.demo_state?.stage && demoStageBadge) {
        demoStageBadge.textContent = `Stage: ${data.demo_state.stage}`;
      }
    })
    .catch(() => {});

  // -------------------------------------------------------------
  // Legacy Seeded Scenario & Real Workspace Logic
  // -------------------------------------------------------------
  async function parkInitialState() {
    if (voiceBriefText) voiceBriefText.textContent = '"Park this." Capturing cognitive checkpoint...';
    try {
      const res = await fetch("/api/scenario/load-seeded", { method: "POST" });
      const data = await res.json();
      const cp = data.checkpoint;

      if (voiceBriefText) {
        voiceBriefText.textContent = `Parked checkpoint "${cp.checkpoint_id}" for "${cp.goal.text}". 3 evidence items and 1 assumption captured.`;
      }
      renderCheckpoint(cp);
      renderNextAction(cp.next_actions[0]);

      if (metricStale) metricStale.textContent = "0";
      if (metricChanged) metricChanged.textContent = "0";
      if (metricValid) metricValid.textContent = String(cp.artifacts.length + cp.decisions.length);
      if (staleList) staleList.innerHTML = `<div class="empty-state">No stale assumptions. State freshly captured.</div>`;
      if (changedList) changedList.innerHTML = `<div class="empty-state">No changes yet. State matches captured checkpoint.</div>`;
      if (validList) {
        validList.innerHTML = cp.artifacts
          .map((a) => `<div class="item-card item-card-success"><span class="card-title">${a.path_or_uri}</span><span class="card-detail">Version ${a.version_or_hash}</span></div>`)
          .join("");
      }

      renderThenNow(
        {
          goal: cp.goal.text,
          active_assumption: cp.assumptions[0]?.statement,
          relevant_decision: cp.decisions[0]?.description,
          checkpoint_id: cp.checkpoint_id,
          old_evidence_hash: cp.artifacts[0]?.version_or_hash
        },
        {
          changed_artifacts: [],
          stale_assumption_status: "VALID — Matches Baseline",
          invalidation_reason: "None",
          new_evidence_hash: cp.artifacts[0]?.version_or_hash
        }
      );
    } catch (err) {
      if (voiceBriefText) voiceBriefText.textContent = `Error: ${err.message}`;
    }
  }

  async function simulateInterruption() {
    if (voiceBriefText) {
      voiceBriefText.textContent =
        'Simulating user away from desk... Teammate pushed commit to components/InvoiceFilter.tsx changing status mapping to lowercase "paid".';
    }
    if (changedList) {
      changedList.innerHTML = `
        <div class="item-card item-card-warning">
          <span class="card-title">components/InvoiceFilter.tsx</span>
          <span class="card-detail">Commit 9ab1c3d: Refactored filter enum mapping to lowercase 'paid'</span>
          <span class="card-provenance">version: v1.0.0-hash-a1b2c3d4 &rarr; v1.1.0-hash-e5f6g7h8</span>
        </div>
      `;
    }
    if (metricChanged) metricChanged.textContent = "1";
    const diffTab = document.querySelector('[data-tab="diff"]');
    if (diffTab) diffTab.click();
  }

  async function resumeAndDiff() {
    if (voiceBriefText) voiceBriefText.textContent = '"Alexa, resume my thread." Reconstructing state and comparing with current reality...';
    try {
      const res = await fetch("/api/scenario/simulate-interruption", { method: "POST" });
      const data = await res.json();
      const brief = data.brief;
      const diff = brief.continuity_diff;

      if (voiceBriefText) voiceBriefText.textContent = `"${brief.voice_summary}"`;
      renderNextAction(brief.grounded_next_action);

      if (metricStale) metricStale.textContent = String(diff.stale_assumptions.length);
      if (metricChanged) metricChanged.textContent = String(diff.changed.length);
      if (metricValid) metricValid.textContent = String(diff.still_valid.length);

      if (diff.stale_assumptions.length > 0 && staleList) {
        staleList.innerHTML = diff.stale_assumptions
          .map(
            (sa) => `
          <div class="item-card item-card-danger">
            <span class="card-title">Assumption [${sa.assumption_id}]: "${sa.statement}"</span>
            <span class="card-detail">${sa.reason_stale}</span>
            ${sa.affected_decision_ids?.length > 0 ? `<span class="badge badge-neutral" style="margin-top:4px">Propagated Staleness: Decision [${sa.affected_decision_ids.join(", ")}] needs review</span>` : ""}
          </div>
        `
          )
          .join("");
      }

      if (diff.changed.length > 0 && changedList) {
        changedList.innerHTML = diff.changed
          .map(
            (ch) => `
          <div class="item-card item-card-warning">
            <span class="card-title">${ch.path}</span>
            <span class="card-detail">${ch.diff_summary}</span>
            <span class="card-provenance">Then: ${ch.then_version} &bull; Now: ${ch.now_version}</span>
          </div>
        `
          )
          .join("");
      }

      if (diff.still_valid.length > 0 && validList) {
        validList.innerHTML = diff.still_valid
          .map(
            (sv) => `
          <div class="item-card item-card-success">
            <span class="card-title">[${sv.type.toUpperCase()}] ${sv.id}</span>
            <span class="card-detail">${sv.summary}</span>
          </div>
        `
          )
          .join("");
      }

      renderThenNow(
        {
          goal: "Fix invoice filtering by status on the customer billing dashboard",
          active_assumption: "Frontend mapping in components/InvoiceFilter.tsx expects uppercase 'PAID' string",
          relevant_decision: "Backend service is not responsible for the invoice filtering failure",
          checkpoint_id: "cp-invoice-001",
          old_evidence_hash: "v1.0.0-hash-a1b2c3d4"
        },
        {
          changed_artifacts: ["components/InvoiceFilter.tsx"],
          stale_assumption_status: "STALE — Invalidation Detected",
          invalidation_reason: "components/InvoiceFilter.tsx changed while away",
          new_evidence_hash: "v1.1.0-hash-e5f6g7h8"
        }
      );

      renderAssessment({
        observed: [
          "components/InvoiceFilter.tsx modified while away",
          "Direct API test previously returned 15 valid records"
        ],
        derived: [
          "Assumption 'Frontend expects uppercase PAID' is invalidated by new code",
          "Decision 'Backend service not responsible' requires re-verification"
        ],
        inferred: [
          "Teammate commit 9ab1c3d introduced lowercase filter enum"
        ],
        unknown: [
          "Whether customer dashboard frontend tests were updated for lowercase enum"
        ]
      });

      renderBadges(["Git Evidence", "Needs Review", "Grounded"]);
    } catch (err) {
      if (voiceBriefText) voiceBriefText.textContent = `Error: ${err.message}`;
    }
  }

  async function exportHandoff() {
    try {
      const res = await fetch(`/api/handoff/thread-invoice-filtering`);
      const data = await res.json();
      if (handoffJson) handoffJson.textContent = JSON.stringify(data.handoff, null, 2);
      const handoffTab = document.querySelector('[data-tab="handoff"]');
      if (handoffTab) handoffTab.click();
    } catch (err) {
      if (handoffJson) handoffJson.textContent = `Error: ${err.message}`;
    }
  }

  async function parkWorkspace() {
    const wsPath = inputWorkspacePath?.value?.trim() || "";
    if (voiceBriefText) voiceBriefText.textContent = `Parking real workspace: ${wsPath || "(current working directory)"}...`;
    try {
      const res = await fetch("/api/workspace/park", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspace_path: wsPath || undefined })
      });
      const data = await res.json();
      if (data.status === "error") {
        if (voiceBriefText) voiceBriefText.textContent = `Error: ${data.message}`;
        return;
      }
      const cp = data.checkpoint;
      if (voiceBriefText) {
        voiceBriefText.textContent = `Parked workspace checkpoint "${cp.checkpoint_id}". ${cp.evidence.length} evidence items and ${cp.artifacts.length} artifacts captured.`;
      }
      renderCheckpoint(cp);
      if (cp.next_actions && cp.next_actions.length > 0) {
        renderNextAction(cp.next_actions[0]);
      }
      renderBadges(["Git Evidence", "Grounded"]);
    } catch (err) {
      if (voiceBriefText) voiceBriefText.textContent = `Error: ${err.message}`;
    }
  }

  async function resumeWorkspace() {
    const wsPath = inputWorkspacePath?.value?.trim() || "";
    if (voiceBriefText) voiceBriefText.textContent = `Resuming real workspace: ${wsPath || "(current working directory)"}...`;
    try {
      const res = await fetch("/api/workspace/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspace_path: wsPath || undefined })
      });
      const data = await res.json();
      if (data.status === "error") {
        if (voiceBriefText) voiceBriefText.textContent = `Error: ${data.message}`;
        return;
      }
      const brief = data.brief;
      if (voiceBriefText) voiceBriefText.textContent = `"${brief.voice_summary}"`;
      renderNextAction(brief.grounded_next_action);
      renderBadges(["Git Evidence", brief.continuity_diff?.stale_assumptions?.length > 0 ? "Needs Review" : "Grounded"]);
    } catch (err) {
      if (voiceBriefText) voiceBriefText.textContent = `Error: ${err.message}`;
    }
  }

  // Event Listeners for Seeded & Workspace controls
  if (btnStep1) btnStep1.addEventListener("click", parkInitialState);
  if (btnAlexaPark) btnAlexaPark.addEventListener("click", parkInitialState);

  if (btnStep2) btnStep2.addEventListener("click", simulateInterruption);

  if (btnStep3) btnStep3.addEventListener("click", resumeAndDiff);
  if (btnAlexaResume) btnAlexaResume.addEventListener("click", resumeAndDiff);

  if (btnStep4) btnStep4.addEventListener("click", exportHandoff);

  if (btnWorkspacePark) btnWorkspacePark.addEventListener("click", parkWorkspace);
  if (btnWorkspaceResume) btnWorkspaceResume.addEventListener("click", resumeWorkspace);

  // Auto-load initial state
  parkInitialState();
});
