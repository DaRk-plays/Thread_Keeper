// Visual Continuity Console Interactive Logic — Milestone 4 / Navigation & Dynamic Data Audit
document.addEventListener("DOMContentLoaded", () => {
  const currentThreadId = "thread-demo-currency-validation";

  // Check URL parameters
  const urlParams = new window.URLSearchParams(window.location.search);
  if (urlParams.get("videoDemo") === "1") {
    document.body.classList.add("video-mode");
  }
  const urlTheme = urlParams.get("theme");
  if (urlTheme === "light" || (!urlTheme && window.localStorage && window.localStorage.getItem("tk-theme") === "light")) {
    document.body.classList.add("theme-light");
  }

  // Ambient UI Empty State Flag (Demo Recording Helper)
  // When ?state=empty or ?demo=fresh is present, the Home screen displays the clean empty state without deleting persisted cloud checkpoints
  let sessionEmptyState = urlParams.get("state") === "empty" || urlParams.get("demo") === "fresh";

  const btnToggleTheme = document.getElementById("btn-toggle-theme");
  if (btnToggleTheme) {
    const updateThemeBtn = () => {
      const isLight = document.body.classList.contains("theme-light");
      const icon = document.getElementById("theme-toggle-icon");
      const text = document.getElementById("theme-toggle-text");
      if (icon) icon.textContent = isLight ? "🌙" : "☀️";
      if (text) text.textContent = isLight ? "Dark" : "Light";
    };
    updateThemeBtn();
    btnToggleTheme.addEventListener("click", () => {
      document.body.classList.toggle("theme-light");
      if (window.localStorage) {
        window.localStorage.setItem("tk-theme", document.body.classList.contains("theme-light") ? "light" : "dark");
      }
      updateThemeBtn();
    });
  }

  // Active Test Scenario Selection: 'payment' (default official demo) or 'auth' (test proof)
  let activeScenario = urlParams.get("fixture") === "auth" ? "auth" : "payment";

  // Second Local Test Fixture for Generalization Verification (Zero AWS calls, purely local)
  const AUTH_TEST_FIXTURE = {
    intent: "where_was_i",
    spoken_response: "You were fixing authentication session refresh. While you were away, src/auth/session.ts changed. That means your previous assumption—that refresh tokens survive browser restart—needs review. I don't yet know whether the refresh token cookie was cleared or who made the change. Next, inspect the changed refresh-token handling before continuing.",
    display_title: "Alexa+ Continuity Assessment",
    badges: ["Git Evidence", "Local Fixture", "Grounded", "Needs Review"],
    then_state: {
      goal: "Fix authentication session refresh",
      checkpoint_time: "2026-10-22T08:00:00.000Z",
      relevant_decision: "Use HTTP-only refresh cookies for session persistence",
      active_assumption: "Refresh tokens survive browser restart",
      old_evidence_hash: "sha256-a1b2c3d4e5f60718",
      checkpoint_id: "cp-auth-042"
    },
    now_state: {
      changed_artifacts: ["src/auth/session.ts"],
      new_evidence_hash: "sha256-9f8e7d6c5b4a3210",
      stale_assumption_status: "STALE / NEEDS REVIEW",
      invalidation_reason: "src/auth/session.ts modified while away"
    },
    assessment: {
      observed: ["src/auth/session.ts changed while away (hash: sha256-9f8e7d6c...)"],
      derived: ["The artifact underlying the assumption changed, so the assumption is marked stale"],
      inferred: ["Cookie expiration configuration in session handler may have been modified"],
      unknown: ["Who made the change", "Whether the refresh token cookie was cleared"]
    },
    next_action: {
      description: "Inspect the changed refresh-token handling before continuing.",
      priority: "immediate",
      target: "src/auth/session.ts",
      rationale: "Underlying state changed while away: src/auth/session.ts. Prior assumption 'Refresh tokens survive browser restart' is stale."
    },
    thread_id: "thread-auth-session-refresh",
    checkpoint_id: "cp-auth-042"
  };

  // Screen View Elements
  const screens = {
    home: document.getElementById("screen-home"),
    listening: document.getElementById("screen-listening"),
    parked: document.getElementById("screen-parked"),
    resume: document.getElementById("screen-resume"),
    diff: document.getElementById("screen-diff"),
    next: document.getElementById("screen-next")
  };

  function navigateTo(screenKey, pushHistory = true) {
    if (!screens[screenKey]) return;

    Object.keys(screens).forEach((key) => {
      screens[key].classList.toggle("active", key === screenKey);
    });

    // Update nav link active state
    const navBtnHome = document.getElementById("nav-btn-home");
    if (navBtnHome) {
      navBtnHome.classList.toggle("active", screenKey === "home");
    }

    // Scroll to top of stage
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Push history state if requested
    if (pushHistory && window.history && window.history.pushState) {
      const hash = screenKey === "home" ? "" : `#${screenKey}`;
      window.history.pushState({ screen: screenKey }, "", hash || window.location.pathname + window.location.search);
    }
  }

  // Handle browser back/forward buttons
  window.addEventListener("popstate", (event) => {
    if (event.state && event.state.screen && screens[event.state.screen]) {
      navigateTo(event.state.screen, false);
    } else {
      const hash = window.location.hash.replace("#", "");
      if (hash && screens[hash]) {
        navigateTo(hash, false);
      } else {
        navigateTo("home", false);
      }
    }
  });

  // Drawer Elements
  const btnToggleDemo = document.getElementById("btn-toggle-demo");
  const btnCloseDemoDrawer = document.getElementById("btn-close-demo-drawer");
  const demoDrawer = document.getElementById("demo-drawer");

  const btnToggleTech = document.getElementById("btn-toggle-tech");
  const btnCloseTechDrawer = document.getElementById("btn-close-tech-drawer");
  const techDrawer = document.getElementById("tech-drawer");
  const drawerBackdrop = document.getElementById("drawer-backdrop");

  function openDrawer(drawer) {
    if (!drawer) return;
    drawer.classList.add("open");
    drawer.setAttribute("aria-hidden", "false");
    if (drawerBackdrop) {
      drawerBackdrop.classList.add("active");
      drawerBackdrop.setAttribute("aria-hidden", "false");
    }
  }

  function closeAllDrawers() {
    if (demoDrawer) {
      demoDrawer.classList.remove("open");
      demoDrawer.setAttribute("aria-hidden", "true");
    }
    if (techDrawer) {
      techDrawer.classList.remove("open");
      techDrawer.setAttribute("aria-hidden", "true");
    }
    if (drawerBackdrop) {
      drawerBackdrop.classList.remove("active");
      drawerBackdrop.setAttribute("aria-hidden", "true");
    }
  }

  // Header Navigation Handlers
  const brandLink = document.getElementById("brand-link");
  if (brandLink) {
    brandLink.addEventListener("click", (e) => {
      e.preventDefault();
      closeAllDrawers();
      navigateTo("home");
    });
  }

  const navBtnHome = document.getElementById("nav-btn-home");
  if (navBtnHome) {
    navBtnHome.addEventListener("click", () => {
      closeAllDrawers();
      navigateTo("home");
    });
  }

  const navBtnThreads = document.getElementById("nav-btn-threads");
  if (navBtnThreads) {
    navBtnThreads.addEventListener("click", () => {
      openDrawer(techDrawer);
      const cpTab = document.querySelector('[data-tab="checkpoint"]');
      if (cpTab) cpTab.click();
    });
  }

  if (btnToggleDemo) btnToggleDemo.addEventListener("click", () => openDrawer(demoDrawer));
  if (btnCloseDemoDrawer) btnCloseDemoDrawer.addEventListener("click", closeAllDrawers);
  if (btnToggleTech) btnToggleTech.addEventListener("click", () => openDrawer(techDrawer));
  if (btnCloseTechDrawer) btnCloseTechDrawer.addEventListener("click", closeAllDrawers);
  if (drawerBackdrop) drawerBackdrop.addEventListener("click", closeAllDrawers);

  // Generic Back Navigation Handlers
  document.querySelectorAll(".nav-back").forEach((btn) => {
    btn.addEventListener("click", () => navigateTo("home"));
  });

  const btnHomeViewWhere = document.getElementById("btn-home-view-where");
  if (btnHomeViewWhere) btnHomeViewWhere.addEventListener("click", () => runDemoResume());

  const btnParkedDone = document.getElementById("btn-parked-done");
  if (btnParkedDone) btnParkedDone.addEventListener("click", () => navigateTo("home"));

  const btnParkedTech = document.getElementById("btn-parked-tech");
  if (btnParkedTech) btnParkedTech.addEventListener("click", () => openDrawer(techDrawer));

  const btnResumeShowChanged = document.getElementById("btn-resume-show-changed");
  if (btnResumeShowChanged) btnResumeShowChanged.addEventListener("click", () => navigateTo("diff"));

  const btnResumeViewTech = document.getElementById("btn-resume-view-tech");
  if (btnResumeViewTech) btnResumeViewTech.addEventListener("click", () => openDrawer(techDrawer));

  const btnResumeHome = document.getElementById("btn-resume-home");
  if (btnResumeHome) btnResumeHome.addEventListener("click", () => navigateTo("home"));

  const btnDiffBack = document.getElementById("btn-diff-back");
  if (btnDiffBack) btnDiffBack.addEventListener("click", () => navigateTo("resume"));

  const btnDiffToNext = document.getElementById("btn-diff-to-next");
  if (btnDiffToNext) btnDiffToNext.addEventListener("click", () => navigateTo("next"));

  const btnDiffTech = document.getElementById("btn-diff-tech");
  if (btnDiffTech) btnDiffTech.addEventListener("click", () => openDrawer(techDrawer));

  const btnNextBack = document.getElementById("btn-next-back");
  if (btnNextBack) btnNextBack.addEventListener("click", () => navigateTo("resume"));

  const btnNextOpenDiff = document.getElementById("btn-next-open-diff");
  if (btnNextOpenDiff) btnNextOpenDiff.addEventListener("click", () => navigateTo("diff"));

  const btnNextHome = document.getElementById("btn-next-home");
  if (btnNextHome) btnNextHome.addEventListener("click", () => navigateTo("home"));

  // Scenario Switcher Handlers (Demo Drawer)
  const btnSelectPayment = document.getElementById("btn-select-payment");
  const btnSelectAuth = document.getElementById("btn-select-auth");

  function setScenario(scenarioKey) {
    activeScenario = scenarioKey;
    if (btnSelectPayment) btnSelectPayment.classList.toggle("active", scenarioKey === "payment");
    if (btnSelectAuth) btnSelectAuth.classList.toggle("active", scenarioKey === "auth");

    if (scenarioKey === "auth") {
      updateHomeStateWithCheckpoint({
        goal: { text: AUTH_TEST_FIXTURE.then_state.goal },
        updatedAt: AUTH_TEST_FIXTURE.then_state.checkpoint_time,
        changedFile: AUTH_TEST_FIXTURE.now_state.changed_artifacts[0],
        status: "Needs review"
      });
    } else {
      syncDemoStateFromServer();
    }
  }

  if (btnSelectPayment) btnSelectPayment.addEventListener("click", () => setScenario("payment"));
  if (btnSelectAuth) btnSelectAuth.addEventListener("click", () => setScenario("auth"));

  // Conversational Input & Chips
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

  // Elements: Home Dynamic Last Parked Thread
  const homeThreadActiveContent = document.getElementById("home-thread-active-content");
  const homeThreadEmptyContent = document.getElementById("home-thread-empty-content");
  const homeThreadTitle = document.getElementById("home-thread-title");
  const homeThreadSubtitle = document.getElementById("home-thread-subtitle");
  const homeThreadBadge = document.getElementById("home-thread-badge");
  const homeThreadDriftFile = document.getElementById("home-thread-drift-file");

  // Elements: Hero Screen Generic Displays
  const heroResumeGoal = document.getElementById("hero-resume-goal");
  const narrativeAwayText = document.getElementById("narrative-away-text");
  const narrativeStaleText = document.getElementById("narrative-stale-text");
  const narrativeUnknownText = document.getElementById("narrative-unknown-text");
  const narrativeNextText = document.getElementById("narrative-next-text");

  // Elements: What Changed Generic Displays
  const diffFileThen = document.getElementById("diff-file-then");
  const diffHashThen = document.getElementById("diff-hash-then");
  const diffAssumptionThen = document.getElementById("diff-assumption-then");
  const diffFileNow = document.getElementById("diff-file-now");
  const diffHashNow = document.getElementById("diff-hash-now");
  const diffAssumptionNow = document.getElementById("diff-assumption-now");
  const diffBadgeNow = document.getElementById("diff-badge-now");
  const diffObservedText = document.getElementById("diff-observed-text");
  const diffDerivedText = document.getElementById("diff-derived-text");
  const diffInferredText = document.getElementById("diff-inferred-text");
  const diffUnknownText = document.getElementById("diff-unknown-text");

  // Elements: Next Action Generic Displays
  const spotlightActionTitle = document.getElementById("spotlight-action-title");
  const spotlightActionWhy = document.getElementById("spotlight-action-why");
  const spotlightActionPriority = document.getElementById("spotlight-action-priority");
  const spotlightActionTarget = document.getElementById("spotlight-action-target");

  // Elements: Park Screen Displays
  const parkedTitle = document.getElementById("parked-title");
  const parkedSubhead = document.getElementById("parked-subhead");
  const listeningHeadline = document.getElementById("listening-headline");
  const listeningSubtext = document.getElementById("listening-subtext");

  // Compatibility Elements: Grounded Next Action & Technical Fields
  const nextActionDesc = document.getElementById("next-action-desc");
  const nextActionPriority = document.getElementById("next-action-priority");
  const nextActionTarget = document.getElementById("next-action-target");
  const nextActionRationale = document.getElementById("next-action-rationale");

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

  const assessmentObserved = document.getElementById("assessment-observed");
  const assessmentDerived = document.getElementById("assessment-derived");
  const assessmentInferred = document.getElementById("assessment-inferred");
  const assessmentUnknown = document.getElementById("assessment-unknown");

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

  // Tab switching in Technical Details Drawer
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
        else if (b.includes("Review") || b.includes("Stale") || b.includes("Dirty")) cls = "badge-danger";
        else if (b.includes("Git") || b.includes("Grounded")) cls = "badge-info";
        return `<span class="badge ${cls}">${b}</span>`;
      })
      .join(" ");
  }

  // -------------------------------------------------------------
  // PART 4: GENERIC RESUME VIEW MODEL RENDERER
  // Completely decoupling presentation from payment/currency strings
  // -------------------------------------------------------------
  function createResumeViewModel(resp) {
    const thenState = resp.then_state || {};
    const nowState = resp.now_state || {};
    const assessment = resp.assessment || {};
    const nextAction = resp.next_action || {};

    return {
      goal: thenState.goal || "Active Development Task",
      checkpointTime: thenState.checkpoint_time || new Date().toISOString(),
      checkpointId: resp.checkpoint_id || thenState.checkpoint_id || "cp-latest",
      oldEvidenceHash: thenState.old_evidence_hash || "sha256-baseline...",
      activeAssumption: thenState.active_assumption || "Baseline working assumption",
      relevantDecision: thenState.relevant_decision || "Current implementation approach",
      changedArtifacts: nowState.changed_artifacts || [],
      newEvidenceHash: nowState.new_evidence_hash || "sha256-modified...",
      staleAssumptionStatus: nowState.stale_assumption_status || "VALID",
      invalidationReason: nowState.invalidation_reason || "None",
      observed: assessment.observed || [],
      derived: assessment.derived || [],
      inferred: assessment.inferred || [],
      unknowns: assessment.unknown || [],
      nextAction: {
        description: nextAction.description || "Inspect the changed logic before continuing.",
        priority: nextAction.priority || "immediate",
        target: nextAction.target || "workspace",
        rationale: nextAction.rationale || "Underlying workspace state changed while away."
      },
      badges: resp.badges || []
    };
  }

  function renderGenericResumeView(model) {
    // 1. Hero Screen (screen-resume)
    if (heroResumeGoal) heroResumeGoal.textContent = model.goal;

    if (narrativeAwayText) {
      if (model.changedArtifacts.length > 0) {
        narrativeAwayText.innerHTML = `<code id="hero-changed-artifact" class="code-pill">${model.changedArtifacts.join(", ")}</code> changed.`;
      } else {
        narrativeAwayText.textContent = "Working tree is clean. No external changes detected.";
      }
    }

    if (narrativeStaleText) {
      if (model.staleAssumptionStatus.includes("STALE") || model.staleAssumptionStatus.includes("NEEDS REVIEW")) {
        narrativeStaleText.innerHTML = `Your previous assumption: <span id="hero-stale-assumption" class="stale-quote">&ldquo;${model.activeAssumption}&rdquo;</span>`;
      } else {
        narrativeStaleText.innerHTML = `All previous assumptions remain valid: <span class="stale-quote">&ldquo;${model.activeAssumption}&rdquo;</span>`;
      }
    }

    if (narrativeUnknownText) {
      if (model.unknowns.length > 0) {
        narrativeUnknownText.textContent = model.unknowns.join(" • ");
      } else {
        narrativeUnknownText.textContent = "All relevant state factors observed and accounted for.";
      }
    }

    if (narrativeNextText) {
      narrativeNextText.textContent = model.nextAction.description;
    }

    // 2. What Changed Screen (screen-diff)
    const primaryFile = model.changedArtifacts[0] || "workspace";
    if (diffFileThen) diffFileThen.textContent = primaryFile;
    if (diffHashThen) diffHashThen.textContent = `${model.oldEvidenceHash.slice(0, 24)}...`;
    if (diffAssumptionThen) diffAssumptionThen.textContent = model.activeAssumption;

    if (diffFileNow) diffFileNow.textContent = primaryFile;
    if (diffHashNow) diffHashNow.textContent = `${model.newEvidenceHash.slice(0, 24)}...`;
    if (diffAssumptionNow) {
      diffAssumptionNow.textContent = model.staleAssumptionStatus.includes("STALE")
        ? "Stale • Requires review"
        : "Valid • Matches baseline";
      diffAssumptionNow.className = model.staleAssumptionStatus.includes("STALE")
        ? "mini-val text-needs-review"
        : "mini-val text-memory";
    }
    if (diffBadgeNow) {
      diffBadgeNow.textContent = model.staleAssumptionStatus.includes("STALE") ? "NEEDS REVIEW" : "VALID";
      diffBadgeNow.className = model.staleAssumptionStatus.includes("STALE")
        ? "badge-pill badge-pill-danger"
        : "badge-pill badge-pill-info";
    }

    if (diffObservedText) diffObservedText.textContent = model.observed[0] || (model.changedArtifacts.length > 0 ? `${model.changedArtifacts.join(", ")} changed` : "Working tree clean");
    if (diffDerivedText) diffDerivedText.textContent = model.derived[0] || "Previous assumption requires review";
    if (diffInferredText) diffInferredText.textContent = model.inferred[0] || "Implementation logic may have changed";
    if (diffUnknownText) diffUnknownText.textContent = model.unknowns.join(" • ") || "None";

    // 3. Next Action Screen (screen-next)
    if (spotlightActionTitle) spotlightActionTitle.textContent = model.nextAction.description;
    if (spotlightActionWhy) spotlightActionWhy.textContent = model.nextAction.rationale;
    if (spotlightActionPriority) spotlightActionPriority.textContent = `Priority: ${model.nextAction.priority.toUpperCase()}`;
    if (spotlightActionTarget) spotlightActionTarget.textContent = `Target: ${model.nextAction.target || primaryFile}`;

    // 4. Park Screen
    if (parkedTitle) parkedTitle.textContent = model.goal;
    if (parkedSubhead) parkedSubhead.textContent = `Saved to ThreadKeeper • Checkpoint ${model.checkpointId}`;

    // 5. Technical Details Drawer compatibility fields
    if (thenGoal) thenGoal.textContent = model.goal;
    if (thenAssumption) thenAssumption.textContent = model.activeAssumption;
    if (thenDecision) thenDecision.textContent = model.relevantDecision;
    if (thenCheckpointId) thenCheckpointId.textContent = model.checkpointId;
    if (thenEvidenceHash) thenEvidenceHash.textContent = model.oldEvidenceHash;

    if (nowChangedFiles) nowChangedFiles.textContent = model.changedArtifacts.join(", ") || "None";
    if (nowAssumptionStatus) nowAssumptionStatus.textContent = model.staleAssumptionStatus;
    if (nowInvalidationReason) nowInvalidationReason.textContent = model.invalidationReason;
    if (nowEvidenceHash) nowEvidenceHash.textContent = model.newEvidenceHash;
    if (nowDeltaSummary) nowDeltaSummary.textContent = model.changedArtifacts.length > 0 ? "External modification detected while away." : "State intact.";

    if (nextActionDesc) nextActionDesc.textContent = model.nextAction.description;
    if (nextActionPriority) nextActionPriority.textContent = model.nextAction.priority.toUpperCase();
    if (nextActionTarget) nextActionTarget.textContent = model.nextAction.target;
    if (nextActionRationale) nextActionRationale.textContent = model.nextAction.rationale;

    if (assessmentObserved) assessmentObserved.innerHTML = model.observed.map((o) => `<li>${o}</li>`).join("");
    if (assessmentDerived) assessmentDerived.innerHTML = model.derived.map((d) => `<li>${d}</li>`).join("");
    if (assessmentInferred) assessmentInferred.innerHTML = model.inferred.map((i) => `<li>${i}</li>`).join("");
    if (assessmentUnknown) assessmentUnknown.innerHTML = model.unknowns.map((u) => `<li>${u}</li>`).join("");

    renderBadges(model.badges);
  }

  // -------------------------------------------------------------
  // PART 2: DYNAMIC HOME STATE
  // -------------------------------------------------------------
  function updateHomeStateWithCheckpoint(data) {
    const homeLastThreadEyebrow = document.getElementById("home-last-thread-eyebrow");
    if (!data || !data.goal) {
      // Empty state
      if (homeThreadActiveContent) homeThreadActiveContent.style.display = "none";
      if (homeThreadEmptyContent) homeThreadEmptyContent.style.display = "block";
      if (homeLastThreadEyebrow) homeLastThreadEyebrow.style.display = "none";
      return;
    }

    if (homeThreadActiveContent) homeThreadActiveContent.style.display = "block";
    if (homeThreadEmptyContent) homeThreadEmptyContent.style.display = "none";
    if (homeLastThreadEyebrow) homeLastThreadEyebrow.style.display = "block";

    if (homeThreadTitle) homeThreadTitle.textContent = data.goal.text || data.goal || "Parked Task";
    if (homeThreadSubtitle) {
      const timeStr = data.updatedAt ? new Date(data.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Recently";
      homeThreadSubtitle.textContent = `Parked ${timeStr} • ${data.branch || "main"}`;
    }

    if (homeThreadBadge) {
      const isStale = data.status?.includes("review") || data.status?.includes("stale") || data.stage === "interrupted" || data.stage === "resumed";
      homeThreadBadge.textContent = isStale ? "Needs review" : "Active";
      homeThreadBadge.className = isStale ? "badge-pill badge-pill-danger" : "badge-pill badge-pill-info";
    }

    if (homeThreadDriftFile) {
      homeThreadDriftFile.textContent = data.changedFile || (data.checkpoint?.artifacts?.[0]?.path_or_uri) || "workspace";
    }
  }

  async function syncDemoStateFromServer() {
    if (sessionEmptyState) {
      if (demoStageBadge) demoStageBadge.textContent = "Stage: Ready (Fresh)";
      updateHomeStateWithCheckpoint(null);
      return;
    }
    try {
      const res = await fetch("/api/demo/status");
      const data = await res.json();
      if (data?.status === "success" && data.demo_state) {
        const ds = data.demo_state;
        if (demoStageBadge) demoStageBadge.textContent = `Stage: ${ds.stage}`;

        if (ds.checkpoint && ds.checkpoint.goal) {
          updateHomeStateWithCheckpoint({
            goal: ds.checkpoint.goal,
            updatedAt: ds.updatedAt,
            branch: ds.checkpoint.work_context?.branch || "main",
            changedFile: ds.stage === "interrupted" || ds.stage === "resumed" ? "src/payment.ts" : ds.checkpoint.artifacts?.[0]?.path_or_uri,
            status: ds.stage === "interrupted" || ds.stage === "resumed" ? "Needs review" : "Captured",
            stage: ds.stage,
            checkpoint: ds.checkpoint
          });
        } else {
          updateHomeStateWithCheckpoint(null);
        }
      } else {
        updateHomeStateWithCheckpoint(null);
      }
    } catch {
      updateHomeStateWithCheckpoint(null);
    }
  }

  // Conversational Alexa Dispatcher API Call
  async function executeAlexaCommand(cmd) {
    if (!cmd || !cmd.trim()) return;
    const cleanCmd = cmd.trim();

    // User initiated an action — leave empty state mode
    sessionEmptyState = false;

    // Show listening state
    if (listeningHeadline) listeningHeadline.textContent = `"${cleanCmd}"`;
    if (listeningSubtext) listeningSubtext.textContent = "Asking Alexa+ Continuity Agent...";
    navigateTo("listening");

    if (voiceBriefText) voiceBriefText.textContent = `🎙️ "${cleanCmd}" — Asking Alexa+...`;

    // Check if running test auth scenario locally
    if (activeScenario === "auth") {
      window.setTimeout(() => {
        const model = createResumeViewModel(AUTH_TEST_FIXTURE);
        renderGenericResumeView(model);
        if (voiceBriefText) voiceBriefText.textContent = AUTH_TEST_FIXTURE.spoken_response;

        if (cleanCmd.toLowerCase().includes("what changed")) {
          navigateTo("diff");
        } else if (cleanCmd.toLowerCase().includes("next")) {
          navigateTo("next");
        } else {
          navigateTo("resume");
        }
      }, 400);
      return;
    }

    // Default: call live backend
    try {
      const res = await fetch("/api/alexa/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command: cleanCmd,
          threadId: currentThreadId
        })
      });
      const data = await res.json();
      if (data.status === "error") {
        if (voiceBriefText) voiceBriefText.textContent = `Error: ${data.message}`;
        if (listeningHeadline) listeningHeadline.textContent = "Error";
        if (listeningSubtext) listeningSubtext.textContent = data.message;
        window.setTimeout(() => navigateTo("home"), 2000);
        return;
      }

      const resp = data.response;
      if (voiceBriefText) voiceBriefText.textContent = resp.spoken_response;

      const model = createResumeViewModel(resp);
      renderGenericResumeView(model);

      if (resp.intent === "park" || cleanCmd.toLowerCase().includes("park")) {
        sessionEmptyState = false;
        updateHomeStateWithCheckpoint({
          goal: { text: resp.then_state?.goal || model.goal },
          updatedAt: new Date().toISOString(),
          branch: "main",
          changedFile: "src/payment.ts",
          status: "Captured",
          stage: "parked",
          checkpoint: resp.raw_data
        });
        navigateTo("parked");
      } else if (cleanCmd.toLowerCase().includes("what changed")) {
        navigateTo("diff");
      } else if (cleanCmd.toLowerCase().includes("next")) {
        navigateTo("next");
      } else {
        navigateTo("resume");
      }
    } catch (err) {
      if (voiceBriefText) voiceBriefText.textContent = `Network Error: ${err.message}`;
      navigateTo("home");
    }
  }

  // Conversational Input Wiring
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
    sessionEmptyState = false;
    if (listeningHeadline) listeningHeadline.textContent = "Setting up clean fixture...";
    if (listeningSubtext) listeningSubtext.textContent = "Initializing Git repository in .demo_fixture_repo";
    navigateTo("listening");

    try {
      const res = await fetch("/api/demo/setup", { method: "POST" });
      const data = await res.json();
      if (data.status === "success") {
        if (demoStageBadge) demoStageBadge.textContent = "Stage: Fixture Initialized";
        if (voiceBriefText) voiceBriefText.textContent = "Demo Git repository initialized with prototype multi-currency payment service. Working tree clean.";
        renderBadges(["Git Evidence", "Clean Baseline"]);
        await syncDemoStateFromServer();
        window.setTimeout(() => navigateTo("home"), 400);
      } else {
        if (voiceBriefText) voiceBriefText.textContent = `Setup failed: ${data.message}`;
        navigateTo("home");
      }
    } catch (err) {
      if (voiceBriefText) voiceBriefText.textContent = `Setup error: ${err.message}`;
      navigateTo("home");
    }
  }

  async function runDemoPark() {
    sessionEmptyState = false;
    if (listeningHeadline) listeningHeadline.textContent = '"Alexa, park this."';
    if (listeningSubtext) listeningSubtext.textContent = "Persisting working context to AWS Bedrock AgentCore Memory...";
    navigateTo("listening");

    try {
      const res = await fetch("/api/demo/park", { method: "POST" });
      const data = await res.json();
      if (data.status === "success" && data.response) {
        if (demoStageBadge) demoStageBadge.textContent = "Stage: Parked to AgentCore";
        const resp = data.response;
        if (voiceBriefText) voiceBriefText.textContent = resp.spoken_response;

        const model = createResumeViewModel(resp);
        renderGenericResumeView(model);
        await syncDemoStateFromServer();
        navigateTo("parked");
      } else {
        if (voiceBriefText) voiceBriefText.textContent = `Park failed: ${data.message}`;
        navigateTo("home");
      }
    } catch (err) {
      if (voiceBriefText) voiceBriefText.textContent = `Park error: ${err.message}`;
      navigateTo("home");
    }
  }

  async function runDemoInterrupt() {
    sessionEmptyState = false;
    if (listeningHeadline) listeningHeadline.textContent = "Simulating interruption...";
    if (listeningSubtext) listeningSubtext.textContent = "src/payment.ts modified while developer away";
    navigateTo("listening");

    try {
      const res = await fetch("/api/demo/interrupt", { method: "POST" });
      const data = await res.json();
      if (data.status === "success") {
        if (demoStageBadge) demoStageBadge.textContent = "Stage: Interrupted (Dirty)";
        if (voiceBriefText) voiceBriefText.textContent = "⚡ Workspace changed while the developer was away: src/payment.ts modified, introducing currency whitelist [\"USD\", \"EUR\", \"GBP\"].";
        renderBadges(["Git Evidence", "Dirty Tree", "Needs Review"]);
        await syncDemoStateFromServer();
        window.setTimeout(() => navigateTo("home"), 400);
      } else {
        if (voiceBriefText) voiceBriefText.textContent = `Interrupt failed: ${data.message}`;
        navigateTo("home");
      }
    } catch (err) {
      if (voiceBriefText) voiceBriefText.textContent = `Interrupt error: ${err.message}`;
      navigateTo("home");
    }
  }

  async function runDemoResume() {
    sessionEmptyState = false;
    if (listeningHeadline) listeningHeadline.textContent = '"Alexa, where was I?"';
    if (listeningSubtext) listeningSubtext.textContent = "Retrieving checkpoint from AgentCore & running Continuity Diff...";
    navigateTo("listening");

    if (activeScenario === "auth") {
      window.setTimeout(() => {
        const model = createResumeViewModel(AUTH_TEST_FIXTURE);
        renderGenericResumeView(model);
        if (voiceBriefText) voiceBriefText.textContent = AUTH_TEST_FIXTURE.spoken_response;
        navigateTo("resume");
      }, 400);
      return;
    }

    try {
      const res = await fetch("/api/demo/resume", { method: "POST" });
      const data = await res.json();
      if (data.status === "success" && data.response) {
        if (demoStageBadge) demoStageBadge.textContent = "Stage: Resumed & Verified";
        const resp = data.response;
        if (voiceBriefText) voiceBriefText.textContent = resp.spoken_response;

        const model = createResumeViewModel(resp);
        renderGenericResumeView(model);
        await syncDemoStateFromServer();
        navigateTo("resume");
      } else {
        if (voiceBriefText) voiceBriefText.textContent = `Resume failed: ${data.message}`;
        navigateTo("home");
      }
    } catch (err) {
      if (voiceBriefText) voiceBriefText.textContent = `Resume error: ${err.message}`;
      navigateTo("home");
    }
  }

  if (btnDemoSetup) btnDemoSetup.addEventListener("click", runDemoSetup);
  if (btnDemoPark) btnDemoPark.addEventListener("click", runDemoPark);
  if (btnDemoInterrupt) btnDemoInterrupt.addEventListener("click", runDemoInterrupt);
  if (btnDemoResume) btnDemoResume.addEventListener("click", runDemoResume);

  const btnDemoResetHome = document.getElementById("btn-demo-reset-home");
  if (btnDemoResetHome) {
    btnDemoResetHome.addEventListener("click", () => {
      sessionEmptyState = true;
      updateHomeStateWithCheckpoint(null);
      if (demoStageBadge) demoStageBadge.textContent = "Stage: Ready (Fresh)";
      closeAllDrawers();
      navigateTo("home");
    });
  }

  const btnDemoRestoreThread = document.getElementById("btn-demo-restore-thread");
  if (btnDemoRestoreThread) {
    btnDemoRestoreThread.addEventListener("click", async () => {
      sessionEmptyState = false;
      await syncDemoStateFromServer();
      closeAllDrawers();
      navigateTo("home");
    });
  }

  // -------------------------------------------------------------
  // Legacy Seeded Scenario & Real Workspace Logic
  // -------------------------------------------------------------
  async function parkInitialState() {
    try {
      const res = await fetch("/api/scenario/load-seeded", { method: "POST" });
      const data = await res.json();
      const cp = data.checkpoint;

      if (voiceBriefText) {
        voiceBriefText.textContent = `Parked checkpoint "${cp.checkpoint_id}" for "${cp.goal.text}".`;
      }
      if (cpGoal) cpGoal.textContent = cp.goal.text;
      if (cpDecisions && cp.decisions) {
        cpDecisions.innerHTML = cp.decisions.map((d) => `<div class="item-card"><strong>${d.description}</strong><div>${d.rationale}</div></div>`).join("");
      }
      if (cpEvidence && cp.evidence) {
        cpEvidence.innerHTML = cp.evidence.map((e) => `<div class="item-card"><strong>${e.source}</strong><div>${e.content}</div></div>`).join("");
      }
      if (cpAttempts && cp.attempts) {
        cpAttempts.innerHTML = cp.attempts.map((a) => `<div class="item-card"><strong>${a.description}</strong></div>`).join("");
      }
      if (cpAssumptions && cp.assumptions) {
        cpAssumptions.innerHTML = cp.assumptions.map((a) => `<div class="item-card"><strong>${a.statement}</strong></div>`).join("");
      }

      if (metricStale) metricStale.textContent = "0";
      if (metricChanged) metricChanged.textContent = "0";
      if (metricValid) metricValid.textContent = String(cp.artifacts.length + cp.decisions.length);
      if (staleList) staleList.innerHTML = `<div class="item-card">No stale assumptions. State freshly captured.</div>`;
      if (changedList) changedList.innerHTML = `<div class="item-card">No changes yet. State matches captured checkpoint.</div>`;
      if (validList) {
        validList.innerHTML = cp.artifacts
          .map((a) => `<div class="item-card item-card-success"><strong>${a.path_or_uri}</strong><div>Version ${a.version_or_hash}</div></div>`)
          .join("");
      }

      const model = createResumeViewModel({
        then_state: {
          goal: cp.goal.text,
          active_assumption: cp.assumptions[0]?.statement,
          relevant_decision: cp.decisions[0]?.description,
          checkpoint_id: cp.checkpoint_id,
          old_evidence_hash: cp.artifacts[0]?.version_or_hash
        },
        now_state: {
          changed_artifacts: [],
          stale_assumption_status: "VALID — Matches Baseline",
          invalidation_reason: "None",
          new_evidence_hash: cp.artifacts[0]?.version_or_hash
        },
        assessment: {
          observed: ["Workspace clean and baseline verified"],
          derived: ["All assumptions valid"],
          inferred: [],
          unknown: []
        },
        next_action: cp.next_actions[0] || {
          description: "Continue baseline implementation",
          priority: "normal",
          target: "workspace"
        },
        badges: ["Git Evidence", "Clean Baseline"]
      });
      renderGenericResumeView(model);
    } catch (err) {
      if (voiceBriefText) voiceBriefText.textContent = `Error: ${err.message}`;
    }
  }

  async function simulateInterruption() {
    if (changedList) {
      changedList.innerHTML = `
        <div class="item-card item-card-warning">
          <strong>components/InvoiceFilter.tsx</strong>
          <div>Commit 9ab1c3d: Refactored filter enum mapping to lowercase 'paid'</div>
          <div style="font-size:12px; color:var(--text-muted);">version: v1.0.0-hash-a1b2c3d4 &rarr; v1.1.0-hash-e5f6g7h8</div>
        </div>
      `;
    }
    if (metricChanged) metricChanged.textContent = "1";
    const diffTab = document.querySelector('[data-tab="diff"]');
    if (diffTab) diffTab.click();
  }

  async function resumeAndDiff() {
    try {
      const res = await fetch("/api/scenario/simulate-interruption", { method: "POST" });
      const data = await res.json();
      const brief = data.brief;
      const diff = brief.continuity_diff;

      if (voiceBriefText) voiceBriefText.textContent = `"${brief.voice_summary}"`;

      if (metricStale) metricStale.textContent = String(diff.stale_assumptions.length);
      if (metricChanged) metricChanged.textContent = String(diff.changed.length);
      if (metricValid) metricValid.textContent = String(diff.still_valid.length);

      if (diff.stale_assumptions.length > 0 && staleList) {
        staleList.innerHTML = diff.stale_assumptions
          .map(
            (sa) => `
          <div class="item-card item-card-danger">
            <strong>Assumption [${sa.assumption_id}]: "${sa.statement}"</strong>
            <div>${sa.reason_stale}</div>
            ${sa.affected_decision_ids?.length > 0 ? `<div style="margin-top:4px; font-size:12px; color:#FFA3B3;">Propagated Staleness: Decision [${sa.affected_decision_ids.join(", ")}] needs review</div>` : ""}
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
            <strong>${ch.path}</strong>
            <div>${ch.diff_summary}</div>
            <div style="font-size:12px; color:var(--text-muted);">Then: ${ch.then_version} &bull; Now: ${ch.now_version}</div>
          </div>
        `
          )
          .join("");
      }

      const model = createResumeViewModel({
        then_state: {
          goal: "Fix invoice filtering by status on the customer billing dashboard",
          active_assumption: "Frontend mapping in components/InvoiceFilter.tsx expects uppercase 'PAID' string",
          relevant_decision: "Backend service is not responsible for the invoice filtering failure",
          checkpoint_id: "cp-invoice-001",
          old_evidence_hash: "v1.0.0-hash-a1b2c3d4"
        },
        now_state: {
          changed_artifacts: ["components/InvoiceFilter.tsx"],
          stale_assumption_status: "STALE — Invalidation Detected",
          invalidation_reason: "components/InvoiceFilter.tsx changed while away",
          new_evidence_hash: "v1.1.0-hash-e5f6g7h8"
        },
        assessment: {
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
        },
        next_action: brief.grounded_next_action,
        badges: ["Git Evidence", "Needs Review", "Grounded"]
      });
      renderGenericResumeView(model);
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
      openDrawer(techDrawer);
    } catch (err) {
      if (handoffJson) handoffJson.textContent = `Error: ${err.message}`;
    }
  }

  async function parkWorkspace() {
    const wsPath = inputWorkspacePath?.value?.trim() || "";
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
      const model = createResumeViewModel({
        then_state: {
          goal: cp.goal.text,
          active_assumption: cp.assumptions[0]?.statement || "Workspace baseline",
          relevant_decision: cp.decisions[0]?.description,
          checkpoint_id: cp.checkpoint_id,
          old_evidence_hash: cp.artifacts[0]?.version_or_hash
        },
        now_state: {
          changed_artifacts: [],
          stale_assumption_status: "VALID",
          new_evidence_hash: cp.artifacts[0]?.version_or_hash
        },
        next_action: cp.next_actions[0] || { description: "Continue workspace work" },
        badges: ["Git Evidence", "Grounded"]
      });
      renderGenericResumeView(model);
      await syncDemoStateFromServer();
    } catch (err) {
      if (voiceBriefText) voiceBriefText.textContent = `Error: ${err.message}`;
    }
  }

  async function resumeWorkspace() {
    const wsPath = inputWorkspacePath?.value?.trim() || "";
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
      const model = createResumeViewModel({
        then_state: {
          goal: brief.original_goal?.text || "Workspace continuity",
          active_assumption: brief.continuity_diff?.stale_assumptions[0]?.statement || "Baseline assumption",
          checkpoint_id: brief.checkpoint_id
        },
        now_state: {
          changed_artifacts: brief.continuity_diff?.changed.map((c) => c.path) || [],
          stale_assumption_status: brief.continuity_diff?.stale_assumptions.length > 0 ? "STALE / NEEDS REVIEW" : "VALID"
        },
        next_action: brief.grounded_next_action,
        badges: ["Git Evidence", brief.continuity_diff?.stale_assumptions.length > 0 ? "Needs Review" : "Grounded"]
      });
      renderGenericResumeView(model);
      navigateTo("resume");
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

  // Initial Sync from server demo state
  syncDemoStateFromServer();

  // Screen parameter or hash routing override (e.g. ?screen=resume or #resume)
  const targetScreen = urlParams.get("screen") || window.location.hash.replace("#", "");
  if (targetScreen && screens[targetScreen]) {
    navigateTo(targetScreen, false);
  }

  // Automated or Video Demo Command Execution (?execCmd=Alexa,+park+this.)
  const execCmdParam = urlParams.get("execCmd");
  if (execCmdParam) {
    executeAlexaCommand(execCmdParam);
  }

  // Drawer parameter or hash override (e.g. ?drawer=tech or #tech)
  if (urlParams.get("drawer") === "tech" || window.location.hash === "#tech") {
    openDrawer(techDrawer);
  } else if (urlParams.get("drawer") === "demo" || window.location.hash === "#demo") {
    openDrawer(demoDrawer);
  }
});
