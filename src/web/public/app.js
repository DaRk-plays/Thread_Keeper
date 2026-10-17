// Visual Continuity Console Interactive Logic
document.addEventListener("DOMContentLoaded", () => {
  const currentThreadId = "thread-invoice-filtering";

  // Elements
  const btnStep1 = document.getElementById("btn-step-1");
  const btnStep2 = document.getElementById("btn-step-2");
  const btnStep3 = document.getElementById("btn-step-3");
  const btnStep4 = document.getElementById("btn-step-4");
  const btnAlexaPark = document.getElementById("btn-alexa-park");
  const btnAlexaResume = document.getElementById("btn-alexa-resume");

  const voiceBriefText = document.getElementById("voice-brief-text");
  const nextActionDesc = document.getElementById("next-action-desc");
  const nextActionPriority = document.getElementById("next-action-priority");
  const nextActionTarget = document.getElementById("next-action-target");
  const nextActionRationale = document.getElementById("next-action-rationale");

  const metricStale = document.getElementById("metric-stale");
  const metricChanged = document.getElementById("metric-changed");
  const metricValid = document.getElementById("metric-valid");

  const staleList = document.getElementById("stale-assumptions-list");
  const changedList = document.getElementById("changed-artifacts-list");
  const validList = document.getElementById("valid-context-list");

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
      document.getElementById(`tab-${target}`).classList.add("active");
    });
  });

  // 1. Step 1 / Park Initial Bug State
  async function parkInitialState() {
    voiceBriefText.textContent = '"Park this." Capturing cognitive checkpoint...';
    try {
      const res = await fetch("/api/scenario/load-seeded", { method: "POST" });
      const data = await res.json();
      const cp = data.checkpoint;

      voiceBriefText.textContent = `Parked checkpoint "${cp.checkpoint_id}" for "${cp.goal.text}". 3 evidence items and 1 assumption captured.`;
      renderCheckpoint(cp);
      renderNextAction(cp.next_actions[0]);

      // Reset diff view for clean slate
      metricStale.textContent = "0";
      metricChanged.textContent = "0";
      metricValid.textContent = String(cp.artifacts.length + cp.decisions.length);
      staleList.innerHTML = `<div class="empty-state">No stale assumptions. State freshly captured.</div>`;
      changedList.innerHTML = `<div class="empty-state">No changes yet. State matches captured checkpoint.</div>`;
      validList.innerHTML = cp.artifacts
        .map((a) => `<div class="item-card item-card-success"><span class="card-title">${a.path_or_uri}</span><span class="card-detail">Version ${a.version_or_hash}</span></div>`)
        .join("");

      // Switch to checkpoint tab
      document.querySelector('[data-tab="checkpoint"]').click();
    } catch (err) {
      voiceBriefText.textContent = `Error: ${err.message}`;
    }
  }

  // 2. Step 2 / Simulate Interruption
  async function simulateInterruption() {
    voiceBriefText.textContent =
      'Simulating user away from desk... Teammate pushed commit to components/InvoiceFilter.tsx changing status mapping to lowercase "paid".';
    changedList.innerHTML = `
      <div class="item-card item-card-warning">
        <span class="card-title">components/InvoiceFilter.tsx</span>
        <span class="card-detail">Commit 9ab1c3d: Refactored filter enum mapping to lowercase 'paid'</span>
        <span class="card-provenance">version: v1.0.0-hash-a1b2c3d4 &rarr; v1.1.0-hash-e5f6g7h8</span>
      </div>
    `;
    metricChanged.textContent = "1";
    document.querySelector('[data-tab="diff"]').click();
  }

  // 3. Step 3 / Resume & Continuity Diff
  async function resumeAndDiff() {
    voiceBriefText.textContent = '"Alexa, resume my thread." Reconstructing state and comparing with current reality...';
    try {
      const res = await fetch("/api/scenario/simulate-interruption", { method: "POST" });
      const data = await res.json();
      const brief = data.brief;
      const diff = brief.continuity_diff;

      // Update Voice Brief
      voiceBriefText.textContent = `"${brief.voice_summary}"`;

      // Update Grounded Next Action
      renderNextAction(brief.grounded_next_action);

      // Update Metrics
      metricStale.textContent = String(diff.stale_assumptions.length);
      metricChanged.textContent = String(diff.changed.length);
      metricValid.textContent = String(diff.still_valid.length);

      // Render Stale Assumptions
      if (diff.stale_assumptions.length > 0) {
        staleList.innerHTML = diff.stale_assumptions
          .map(
            (sa) => `
          <div class="item-card item-card-danger">
            <span class="card-title">Assumption [${sa.assumption_id}]: "${sa.statement}"</span>
            <span class="card-detail">${sa.reason_stale}</span>
            ${sa.affected_decision_ids.length > 0 ? `<span class="badge badge-neutral" style="margin-top:4px">Propagated Staleness: Decision [${sa.affected_decision_ids.join(", ")}] needs review</span>` : ""}
          </div>
        `
          )
          .join("");
      }

      // Render Changed Artifacts
      if (diff.changed.length > 0) {
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

      // Render Valid Context
      if (diff.still_valid.length > 0) {
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

      document.querySelector('[data-tab="diff"]').click();
    } catch (err) {
      voiceBriefText.textContent = `Error: ${err.message}`;
    }
  }

  // 4. Step 4 / Export Agent Handoff Packet
  async function exportHandoff() {
    try {
      const res = await fetch(`/api/handoff/${currentThreadId}`);
      const data = await res.json();
      handoffJson.textContent = JSON.stringify(data.handoff, null, 2);
      document.querySelector('[data-tab="handoff"]').click();
    } catch (err) {
      handoffJson.textContent = `Error: ${err.message}`;
    }
  }

  function renderNextAction(action) {
    if (!action) return;
    nextActionDesc.textContent = action.description;
    nextActionPriority.textContent = action.priority.toUpperCase();
    nextActionPriority.className =
      action.priority === "immediate" ? "badge badge-success" : "badge badge-neutral";
    nextActionTarget.textContent = action.target_artifact || "general";
    nextActionRationale.textContent = `Rationale: ${action.rationale}`;
  }

  function renderCheckpoint(cp) {
    cpGoal.textContent = cp.goal.text;

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

  // Event Listeners
  btnStep1.addEventListener("click", parkInitialState);
  btnAlexaPark.addEventListener("click", parkInitialState);

  btnStep2.addEventListener("click", simulateInterruption);

  btnStep3.addEventListener("click", resumeAndDiff);
  btnAlexaResume.addEventListener("click", resumeAndDiff);

  btnStep4.addEventListener("click", exportHandoff);

  // Auto-load initial state
  parkInitialState();
});
