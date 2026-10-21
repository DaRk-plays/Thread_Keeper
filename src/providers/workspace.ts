import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile, stat, access } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { Artifact, Evidence } from "../domain/types.js";
import { ThreadKeeperError, ValidationError } from "../domain/errors.js";

const execFileAsync = promisify(execFile);

export interface GitCommitInfo {
  hash: string;
  short_hash: string;
  author: string;
  timestamp: string;
  message: string;
}

export interface GitFileStatus {
  path: string;
  status: "modified" | "added" | "deleted" | "renamed" | "untracked" | "staged";
  staged: boolean;
}

export interface WorkspaceSnapshot {
  repository_root: string;
  branch: string;
  head_commit: GitCommitInfo;
  is_clean: boolean;
  file_statuses: GitFileStatus[];
  artifacts: Artifact[];
  evidence: Evidence[];
  recent_commits: GitCommitInfo[];
  captured_at: string;
}

export interface SnapshotOptions {
  maxArtifacts?: number;
  maxRecentCommits?: number;
  includeUntracked?: boolean;
}

/**
 * WorkspaceProvider abstraction for inspecting local project repositories
 */
export interface WorkspaceProvider {
  isGitRepository(directoryPath: string): Promise<boolean>;
  captureSnapshot(directoryPath: string, options?: SnapshotOptions): Promise<WorkspaceSnapshot>;
}

// Security: Sensitive files/patterns that must NEVER have contents ingested
const SENSITIVE_PATTERNS = [
  /^\.env(\..+)?$/i,
  /\.pem$/i,
  /\.key$/i,
  /id_rsa/i,
  /id_ed25519/i,
  /\.pfx$/i,
  /\.p12$/i,
  /\.kdbx$/i,
  /credentials\.json$/i,
  /secret/i,
  /^\.threadkeeper/i
];

function isSensitivePath(filePath: string): boolean {
  const base = path.basename(filePath);
  return SENSITIVE_PATTERNS.some((pattern) => pattern.test(base));
}

/**
 * LocalGitWorkspaceProvider
 * Safely inspects a real local Git repository using read-only Git commands
 * and deterministic SHA-256 file hashing.
 */
export class LocalGitWorkspaceProvider implements WorkspaceProvider {
  /**
   * Safe execution of allowlisted Git commands using argument arrays (no shell expansion)
   */
  private async runGit(repoPath: string, args: string[]): Promise<string> {
    try {
      const { stdout } = await execFileAsync("git", args, {
        cwd: repoPath,
        timeout: 10000,
        maxBuffer: 5 * 1024 * 1024 // 5MB buffer limit
      });
      return stdout.trimEnd();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new ThreadKeeperError(`Git execution failed [git ${args.join(" ")}]: ${msg}`, "GIT_EXEC_ERROR");
    }
  }

  /**
   * Verifies if a directory exists and is inside a valid Git work tree
   */
  async isGitRepository(directoryPath: string): Promise<boolean> {
    try {
      await access(directoryPath);
      const isWorkTree = await this.runGit(directoryPath, ["rev-parse", "--is-inside-work-tree"]);
      return isWorkTree === "true";
    } catch {
      return false;
    }
  }

