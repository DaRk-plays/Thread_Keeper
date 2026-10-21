import {
  Artifact,
  CognitiveCheckpoint,
  ContinuityDiff,
  Evidence,
  NextAction
} from "../domain/types.js";

export interface CurrentWorkspaceState {
  timestamp: string;
  git_branch: string;
  git_status?: string;
  artifacts: Artifact[];
  evidence: Evidence[];
  uncertainties?: string[];
}

/**
 * Computes the Continuity Diff between checkpoint state THEN and workspace state NOW.
 * Pure deterministic logic satisfying Phase 6 requirements without requiring an LLM.
 */
export function computeContinuityDiff(
  checkpoint: CognitiveCheckpoint,
  currentState: CurrentWorkspaceState
): ContinuityDiff {
  const evaluated_at = currentState.timestamp || new Date().toISOString();
  const still_valid: ContinuityDiff["still_valid"] = [];
  const changed: ContinuityDiff["changed"] = [];
  const stale_assumptions: ContinuityDiff["stale_assumptions"] = [];
  const new_evidence: Evidence[] = [...currentState.evidence];
  const uncertain: string[] = [...(currentState.uncertainties || [])];

  // Map current artifacts by path and ID
  const currentArtifactsByPath = new Map<string, Artifact>();
  const currentArtifactsById = new Map<string, Artifact>();
  for (const art of currentState.artifacts) {
    currentArtifactsByPath.set(art.path_or_uri, art);
    currentArtifactsById.set(art.id, art);
  }

  // 1. Compare Artifacts
  const changedArtifactIds = new Set<string>();
  const changedArtifactPaths = new Set<string>();

  for (const thenArt of checkpoint.artifacts) {
    const nowArt =
      currentArtifactsById.get(thenArt.id) || currentArtifactsByPath.get(thenArt.path_or_uri);

    if (!nowArt) {
      changed.push({
        artifact_id: thenArt.id,
        path: thenArt.path_or_uri,
        then_version: thenArt.version_or_hash,
        now_version: "missing_or_deleted",
        diff_summary: `Artifact ${thenArt.path_or_uri} was not found in current workspace.`
      });
      changedArtifactIds.add(thenArt.id);
      changedArtifactPaths.add(thenArt.path_or_uri);
    } else if (nowArt.version_or_hash !== thenArt.version_or_hash) {
      changed.push({
        artifact_id: thenArt.id,
        path: thenArt.path_or_uri,
        then_version: thenArt.version_or_hash,
        now_version: nowArt.version_or_hash,
        diff_summary: `Artifact ${thenArt.path_or_uri} changed version from ${thenArt.version_or_hash} to ${nowArt.version_or_hash}.`
      });
      changedArtifactIds.add(thenArt.id);
      changedArtifactPaths.add(thenArt.path_or_uri);
    } else {
      still_valid.push({
        id: thenArt.id,
        type: "artifact",
        summary: `Artifact ${thenArt.path_or_uri} is unchanged at version ${thenArt.version_or_hash}.`
      });
    }
  }

  // 1b. Check for Newly Created / Added Artifacts
  const checkpointArtifactPaths = new Set(checkpoint.artifacts.map((a) => a.path_or_uri));
  for (const nowArt of currentState.artifacts) {
    if (!checkpointArtifactPaths.has(nowArt.path_or_uri)) {
      changed.push({
        artifact_id: nowArt.id,
        path: nowArt.path_or_uri,
        then_version: "not_present",
        now_version: nowArt.version_or_hash,
        diff_summary: `New artifact detected in workspace: ${nowArt.path_or_uri} at version ${nowArt.version_or_hash}.`
      });
      changedArtifactIds.add(nowArt.id);
      changedArtifactPaths.add(nowArt.path_or_uri);
    }
  }

  // 1c. Check for Branch Switch
  if (currentState.git_branch && checkpoint.work_context.branch && currentState.git_branch !== checkpoint.work_context.branch) {
    changed.push({
      artifact_id: "git-branch",
      path: "git:branch",
      then_version: checkpoint.work_context.branch,
      now_version: currentState.git_branch,
      diff_summary: `Active Git branch changed from '${checkpoint.work_context.branch}' to '${currentState.git_branch}'.`
    });
    changedArtifactPaths.add("git:branch");
  }

  // 2. Identify Stale Assumptions & Staleness Propagation
  const staleAssumptionIds = new Set<string>();

  for (const assumption of checkpoint.assumptions) {
    let isStale = false;
    let reason = "";
    let invalidatingEvidence: Evidence | undefined;

    // Check if assumption target artifact changed
    if (assumption.target_artifact_id && changedArtifactIds.has(assumption.target_artifact_id)) {
      isStale = true;
      const targetArt = checkpoint.artifacts.find((a) => a.id === assumption.target_artifact_id);
      const targetPath = targetArt ? targetArt.path_or_uri : assumption.target_artifact_id;
      reason = `Target artifact [${assumption.target_artifact_id}] (${targetPath}) was modified while user was away.`;
    }

    // Check if any changed artifact path is mentioned in the statement
    for (const path of changedArtifactPaths) {
      if (assumption.statement.includes(path)) {
        isStale = true;
        reason = `Artifact ${path} mentioned in assumption was modified.`;
        break;
      }
    }

    // Check if new evidence contradicts the assumption
    const contradictingEvidence = new_evidence.find(
      (ev) =>
        ev.metadata?.invalidates_assumption_id === assumption.id ||
        (ev.content.toLowerCase().includes("changed") && ev.source.includes(assumption.target_artifact_id || ""))
    );
    if (contradictingEvidence) {
      isStale = true;
      invalidatingEvidence = contradictingEvidence;
      reason = `New evidence [${contradictingEvidence.id}] invalidates assumption: ${contradictingEvidence.content}`;
    }

    if (isStale) {
      if (!invalidatingEvidence) {
        const targetArt = checkpoint.artifacts.find((a) => a.id === assumption.target_artifact_id);
        const targetPath = targetArt ? targetArt.path_or_uri : assumption.target_artifact_id;

        // 1. Look for artifact-specific evidence in new_evidence
        if (targetPath) {
          invalidatingEvidence = new_evidence.find(
            (ev) =>
              ev.source === targetPath ||
              ev.metadata?.path === targetPath ||
              ev.id === `ev-art-${targetPath.replace(/[/\\.]/g, "-")}`
          );
        }

        // 2. Look for evidence explicitly mentioning targetPath (excluding generic HEAD/branch)
        if (!invalidatingEvidence && targetPath) {
          invalidatingEvidence = new_evidence.find(
            (ev) =>
              (ev.source.includes(targetPath) || ev.content.includes(targetPath)) &&
              ev.id !== "ev-git-head" &&
              ev.id !== "ev-git-branch"
          );
        }

        // 3. If still not found, check if a changed artifact corresponds to this assumption and synthesize observed evidence
        if (!invalidatingEvidence && targetPath) {
          const changedArt = changed.find((c) => c.path === targetPath);
          if (changedArt) {
            const synthEvidence: Evidence = {
              id: `ev-diff-${targetPath.replace(/[/\\.]/g, "-")}`,
              type: "file_hash",
              source: targetPath,
              content: `Observed change in ${targetPath}: version changed from ${changedArt.then_version} to ${changedArt.now_version}`,
              captured_at: currentState.timestamp || new Date().toISOString(),
              epistemic_status: "observed",
              metadata: {
                path: targetPath,
                then_version: changedArt.then_version,
                now_version: changedArt.now_version,
                invalidates_assumption_id: assumption.id
              }
            };
            new_evidence.push(synthEvidence);
            invalidatingEvidence = synthEvidence;
          }
        }
      }
      staleAssumptionIds.add(assumption.id);

      // Propagate staleness to decisions relying on this assumption
      const affectedDecisions = checkpoint.decisions
        .filter(
          (d) =>
            d.assumptions.includes(assumption.id) ||
            d.assumptions.some((a) => assumption.statement.includes(a))
        )
        .map((d) => d.id);

      stale_assumptions.push({
        assumption_id: assumption.id,
        statement: assumption.statement,
        reason_stale: reason,
        invalidating_evidence: invalidatingEvidence,
        affected_decision_ids: affectedDecisions
      });
    } else {
      still_valid.push({
        id: assumption.id,
        type: "assumption",
        summary: `Assumption remains valid: ${assumption.statement}`
      });
    }
  }

  // 3. Evaluate Decisions
  for (const decision of checkpoint.decisions) {
    const hasStaleDependency = decision.assumptions.some((aid) => staleAssumptionIds.has(aid));
    if (hasStaleDependency) {
      // Decision needs review; noted via stale_assumptions affected_decision_ids
    } else {
      still_valid.push({
        id: decision.id,
        type: "decision",
        summary: `Decision still valid: ${decision.description}`
      });
    }
  }

  // 4. Goal is still valid
  still_valid.push({
    id: "goal",
    type: "goal",
    summary: `Primary goal remains: ${checkpoint.goal.text}`
  });

  // 5. Compute Grounded Next Action
  let recommended_next_action: NextAction;

  if (stale_assumptions.length > 0 || changed.length > 0) {
    // Grounded reaction to interruption state change
    const primaryStale = stale_assumptions[0];
    const changedFile = changed[0]?.path || "workspace";
    const citedEvidenceIds: string[] = [];

    if (primaryStale?.invalidating_evidence) {
      citedEvidenceIds.push(primaryStale.invalidating_evidence.id);
    }
    // Include artifact-specific evidence for changed files
    for (const c of changed) {
      const artEv = new_evidence.find((ev) => ev.source === c.path || ev.metadata?.path === c.path);
      if (artEv && !citedEvidenceIds.includes(artEv.id)) {
        citedEvidenceIds.push(artEv.id);
      }
    }

    let domainSpecificInstruction = "inspect the changed implementation";
    const lowerFile = changedFile.toLowerCase();
    const lowerStale = (primaryStale?.statement || "").toLowerCase();

    if (lowerFile.includes("payment") || lowerStale.includes("currency")) {
      domainSpecificInstruction = "inspect the changed currency-validation logic";
    } else if (lowerFile.includes("invoice") || lowerStale.includes("invoice") || lowerStale.includes("filter")) {
      domainSpecificInstruction = "inspect the changed invoice-filtering logic";
    } else if (lowerFile.includes("database") || lowerFile.includes("pool") || lowerStale.includes("pool")) {
      domainSpecificInstruction = "inspect the changed connection pool configuration";
    } else if (lowerFile.includes("auth") || lowerStale.includes("token") || lowerStale.includes("auth")) {
      domainSpecificInstruction = "inspect the changed authentication flow";
    }

    recommended_next_action = {
      id: `na-grounded-${Date.now()}`,
      description: `Re-evaluate assumption for ${changedFile} and ${domainSpecificInstruction} before proceeding.`,
      priority: "immediate",
      rationale: `Underlying state changed while away: ${changed.map((c) => c.path).join(", ")}. Prior assumption '${primaryStale ? primaryStale.statement : "active"}' is stale.`,
      target_artifact: changedFile,
      evidence_ids: citedEvidenceIds
    };
  } else if (checkpoint.next_actions.length > 0) {
    // If no changes, preserve the highest priority action from the checkpoint
    recommended_next_action = checkpoint.next_actions[0];
  } else {
    recommended_next_action = {
      id: `na-default-${Date.now()}`,
      description: `Review workspace state and define next step for: ${checkpoint.goal.text}`,
      priority: "immediate",
      rationale: "No explicit next action was recorded in checkpoint.",
      evidence_ids: checkpoint.goal.evidence_ids
    };
  }

  return {
    checkpoint_id: checkpoint.checkpoint_id,
    thread_id: checkpoint.thread_id,
    evaluated_at,
    still_valid,
    changed,
    stale_assumptions,
    new_evidence,
    uncertain,
    recommended_next_action
  };
}
