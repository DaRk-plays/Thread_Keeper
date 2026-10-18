import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { ContinuityEngine } from "../engine/continuity.js";
import { LocalMemoryProvider } from "../providers/memory.js";
import { FixtureModelProvider } from "../providers/model.js";
import { LocalGitWorkspaceProvider } from "../providers/workspace.js";

function runGit(repoDir: string, args: string[]): string {
  return execFileSync("git", args, {
    cwd: repoDir,
    encoding: "utf-8",
    stdio: ["pipe", "pipe", "pipe"]
  }).trim();
}

async function verifyWorkspaceContinuity(): Promise<void> {
  console.log("================================================================================");
  console.log("  THREADKEEPER — REAL GIT WORKSPACE CONTINUITY VERIFICATION RUNNER");
  console.log("  Milestone 2: Safe Read-Only Inspection, Checkpoint Capture, Diff & Staleness");
  console.log("================================================================================\n");

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "threadkeeper-verify-workspace-"));
  console.log(`✓ Created isolated temporary repository fixture at: ${tempDir}`);

  try {
    // 1. Initialize isolated Git repository
    console.log(">>> [Step 1] Initializing Git repository fixture...");
    runGit(tempDir, ["init", "-b", "main"]);
    runGit(tempDir, ["config", "user.email", "verifier@threadkeeper.test"]);
    runGit(tempDir, ["config", "user.name", "ThreadKeeper Verifier"]);
    runGit(tempDir, ["config", "commit.gpgSign", "false"]);

    const srcDir = path.join(tempDir, "src");
    fs.mkdirSync(srcDir, { recursive: true });

    const paymentFilePath = path.join(srcDir, "payment.ts");
    fs.writeFileSync(
      paymentFilePath,
      `export interface PaymentRequest {
  amount: number;
  currency: string;
  customerId: string;
}

export function processPayment(req: PaymentRequest): boolean {
  if (req.amount <= 0) {
    throw new Error("Invalid payment amount");
  }
  return true;
}
`
    );

    const readmeFilePath = path.join(tempDir, "README.md");
    fs.writeFileSync(readmeFilePath, "# Payment Engine\nInitial payment service baseline.\n");

    runGit(tempDir, ["add", "."]);
    runGit(tempDir, ["commit", "-m", "feat(payment): initial payment processing implementation"]);

    const headCommit = runGit(tempDir, ["rev-parse", "HEAD"]);
    const branchName = runGit(tempDir, ["rev-parse", "--abbrev-ref", "HEAD"]);
    console.log(`✓ Repository initialized: branch '${branchName}', HEAD '${headCommit.slice(0, 8)}'\n`);

    // 2. Initialize ThreadKeeper Engine with LocalGitWorkspaceProvider
    console.log(">>> [Step 2] Initializing ContinuityEngine with LocalGitWorkspaceProvider...");
    const memory = new LocalMemoryProvider();
    const model = new FixtureModelProvider();
    const workspaceProvider = new LocalGitWorkspaceProvider();
    const engine = new ContinuityEngine({
      memoryProvider: memory,
      modelProvider: model,
      workspaceProvider
    });
    console.log("✓ Engine configured with local memory, fixture model, and read-only Git workspace provider\n");

    // 3. Test Provider Safety & Inspection
    console.log(">>> [Step 3] Verifying read-only snapshot inspection...");
    const isGit = await workspaceProvider.isGitRepository(tempDir);
    if (!isGit) {
      throw new Error("Expected workspaceProvider to confirm directory is a Git repository");
    }

    const snapshot = await workspaceProvider.captureSnapshot(tempDir);
    if (snapshot.head_commit.hash !== headCommit) {
      throw new Error(`Expected HEAD commit ${headCommit}, got ${snapshot.head_commit.hash}`);
    }
    if (snapshot.branch !== branchName) {
      throw new Error(`Expected branch ${branchName}, got ${snapshot.branch}`);
    }
    console.log(`✓ Read-only snapshot confirmed: ${snapshot.artifacts.length} artifacts, clean status\n`);

    // 4. Park Real Workspace
    console.log(">>> [Step 4] Parking real workspace state into cognitive checkpoint...");
    const parkedCheckpoint = await engine.parkWorkspace({
      workspacePath: tempDir,
      goalText: "Implement secure payment processing with currency validation",
      stateSummary: "Payment validation baseline written, multi-currency support pending",
      nextActionDescription: "Add currency validation against allowed ISO currencies in src/payment.ts",
      assumptions: [
        {
          id: "asm-payment-currency",
          statement: "src/payment.ts accepts any currency without whitelist validation",
          target_artifact: "src/payment.ts"
        }
      ]
    });

    if (!parkedCheckpoint.checkpoint_id.startsWith("cp-")) {
      throw new Error(`Invalid checkpoint_id format: ${parkedCheckpoint.checkpoint_id}`);
    }

    const storedCheckpoint = await memory.getCheckpoint(parkedCheckpoint.checkpoint_id);
    if (!storedCheckpoint) {
      throw new Error("Parked checkpoint was not saved to LocalMemoryProvider");
    }

    // Verify artifacts captured
    const headArtifact = parkedCheckpoint.artifacts.find((a) => a.path_or_uri === "git:head");
    const branchArtifact = parkedCheckpoint.artifacts.find((a) => a.path_or_uri === "git:branch");
    const paymentArtifact = parkedCheckpoint.artifacts.find((a) => a.path_or_uri === "src/payment.ts");

    if (!headArtifact || headArtifact.version_or_hash !== headCommit) {
      throw new Error("Missing or mismatched git:head artifact in checkpoint");
    }
    if (!branchArtifact || branchArtifact.version_or_hash !== branchName) {
      throw new Error("Missing or mismatched git:branch artifact in checkpoint");
    }
    if (!paymentArtifact || !paymentArtifact.version_or_hash.startsWith("sha256-")) {
      throw new Error("Missing or invalid SHA-256 hash for src/payment.ts artifact");
    }

    // Verify evidence captured
    const gitHeadEvidence = parkedCheckpoint.evidence.find((e) => e.id === "ev-git-head");
    const gitStatusEvidence = parkedCheckpoint.evidence.find((e) => e.id === "ev-git-status");
    if (!gitHeadEvidence || gitHeadEvidence.epistemic_status !== "observed") {
      throw new Error("Missing or non-observed ev-git-head evidence");
    }
    if (!gitStatusEvidence || gitStatusEvidence.epistemic_status !== "observed") {
      throw new Error("Missing or non-observed ev-git-status evidence");
    }

    console.log(`✓ Parked checkpoint '${parkedCheckpoint.checkpoint_id}' successfully stored in memory`);
    console.log(`  - Artifacts tracked: ${parkedCheckpoint.artifacts.length}`);
    console.log(`  - Evidence items: ${parkedCheckpoint.evidence.length}`);
    console.log(`  - Payment file SHA-256: ${paymentArtifact.version_or_hash.slice(0, 16)}...\n`);

    // 5. Interruption & Workspace Mutation
    console.log(">>> [Step 5] Simulating interruption & workspace modification...");
    fs.writeFileSync(
      paymentFilePath,
      `export interface PaymentRequest {
  amount: number;
  currency: string;
  customerId: string;
  idempotencyKey?: string;
}

export const ALLOWED_CURRENCIES = ["USD", "EUR", "GBP"] as const;

export function processPayment(req: PaymentRequest): boolean {
  if (req.amount <= 0) {
    throw new Error("Invalid payment amount: must be positive");
  }
  if (!ALLOWED_CURRENCIES.includes(req.currency as (typeof ALLOWED_CURRENCIES)[number])) {
    throw new Error("Unsupported currency: " + req.currency);
  }
  return true;
}
`
    );

    const currencyFilePath = path.join(srcDir, "currency.ts");
    fs.writeFileSync(
      currencyFilePath,
      `export type SupportedCurrency = "USD" | "EUR" | "GBP";\n`
    );

    console.log("✓ Workspace mutated: modified 'src/payment.ts', added untracked 'src/currency.ts'\n");

    // 6. Resume Workspace & Compute Continuity Diff
    console.log(">>> [Step 6] Resuming workspace thread and computing Continuity Diff...");
    const brief = await engine.resumeWorkspace({
      threadId: parkedCheckpoint.thread_id,
      workspacePath: tempDir
    });

    const diff = brief.continuity_diff;
    console.log(`✓ Continuity Diff calculated:`);
    console.log(`  - Changed artifacts: ${diff.changed.length}`);
    console.log(`  - Stale assumptions: ${diff.stale_assumptions.length}`);
    console.log(`  - Intact contexts: ${diff.still_valid.length}`);

    // Assertions on changed artifacts count and exact paths (Issue 1)
    if (diff.changed.length !== 2) {
      throw new Error(`Expected exactly 2 changed artifacts, got ${diff.changed.length}: ${diff.changed.map((c) => c.path).join(", ")}`);
    }

    // Verify absence of phantom/corrupted paths (e.g. rc/payment.ts)
    const malformed = diff.changed.filter((c) => c.path === "rc/payment.ts" || c.path.startsWith("rc/"));
    if (malformed.length > 0) {
      throw new Error(`Detected phantom/corrupted artifact paths: ${malformed.map((c) => c.path).join(", ")}`);
    }

    const changedPayment = diff.changed.find((c) => c.path === "src/payment.ts");
    if (!changedPayment) {
      throw new Error("Continuity Diff failed to detect modified artifact 'src/payment.ts'");
    }

    const changedCurrency = diff.changed.find((c) => c.path === "src/currency.ts");
    if (!changedCurrency) {
      throw new Error("Continuity Diff failed to detect newly added untracked file 'src/currency.ts'");
    }

    // Assertions on stale assumptions & evidence provenance (Issue 2)
    const staleAssumption = diff.stale_assumptions.find((s) => s.assumption_id === "asm-payment-currency");
    if (!staleAssumption) {
      throw new Error("Continuity Diff failed to detect stale assumption 'asm-payment-currency'");
    }
    if (!staleAssumption.reason_stale.includes("src/payment.ts")) {
      throw new Error(`Unexpected invalidation reason: ${staleAssumption.reason_stale}`);
    }

    const invEv = staleAssumption.invalidating_evidence;
    if (!invEv) {
      throw new Error("Stale assumption missing invalidating evidence references");
    }

    // Regression check 1: invalidating evidence must exist in evidence collection
    const inEvidenceCollection = diff.new_evidence.some((e) => e.id === invEv.id);
    if (!inEvidenceCollection) {
      throw new Error(`Invalidating evidence '${invEv.id}' does not exist in new_evidence collection`);
    }

    // Regression check 2: invalidating evidence must refer to src/payment.ts
    const refersToPayment =
      invEv.source === "src/payment.ts" ||
      invEv.metadata?.path === "src/payment.ts" ||
      invEv.content.includes("src/payment.ts");
    if (!refersToPayment) {
      throw new Error(`Invalidating evidence '${invEv.id}' does not refer to src/payment.ts: source='${invEv.source}', content='${invEv.content}'`);
    }

    // Regression check 3: must represent actual observed file change, not generic git head
    if (invEv.id === "ev-git-head" || invEv.id === "ev-git-branch") {
      throw new Error(`Invalidating evidence must be artifact-specific, not generic '${invEv.id}'`);
    }
    const representsChange =
      invEv.content.toLowerCase().includes("modified") ||
      invEv.content.toLowerCase().includes("change") ||
      invEv.type === "file_hash";
    if (!representsChange) {
      throw new Error(`Invalidating evidence does not represent an observed file change: '${invEv.content}'`);
    }

    // Regression check 4: must have epistemic_status = observed
    if (invEv.epistemic_status !== "observed") {
      throw new Error(`Invalidating evidence epistemic_status is '${invEv.epistemic_status}', expected 'observed'`);
    }

    // Assertions on grounded next action & clean rationale
    const nextAction = brief.grounded_next_action;
    if (!nextAction) {
      throw new Error("Resume brief did not produce a grounded next action");
    }
    if (/(^|[\s,])rc\//.test(nextAction.rationale)) {
      throw new Error(`Grounded next action rationale contains malformed path: ${nextAction.rationale}`);
    }

    // Print explicit closure verification summary
    console.log(`\n--- [VERIFICATION SUMMARY] ---`);
    console.log(`Changed artifacts: ${diff.changed.length}\n`);
    console.log(`Modified:\n${changedPayment.path}\n`);
    console.log(`New:\n${changedCurrency.path}\n`);
    console.log(`Stale assumption:\n${staleAssumption.statement}\n`);
    console.log(`Invalidating evidence:\n[${invEv.id}] ${invEv.source} - ${invEv.content} (${invEv.epistemic_status})\n`);
    console.log(`Grounded next action rationale:\n${nextAction.rationale}\n`);
    console.log(`Alexa+ 30-Second Voice Brief:\n"${brief.voice_summary}"\n------------------------------\n`);

    // 7. Verify compareWorkspace
    console.log(">>> [Step 7] Verifying direct compareWorkspace API...");
    const directDiff = await engine.compareWorkspace(parkedCheckpoint.checkpoint_id, tempDir);
    if (directDiff.changed.length !== 2) {
      throw new Error(`compareWorkspace expected 2 changed items, got ${directDiff.changed.length}`);
    }
    if (!directDiff.changed.some((c) => c.path === "src/payment.ts")) {
      throw new Error("compareWorkspace failed to report src/payment.ts as changed");
    }
    console.log(`✓ compareWorkspace returned exactly 2 changed items\n`);

    console.log("================================================================================");
    console.log("  REAL GIT WORKSPACE CONTINUITY: ALL CHECKS PASSED SUCCESSFULLY");
    console.log("================================================================================");
  } finally {
    // Clean up temporary fixture directory
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
      console.log(`✓ Cleaned up temporary fixture at: ${tempDir}`);
    } catch (cleanupErr) {
      console.warn(`Warning: Failed to clean up ${tempDir}:`, cleanupErr);
    }
  }
}

verifyWorkspaceContinuity()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error("\n❌ Workspace continuity verification FAILED:", err);
    process.exit(1);
  });