  /**
   * Captures a comprehensive, evidence-backed snapshot of a real Git repository
   */
  async captureSnapshot(directoryPath: string, options?: SnapshotOptions): Promise<WorkspaceSnapshot> {
    const absPath = path.resolve(directoryPath);

    // Validate directory exists
    try {
      const st = await stat(absPath);
      if (!st.isDirectory()) {
        throw new ValidationError(`Path is not a directory: ${absPath}`);
      }
    } catch (err) {
      if (err instanceof ValidationError) throw err;
      throw new ValidationError(`Repository path does not exist or is inaccessible: ${absPath}`);
    }

    // Validate Git repository
    const isValid = await this.isGitRepository(absPath);
    if (!isValid) {
      throw new ValidationError(`Target path is not a valid Git repository: ${absPath}`);
    }

    const repoRoot = await this.runGit(absPath, ["rev-parse", "--show-toplevel"]);
    const branch = await this.runGit(absPath, ["rev-parse", "--abbrev-ref", "HEAD"]);

    // Capture HEAD Commit
    const headCommit = await this.getHeadCommit(repoRoot);

    // Capture Recent Commits (up to maxRecentCommits)
    const recentCommits = await this.getRecentCommits(repoRoot, options?.maxRecentCommits || 5);

    // Capture Working Tree Status
    const fileStatuses = await this.getFileStatuses(repoRoot, options?.includeUntracked ?? true);
    const isClean = fileStatuses.length === 0;

    // Capture Artifacts with deterministic SHA-256 hashes
    const fileArtifacts = await this.captureArtifacts(repoRoot, fileStatuses, options?.maxArtifacts || 25);
    const artifacts: Artifact[] = [
      {
        id: "art-git-head",
        path_or_uri: "git:head",
        type: "config",
        version_or_hash: headCommit.hash,
        summary: `Git HEAD commit: ${headCommit.short_hash} (${headCommit.message})`
      },
      {
        id: "art-git-branch",
        path_or_uri: "git:branch",
        type: "config",
        version_or_hash: branch,
        summary: `Git active branch: ${branch}`
      },
      ...fileArtifacts
    ];

    // Convert Git and Workspace observations into Evidence items
    const capturedAt = new Date().toISOString();
    const evidence = await this.extractEvidence(repoRoot, branch, headCommit, fileStatuses, artifacts, capturedAt);

    return {
      repository_root: repoRoot,
      branch,
      head_commit: headCommit,
      is_clean: isClean,
      file_statuses: fileStatuses,
      artifacts,
      evidence,
      recent_commits: recentCommits,
      captured_at: capturedAt
    };
  }

  private async getHeadCommit(repoRoot: string): Promise<GitCommitInfo> {
    try {
      const format = "%H%n%h%n%an%n%aI%n%s";
      const raw = await this.runGit(repoRoot, ["log", "-1", `--format=${format}`]);
      const [hash, short_hash, author, timestamp, message] = raw.split("\n");
      return {
        hash: hash || "unknown",
        short_hash: short_hash || "unknown",
        author: author || "unknown",
        timestamp: timestamp || new Date().toISOString(),
        message: message || "No commit message"
      };
    } catch {
      return {
        hash: "0000000000000000000000000000000000000000",
        short_hash: "0000000",
        author: "none",
        timestamp: new Date().toISOString(),
        message: "Initial repository state (empty)"
      };
    }
  }

  private async getRecentCommits(repoRoot: string, limit: number): Promise<GitCommitInfo[]> {
    try {
      const format = "%H%x09%h%x09%an%x09%aI%x09%s";
      const raw = await this.runGit(repoRoot, ["log", `-${limit}`, `--format=${format}`]);
      if (!raw) return [];

      return raw.split("\n").map((line) => {
        const [hash, short_hash, author, timestamp, message] = line.split("\t");
        return { hash, short_hash, author, timestamp, message };
      });
    } catch {
      return [];
    }
  }

