import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { LocalGitWorkspaceProvider } from "../src/providers/workspace.js";
import { ContinuityEngine } from "../src/engine/continuity.js";
import { LocalMemoryProvider } from "../src/providers/memory.js";
import { FixtureModelProvider } from "../src/providers/model.js";
import { createThreadKeeperMcpServer } from "../src/mcp/server.js";

function runGit(cwd: string, args: string[]): string {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf-8",
    stdio: ["pipe", "pipe", "pipe"]
  }).trim();
}

describe("Real Workspace Continuity & LocalGitWorkspaceProvider", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "tk-ws-test-"));
    runGit(tempDir, ["init", "-b", "main"]);
    runGit(tempDir, ["config", "user.email", "test@threadkeeper.local"]);
    runGit(tempDir, ["config", "user.name", "Test User"]);
    runGit(tempDir, ["config", "commit.gpgSign", "false"]);

    const srcDir = path.join(tempDir, "src");
    fs.mkdirSync(srcDir, { recursive: true });

    fs.writeFileSync(
      path.join(srcDir, "calculator.ts"),
      `export function add(a: number, b: number): number { return a + b; }\n`
    );
    fs.writeFileSync(
      path.join(srcDir, "logger.ts"),
      `export function log(msg: string): void { console.log(msg); }\n`
    );

    runGit(tempDir, ["add", "."]);
    runGit(tempDir, ["commit", "-m", "initial commit"]);
  });

  afterEach(() => {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  });

  it("captures complete Git snapshot without modifying the repository", async () => {
    const provider = new LocalGitWorkspaceProvider();
    const isGit = await provider.isGitRepository(tempDir);
    expect(isGit).toBe(true);

    const snapshot = await provider.captureSnapshot(tempDir);

    expect(snapshot.branch).toBe("main");
    expect(snapshot.head_commit.hash).toMatch(/^[0-9a-f]{40}$/);
    expect(snapshot.repository_root).toBe(fs.realpathSync(tempDir));
    expect(snapshot.is_clean).toBe(true);

    // Artifacts check
    const calcArtifact = snapshot.artifacts.find((a) => a.path_or_uri === "src/calculator.ts");
    expect(calcArtifact).toBeDefined();
    expect(calcArtifact?.version_or_hash).toMatch(/^sha256-[0-9a-f]+$/); // SHA-256 prefixed

    // Git branch & head artifacts
    expect(snapshot.artifacts.some((a) => a.path_or_uri === "git:head")).toBe(true);
    expect(snapshot.artifacts.some((a) => a.path_or_uri === "git:branch")).toBe(true);

    // Evidence check
    expect(snapshot.evidence.some((e) => e.id === "ev-git-head" && e.epistemic_status === "observed")).toBe(true);
    expect(snapshot.evidence.some((e) => e.id === "ev-git-branch" && e.epistemic_status === "observed")).toBe(true);
    expect(snapshot.evidence.some((e) => e.id === "ev-git-status" && e.epistemic_status === "observed")).toBe(true);
  });

  it("safely ignores sensitive files (.env, private keys)", async () => {
    fs.writeFileSync(path.join(tempDir, ".env"), "SECRET_API_KEY=topsecret123\n");
    fs.writeFileSync(path.join(tempDir, "id_rsa"), "-----BEGIN RSA PRIVATE KEY-----\n...\n");
    fs.writeFileSync(path.join(tempDir, "token.key"), "secret-token-bytes\n");

    const provider = new LocalGitWorkspaceProvider();
    const snapshot = await provider.captureSnapshot(tempDir);

    const artifactPaths = snapshot.artifacts.map((a) => a.path_or_uri);
    expect(artifactPaths).not.toContain(".env");
    expect(artifactPaths).not.toContain("id_rsa");
    expect(artifactPaths).not.toContain("token.key");

    const evidenceContents = snapshot.evidence.map((e) => e.content);
    expect(evidenceContents.some((c) => c.includes("SECRET_API_KEY"))).toBe(false);
  });

  it("handles non-git directory gracefully by throwing an informative error", async () => {
    const nonGitDir = fs.mkdtempSync(path.join(os.tmpdir(), "tk-non-git-"));
    try {
      const provider = new LocalGitWorkspaceProvider();
      await expect(provider.captureSnapshot(nonGitDir)).rejects.toThrow(/not a valid Git repository/i);
    } finally {
      fs.rmSync(nonGitDir, { recursive: true, force: true });
    }
  });

  it("parks a real workspace and persists a validated CognitiveCheckpoint", async () => {
    const memory = new LocalMemoryProvider();
    const model = new FixtureModelProvider();
    const workspace = new LocalGitWorkspaceProvider();
    const engine = new ContinuityEngine({
      memoryProvider: memory,
      modelProvider: model,
      workspaceProvider: workspace
    });

    const cp = await engine.parkWorkspace({
      workspacePath: tempDir,
      goalText: "Implement calculator add function",
      stateSummary: "Initial add function implemented, awaiting subtract function",
      nextActionDescription: "Implement subtract function in src/calculator.ts",
      assumptions: [
        {
          id: "asm-calc-add",
          statement: "calculator.ts only supports addition",
          target_artifact: "src/calculator.ts"
        }
      ]
    });

    expect(cp.checkpoint_id).toMatch(/^cp-/);
    expect(cp.goal.text).toBe("Implement calculator add function");
    expect(cp.artifacts.some((a) => a.path_or_uri === "src/calculator.ts")).toBe(true);

    const stored = await memory.getCheckpoint(cp.checkpoint_id);
    expect(stored).not.toBeNull();
    expect(stored?.checkpoint_id).toBe(cp.checkpoint_id);
  });

  it("resumes workspace, computes Continuity Diff, and marks assumptions stale upon modification", async () => {
    const memory = new LocalMemoryProvider();
    const model = new FixtureModelProvider();
    const workspace = new LocalGitWorkspaceProvider();
    const engine = new ContinuityEngine({
      memoryProvider: memory,
      modelProvider: model,
      workspaceProvider: workspace
    });

    const cp = await engine.parkWorkspace({
      workspacePath: tempDir,
      goalText: "Implement calculator operations",
      nextActionDescription: "Add subtract operation",
      assumptions: [
        {
          id: "asm-calc-add",
          statement: "calculator.ts only contains addition logic",
          target_artifact: "src/calculator.ts"
        },
        {
          id: "asm-logger-intact",
          statement: "logger.ts is stable and unchanged",
          target_artifact: "src/logger.ts"
        }
      ]
    });

    // Mutate only calculator.ts, leaving logger.ts unchanged
    fs.writeFileSync(
      path.join(tempDir, "src", "calculator.ts"),
      `export function add(a: number, b: number): number { return a + b; }\nexport function subtract(a: number, b: number): number { return a - b; }\n`
    );

    // Also add a new untracked file
    fs.writeFileSync(
      path.join(tempDir, "src", "multiply.ts"),
      `export function multiply(a: number, b: number): number { return a * b; }\n`
    );

    const brief = await engine.resumeWorkspace({
      threadId: cp.thread_id,
      workspacePath: tempDir
    });

    expect(brief.thread_id).toBe(cp.thread_id);
    expect(brief.changed_artifact_count).toBe(2);

    const diff = brief.continuity_diff;
    expect(diff.changed.length).toBe(2);
    expect(diff.changed.some((a) => a.path === "src/calculator.ts")).toBe(true);
    expect(diff.changed.some((a) => a.path === "src/multiply.ts")).toBe(true);
    expect(diff.changed.some((a) => a.path.startsWith("rc/"))).toBe(false);

    // Assumption targeted at changed file should be marked stale
    const staleAsm = diff.stale_assumptions.find((s) => s.assumption_id === "asm-calc-add");
    expect(staleAsm).toBeDefined();
    expect(staleAsm?.reason_stale).toContain("src/calculator.ts");

    // Invalidating evidence provenance regression checks (Issue 2)
    const invEv = staleAsm?.invalidating_evidence;
    expect(invEv).toBeDefined();
    // 1. Must exist in new_evidence collection
    expect(diff.new_evidence.some((e) => e.id === invEv?.id)).toBe(true);
    // 2. Must refer to src/calculator.ts
    const refersToTarget =
      invEv?.source === "src/calculator.ts" ||
      invEv?.metadata?.path === "src/calculator.ts" ||
      invEv?.content.includes("src/calculator.ts");
    expect(refersToTarget).toBe(true);
    // 3. Must not be generic HEAD or branch evidence
    expect(invEv?.id).not.toBe("ev-git-head");
    expect(invEv?.id).not.toBe("ev-git-branch");
    // 4. Epistemic status must be observed
    expect(invEv?.epistemic_status).toBe("observed");

    // Assumption targeted at unchanged file should NOT be in stale_assumptions
    expect(diff.stale_assumptions.some((s) => s.assumption_id === "asm-logger-intact")).toBe(false);

    // Recommended next action is grounded and contains no corrupted paths
    expect(brief.grounded_next_action).toBeDefined();
    expect(/(^|[\s,])rc\//.test(brief.grounded_next_action.rationale)).toBe(false);
    expect(diff.changed.some((c) => c.path.startsWith("rc/"))).toBe(false);

    // Direct compareWorkspace
    const comp = await engine.compareWorkspace(cp.checkpoint_id, tempDir);
    expect(comp.changed.length).toBe(2);
    expect(comp.changed.some((c) => c.path === "src/calculator.ts")).toBe(true);
  });

  it("regression: correctly parses git status porcelain lines with leading spaces without path truncation", async () => {
    // Mutate calculator.ts in worktree without staging (porcelain output: " M src/calculator.ts")
    fs.writeFileSync(path.join(tempDir, "src", "calculator.ts"), "export const modified = true;\n");

    const provider = new LocalGitWorkspaceProvider();
    const snapshot = await provider.captureSnapshot(tempDir);

    // Assert porcelain parsing correctly preserved leading space and did not chop 's'
    const calcStatus = snapshot.file_statuses.find((f) => f.path === "src/calculator.ts");
    expect(calcStatus).toBeDefined();
    expect(calcStatus?.path).toBe("src/calculator.ts");
    expect(calcStatus?.status).toBe("modified");
    expect(calcStatus?.staged).toBe(false);

    // Assert no phantom truncated path 'rc/calculator.ts'
    const phantom = snapshot.file_statuses.find((f) => f.path.startsWith("rc/"));
    expect(phantom).toBeUndefined();

    // Assert artifacts contains exactly src/calculator.ts without duplicate
    const calcArtifacts = snapshot.artifacts.filter((a) => a.path_or_uri.includes("calculator.ts"));
    expect(calcArtifacts.length).toBe(1);
    expect(calcArtifacts[0].path_or_uri).toBe("src/calculator.ts");
  });

  it("supports workspace_path through MCP server tools", async () => {
    const memory = new LocalMemoryProvider();
    const model = new FixtureModelProvider();
    const workspace = new LocalGitWorkspaceProvider();
    const engine = new ContinuityEngine({
      memoryProvider: memory,
      modelProvider: model,
      workspaceProvider: workspace
    });

    const mcpServer = createThreadKeeperMcpServer(engine);
    expect(mcpServer).toBeDefined();

    // Verify engine methods invoked by MCP tools work with workspacePath
    const parked = await engine.parkWorkspace({
      workspacePath: tempDir,
      goalText: "MCP integration test for workspace path"
    });

    const resumed = await engine.resumeWorkspace({
      threadId: parked.thread_id,
      workspacePath: tempDir
    });

    expect(resumed.thread_id).toBe(parked.thread_id);
    expect(resumed.continuity_diff.still_valid.length).toBeGreaterThan(0);
  });
});