  private async getFileStatuses(repoRoot: string, includeUntracked: boolean): Promise<GitFileStatus[]> {
    const args = ["status", "--porcelain=v1"];
    if (includeUntracked) {
      args.push("-uall");
    } else {
      args.push("-uno");
    }

    const raw = await this.runGit(repoRoot, args);
    if (!raw) return [];

    const statuses: GitFileStatus[] = [];
    const lines = raw.split(/\r?\n/);

    for (const line of lines) {
      if (!line || line.trim().length === 0) continue;

      let indexStatus: string;
      let workTreeStatus: string;
      let rawPath: string;

      // Standard porcelain v1 format: 2 status characters (index, worktree) + 1 space separator + path
      if (line.length >= 4 && line[2] === " ") {
        indexStatus = line[0];
        workTreeStatus = line[1];
        rawPath = line.slice(3).trim();
      } else if (line.length >= 3 && line[1] === " ") {
        // Defensive recovery: if leading space was trimmed, line is "X <path>"
        indexStatus = " ";
        workTreeStatus = line[0];
        rawPath = line.slice(2).trim();
      } else {
        continue;
      }

      // Handle renames: 'old_path -> new_path'
      const cleanPath = rawPath.includes(" -> ")
        ? rawPath.split(" -> ").pop()!.replace(/^"|"$/g, "")
        : rawPath.replace(/^"|"$/g, "");
      const filePath = path.normalize(cleanPath).replace(/^(\.\/|\/)/, "");

      // Skip sensitive files from tracking
      if (isSensitivePath(filePath)) continue;

      let status: GitFileStatus["status"];
      let staged = false;

      if (indexStatus === "?" && workTreeStatus === "?") {
        status = "untracked";
      } else if (indexStatus === "A" || workTreeStatus === "A") {
        status = "added";
        staged = indexStatus === "A";
      } else if (indexStatus === "D" || workTreeStatus === "D") {
        status = "deleted";
        staged = indexStatus === "D";
      } else if (indexStatus === "R" || workTreeStatus === "R") {
        status = "renamed";
        staged = indexStatus === "R";
      } else {
        status = "modified";
        staged = indexStatus !== " " && indexStatus !== "?";
      }

      statuses.push({ path: filePath, status, staged });
    }

    return statuses;
  }

  private async captureArtifacts(
    repoRoot: string,
    fileStatuses: GitFileStatus[],
    maxArtifacts: number
  ): Promise<Artifact[]> {
    const artifacts: Artifact[] = [];
    const processedPaths = new Set<string>();

    // 1. First prioritize active/dirty files from git status
    for (const fs of fileStatuses) {
      if (artifacts.length >= maxArtifacts) break;
      if (isSensitivePath(fs.path)) continue;

      processedPaths.add(fs.path);
      const fullPath = path.join(repoRoot, fs.path);

      if (fs.status === "deleted") {
        artifacts.push({
          id: `art-${fs.path.replace(/[/\\.]/g, "-")}`,
          path_or_uri: fs.path,
          type: this.inferArtifactType(fs.path),
          version_or_hash: "deleted",
          summary: `Git status: deleted (${fs.staged ? "staged" : "unstaged"})`
        });
        continue;
      }

      const fileHash = await this.computeFileHash(fullPath);
      artifacts.push({
        id: `art-${fs.path.replace(/[/\\.]/g, "-")}`,
        path_or_uri: fs.path,
        type: this.inferArtifactType(fs.path),
        version_or_hash: fileHash || `status-${fs.status}`,
        summary: `Git status: ${fs.status} (${fs.staged ? "staged" : "unstaged"})`
      });
    }

    // 2. If under limit, include top tracked files from git ls-files
    if (artifacts.length < maxArtifacts) {
      try {
        const lsRaw = await this.runGit(repoRoot, ["ls-files"]);
        const trackedFiles = lsRaw.split("\n").filter(Boolean);

        for (const filePath of trackedFiles) {
          if (artifacts.length >= maxArtifacts) break;
          if (processedPaths.has(filePath) || isSensitivePath(filePath)) continue;

          processedPaths.add(filePath);
          const fullPath = path.join(repoRoot, filePath);
          const fileHash = await this.computeFileHash(fullPath);

          if (fileHash) {
            artifacts.push({
              id: `art-${filePath.replace(/[/\\.]/g, "-")}`,
              path_or_uri: filePath,
              type: this.inferArtifactType(filePath),
              version_or_hash: fileHash,
              summary: "Tracked in Git repository"
            });
          }
        }
      } catch {
        // Fall back to only status artifacts if ls-files fails
      }
    }

    return artifacts;
  }

  private async computeFileHash(fullPath: string): Promise<string | null> {
    try {
      const st = await stat(fullPath);
      // Skip files larger than 1MB to keep snapshots fast and bounded
      if (st.size > 1024 * 1024) {
        return `size-${st.size}-mtime-${st.mtimeMs}`;
      }
      const buffer = await readFile(fullPath);
      return `sha256-${crypto.createHash("sha256").update(buffer).digest("hex").slice(0, 16)}`;
    } catch {
      return null;
    }
  }

  private inferArtifactType(filePath: string): Artifact["type"] {
    const ext = path.extname(filePath).toLowerCase();
    if ([".ts", ".tsx", ".js", ".jsx", ".py", ".rs", ".go", ".java", ".c", ".cpp"].includes(ext)) {
      if (filePath.includes("test") || filePath.includes("spec")) return "test";
      return "code";
    }
    if ([".json", ".yaml", ".yml", ".toml", ".ini", ".conf"].includes(ext)) {
      return "config";
    }
    if ([".md", ".txt", ".rst", ".adoc"].includes(ext)) {
      return "doc";
    }
    return "code";
  }

  /**
   * Converts Git state into structured Evidence items with full provenance
   */
  private async extractEvidence(
    repoRoot: string,
    branch: string,
    headCommit: GitCommitInfo,
    fileStatuses: GitFileStatus[],
    artifacts: Artifact[],
    capturedAt: string
  ): Promise<Evidence[]> {
    const evidenceList: Evidence[] = [];

    // 1. Evidence: Git HEAD Commit
    evidenceList.push({
      id: "ev-git-head",
      type: "git_status",
      source: `git:commit:${headCommit.short_hash}`,
      content: `HEAD is at commit ${headCommit.short_hash} by ${headCommit.author}: "${headCommit.message}"`,
      captured_at: capturedAt,
      epistemic_status: "observed",
      metadata: { commit: headCommit.hash }
    });

    // 2. Evidence: Git Branch
    evidenceList.push({
      id: "ev-git-branch",
      type: "git_status",
      source: "git:branch",
      content: `Active branch is '${branch}'`,
      captured_at: capturedAt,
      epistemic_status: "observed"
    });

    // 3. Evidence: Git Working Tree Status
    const dirtyCount = fileStatuses.length;
    evidenceList.push({
      id: "ev-git-status",
      type: "git_status",
      source: "git:status",
      content: dirtyCount === 0
        ? "Working tree clean, no uncommitted changes."
        : `Working tree dirty: ${dirtyCount} changed file(s) (${fileStatuses.map((f) => f.path).slice(0, 5).join(", ")}${dirtyCount > 5 ? "..." : ""}).`,
      captured_at: capturedAt,
      epistemic_status: "observed",
      metadata: { file_count: dirtyCount }
    });

    // 4. Evidence: Active Git Diff Summary (if dirty)
    if (dirtyCount > 0) {
      try {
        const diffStat = await this.runGit(repoRoot, ["diff", "--stat"]);
        if (diffStat) {
          evidenceList.push({
            id: "ev-git-diff-stat",
            type: "git_status",
            source: "git:diff --stat",
            content: diffStat.split("\n").pop()?.trim() || diffStat.slice(0, 200),
            captured_at: capturedAt,
            epistemic_status: "observed"
          });
        }
      } catch {
        // diff stat optional
      }
    }

    // 5. Evidence for changed workspace files
    const changedArtifacts = artifacts.filter((a) =>
      fileStatuses.some((fs) => fs.path === a.path_or_uri)
    );

    for (const art of changedArtifacts) {
      const fs = fileStatuses.find((s) => s.path === art.path_or_uri);
      evidenceList.push({
        id: `ev-art-${art.path_or_uri.replace(/[/\\.]/g, "-")}`,
        type: "file_hash",
        source: art.path_or_uri,
        content: `Observed workspace file ${fs?.status || "changed"}: ${art.path_or_uri} (hash: ${art.version_or_hash})`,
        captured_at: capturedAt,
        epistemic_status: "observed",
        metadata: {
          path: art.path_or_uri,
          status: fs?.status || "modified",
          staged: fs?.staged || false,
          version: art.version_or_hash
        }
      });
    }

    return evidenceList;
  }
}
