import { describe, it, expect, vi } from "vitest";
import { parseAlexaIntent, AlexaDispatcher } from "../src/alexa/dispatcher.js";
import { LocalMemoryProvider } from "../src/providers/memory.js";
import { FixtureModelProvider } from "../src/providers/model.js";
import { ContinuityEngine } from "../src/engine/continuity.js";
import { WorkspaceProvider, WorkspaceSnapshot } from "../src/providers/workspace.js";
import { CognitiveCheckpoint } from "../src/domain/types.js";

describe("Alexa+ Intent Parser & Dispatcher (Milestone 4)", () => {
  describe("parseAlexaIntent", () => {
    it("parses 'park_this' and common aliases", () => {
      expect(parseAlexaIntent("Alexa, park this.").intent).toBe("park_this");
      expect(parseAlexaIntent("alexa park").intent).toBe("park_this");
      expect(parseAlexaIntent("Alexa, save checkpoint!").intent).toBe("park_this");
      expect(parseAlexaIntent("park my work").intent).toBe("park_this");
    });

    it("parses 'where_was_i' and resume aliases", () => {
      expect(parseAlexaIntent("Alexa, where was I?").intent).toBe("where_was_i");
      expect(parseAlexaIntent("alexa resume").intent).toBe("where_was_i");
      expect(parseAlexaIntent("where did I leave off?").intent).toBe("where_was_i");
      expect(parseAlexaIntent("Alexa, what was I doing?").intent).toBe("where_was_i");
    });

    it("parses 'what_changed' and diff aliases", () => {
      expect(parseAlexaIntent("Alexa, what changed?").intent).toBe("what_changed");
      expect(parseAlexaIntent("Alexa, show changes.").intent).toBe("what_changed");
      expect(parseAlexaIntent("whats changed").intent).toBe("what_changed");
      expect(parseAlexaIntent("Alexa, diff").intent).toBe("what_changed");
    });

    it("parses 'what_should_i_do_next' and next action aliases", () => {
      expect(parseAlexaIntent("Alexa, what should I do next?").intent).toBe("what_should_i_do_next");
      expect(parseAlexaIntent("Alexa, what next?").intent).toBe("what_should_i_do_next");
      expect(parseAlexaIntent("what to do next").intent).toBe("what_should_i_do_next");
      expect(parseAlexaIntent("next action").intent).toBe("what_should_i_do_next");
    });

    it("parses 'why_is_that_assumption_stale' and explanation aliases", () => {
      expect(parseAlexaIntent("Alexa, why is that assumption stale?").intent).toBe("why_is_that_assumption_stale");
      expect(parseAlexaIntent("why is my assumption stale").intent).toBe("why_is_that_assumption_stale");
      expect(parseAlexaIntent("Alexa, why stale?").intent).toBe("why_is_that_assumption_stale");
      expect(parseAlexaIntent("explain staleness").intent).toBe("why_is_that_assumption_stale");
    });

    it("identifies unrecognized commands as unknown", () => {
      expect(parseAlexaIntent("Alexa, tell me a joke").intent).toBe("unknown");
      expect(parseAlexaIntent("open the pod bay doors").intent).toBe("unknown");
    });
  });

  describe("AlexaDispatcher execution", () => {
    function createMockWorkspaceProvider(): WorkspaceProvider {
      const now = new Date().toISOString();
      return {
        isGitRepository: vi.fn(async () => true),
        captureSnapshot: vi.fn(async (): Promise<WorkspaceSnapshot> => ({
          repository_root: "/mock/repo",
          branch: "main",
          head_commit: {
            hash: "commit-abc1234",
            short_hash: "abc1234",
            author: "Developer",
            timestamp: now,
            message: "initial commit"
          },
          is_clean: true,
          file_statuses: [],
          artifacts: [
            {
              id: "art-payment-ts",
              path_or_uri: "src/payment.ts",
              type: "code",
              version_or_hash: "hash-initial-1111",
              summary: "Prototype payment file",
              last_modified: now
            }
          ],
          evidence: [
            {
              id: "ev-git-head",
              type: "git_status",
              source: "git:commit:abc1234",
              content: "HEAD at commit abc1234",
              captured_at: now,
              epistemic_status: "observed"
            },
            {
              id: "ev-git-branch",
              type: "git_status",
              source: "git:branch",
              content: "Active branch is 'main'",
              captured_at: now,
              epistemic_status: "observed"
            },
            {
              id: "ev-git-status",
              type: "git_status",
              source: "git:status",
              content: "Working tree clean",
              captured_at: now,
              epistemic_status: "observed"
            },
            {
              id: "ev-art-payment-ts",
              type: "file_hash",
              source: "src/payment.ts",
              content: "src/payment.ts hash-initial-1111",
              captured_at: now,
              epistemic_status: "observed"
            }
          ],
          recent_commits: [],
          captured_at: now
        }))
      };
    }

    function createPaymentCheckpoint(): CognitiveCheckpoint {
      const now = new Date().toISOString();
      return {
        checkpoint_id: "cp-test-currency-01",
        thread_id: "thread-currency-validation",
        actor_id: "developer-demo",
        created_at: now,
        goal: {
          text: "Implement multi-currency payment validation with audit logging",
          success_criteria: ["Validate currency codes against whitelist"],
          evidence_ids: ["ev-art-payment-ts"]
        },
        state_summary: "Initial prototype created without currency whitelist validation",
        work_context: {
          project_name: "payment-service",
          workspace_root: "/mock/repo",
          branch: "main",
          active_file: "src/payment.ts"
        },
        artifacts: [
          {
            id: "art-payment-ts",
            path_or_uri: "src/payment.ts",
            type: "code",
            version_or_hash: "hash-initial-1111",
            summary: "Prototype payment processor",
            last_modified: now
          }
        ],
        evidence: [
          {
            id: "ev-git-head",
            type: "git_status",
            source: "git:commit:abc1234",
            content: "HEAD commit",
            captured_at: now,
            epistemic_status: "observed"
          },
          {
            id: "ev-git-branch",
            type: "git_status",
            source: "git:branch",
            content: "branch main",
            captured_at: now,
            epistemic_status: "observed"
          },
          {
            id: "ev-git-status",
            type: "git_status",
            source: "git:status",
            content: "clean",
            captured_at: now,
            epistemic_status: "observed"
          },
          {
            id: "ev-art-payment-ts",
            type: "file_hash",
            source: "src/payment.ts",
            content: "src/payment.ts hash-initial-1111",
            captured_at: now,
            epistemic_status: "observed"
          }
        ],
        decisions: [
          {
            id: "dec-prototype",
            description: "Build rapid multi-currency prototype first",
            rationale: "Unblock checkout flow",
            status: "active",
            assumptions: ["asmp-currency-01"],
            evidence_ids: ["ev-art-payment-ts"]
          }
        ],
        assumptions: [
          {
            id: "asmp-currency-01",
            statement: "src/payment.ts accepts currencies without whitelist validation",
            status: "active",
            target_artifact_id: "art-payment-ts",
            evidence_ids: ["ev-art-payment-ts"]
          }
        ],
        attempts: [],
        blockers: [],
        open_questions: [],
        next_actions: [
          {
            id: "na-01",
            description: "Inspect the changed currency-validation logic before proceeding.",
            priority: "immediate",
            rationale: "Ensure currency validation is tested",
            target_artifact: "src/payment.ts",
            evidence_ids: ["ev-art-payment-ts"]
          }
        ]
      };
    }

    it("executes 'park_this' and returns structured AlexaCommandResponse", async () => {
      const memoryProvider = new LocalMemoryProvider();
      const modelProvider = new FixtureModelProvider();
      const workspaceProvider = createMockWorkspaceProvider();
      const engine = new ContinuityEngine({ memoryProvider, modelProvider, workspaceProvider });

      const dispatcher = new AlexaDispatcher({
        engine,
        memoryProvider,
        workspaceProvider,
        defaultWorkspacePath: "/mock/repo",
        defaultThreadId: "thread-test-1"
      });

      const response = await dispatcher.execute({
        command: "Alexa, park this.",
        workspacePath: "/mock/repo",
        threadId: "thread-test-1"
      });

      expect(response.intent).toBe("park_this");
      expect(response.checkpoint_id).toBeDefined();
      expect(response.spoken_response).toContain("Parked your work on");
      expect(response.badges).toContain("Git Evidence");
      expect(response.badges).toContain("Grounded");
      expect(response.then_state?.checkpoint_id).toBe(response.checkpoint_id);
    });

    it("executes 'where_was_i' and cleanly separates facts, interpretation, and unknowns", async () => {
      const memoryProvider = new LocalMemoryProvider();
      const modelProvider = new FixtureModelProvider();
      const workspaceProvider = createMockWorkspaceProvider();
      const engine = new ContinuityEngine({ memoryProvider, modelProvider, workspaceProvider });

      // Save baseline checkpoint
      const checkpoint = createPaymentCheckpoint();
      await memoryProvider.saveCheckpoint(checkpoint);

      const now = new Date().toISOString();
      // Mutate workspace snapshot to simulate file change
      vi.mocked(workspaceProvider.captureSnapshot).mockResolvedValueOnce({
        repository_root: "/mock/repo",
        branch: "main",
        head_commit: {
          hash: "commit-def5678",
          short_hash: "def5678",
          author: "Developer",
          timestamp: now,
          message: "update"
        },
        is_clean: false,
        file_statuses: [{ path: "src/payment.ts", status: "modified", staged: false }],
        recent_commits: [],
        artifacts: [
          {
            id: "art-payment-ts",
            path_or_uri: "src/payment.ts",
            type: "code",
            version_or_hash: "hash-modified-2222",
            summary: "Modified payment processor",
            last_modified: now
          }
        ],
        evidence: [
          {
            id: "ev-git-head",
            type: "git_status",
            source: "git:commit:def5678",
            content: "HEAD commit",
            captured_at: now,
            epistemic_status: "observed"
          },
          {
            id: "ev-git-branch",
            type: "git_status",
            source: "git:branch",
            content: "branch main",
            captured_at: now,
            epistemic_status: "observed"
          },
          {
            id: "ev-git-status",
            type: "git_status",
            source: "git:status",
            content: "dirty",
            captured_at: now,
            epistemic_status: "observed"
          },
          {
            id: "ev-art-payment-ts",
            type: "file_hash",
            source: "src/payment.ts",
            content: "src/payment.ts hash-modified-2222",
            captured_at: now,
            epistemic_status: "observed"
          }
        ],
        captured_at: now
      });

      const dispatcher = new AlexaDispatcher({
        engine,
        memoryProvider,
        workspaceProvider,
        defaultWorkspacePath: "/mock/repo",
        defaultThreadId: "thread-currency-validation"
      });

      const response = await dispatcher.execute({
        command: "Alexa, where was I?",
        workspacePath: "/mock/repo",
        threadId: "thread-currency-validation"
      });

      expect(response.intent).toBe("where_was_i");
      expect(response.spoken_response).toContain("You were");
      expect(response.spoken_response).toContain("While you were away");
      expect(response.spoken_response).toContain("needs review");
      expect(response.spoken_response).toContain("I don't yet know");
      expect(response.spoken_response).toContain("Next,");

      // Verify THEN vs NOW inspection
      expect(response.then_state?.goal).toContain("multi-currency");
      expect(response.then_state?.active_assumption).toContain("accepts currencies without whitelist validation");
      expect(response.now_state?.changed_artifacts).toContain("src/payment.ts");
      expect(response.now_state?.stale_assumption_status).toContain("STALE");

      // Verify Epistemic Separation in Assessment
      expect(response.assessment).toBeDefined();
      expect(response.assessment?.observed[0]).toContain("src/payment.ts changed");
      expect(response.assessment?.derived[0]).toContain("stale");
      expect(response.assessment?.unknown[0]).toContain("authored");

      // Verify domain-aware copy
      expect(response.next_action?.description).toContain("currency-validation logic");
      expect(response.badges).toContain("Needs Review");
    });

    it("executes 'what_changed' and returns spoken diff list", async () => {
      const memoryProvider = new LocalMemoryProvider();
      const modelProvider = new FixtureModelProvider();
      const workspaceProvider = createMockWorkspaceProvider();
      const engine = new ContinuityEngine({ memoryProvider, modelProvider, workspaceProvider });

      const dispatcher = new AlexaDispatcher({
        engine,
        memoryProvider,
        workspaceProvider,
        defaultWorkspacePath: "/mock/repo",
        defaultThreadId: "thread-currency-validation"
      });

      // Save checkpoint and mutate workspace
      const checkpoint = createPaymentCheckpoint();
      await memoryProvider.saveCheckpoint(checkpoint);

      const now = new Date().toISOString();
      vi.mocked(workspaceProvider.captureSnapshot).mockResolvedValueOnce({
        repository_root: "/mock/repo",
        branch: "main",
        head_commit: {
          hash: "commit-def5678",
          short_hash: "def5678",
          author: "Developer",
          timestamp: now,
          message: "update"
        },
        is_clean: false,
        file_statuses: [{ path: "src/payment.ts", status: "modified", staged: false }],
        recent_commits: [],
        artifacts: [
          {
            id: "art-payment-ts",
            path_or_uri: "src/payment.ts",
            type: "code",
            version_or_hash: "hash-modified-2222",
            summary: "Modified payment processor",
            last_modified: now
          }
        ],
        evidence: [
          {
            id: "ev-art-payment-ts",
            type: "file_hash",
            source: "src/payment.ts",
            content: "src/payment.ts hash-modified-2222",
            captured_at: now,
            epistemic_status: "observed"
          }
        ],
        captured_at: now
      });

      const response = await dispatcher.execute({
        command: "Alexa, what changed?",
        workspacePath: "/mock/repo",
        threadId: "thread-currency-validation"
      });

      expect(response.intent).toBe("what_changed");
      expect(response.spoken_response).toContain("src/payment.ts");
    });

    it("executes 'what_should_i_do_next' and returns grounded next action", async () => {
      const memoryProvider = new LocalMemoryProvider();
      const modelProvider = new FixtureModelProvider();
      const workspaceProvider = createMockWorkspaceProvider();
      const engine = new ContinuityEngine({ memoryProvider, modelProvider, workspaceProvider });

      // Save checkpoint first
      const checkpoint = createPaymentCheckpoint();
      await memoryProvider.saveCheckpoint(checkpoint);

      const dispatcher = new AlexaDispatcher({
        engine,
        memoryProvider,
        workspaceProvider,
        defaultWorkspacePath: "/mock/repo",
        defaultThreadId: "thread-currency-validation"
      });

      const response = await dispatcher.execute({
        command: "Alexa, what should I do next?",
        workspacePath: "/mock/repo",
        threadId: "thread-currency-validation"
      });

      expect(response.intent).toBe("what_should_i_do_next");
      expect(response.spoken_response).toContain("Next:");
      expect(response.next_action).toBeDefined();
    });

    it("executes 'why_is_that_assumption_stale' and explains invalidation trail", async () => {
      const memoryProvider = new LocalMemoryProvider();
      const modelProvider = new FixtureModelProvider();
      const workspaceProvider = createMockWorkspaceProvider();
      const engine = new ContinuityEngine({ memoryProvider, modelProvider, workspaceProvider });

      const dispatcher = new AlexaDispatcher({
        engine,
        memoryProvider,
        workspaceProvider,
        defaultWorkspacePath: "/mock/repo",
        defaultThreadId: "thread-currency-validation"
      });

      // Save checkpoint with assumption
      const checkpoint = createPaymentCheckpoint();
      await memoryProvider.saveCheckpoint(checkpoint);

      const now = new Date().toISOString();
      vi.mocked(workspaceProvider.captureSnapshot).mockResolvedValueOnce({
        repository_root: "/mock/repo",
        branch: "main",
        head_commit: {
          hash: "commit-def5678",
          short_hash: "def5678",
          author: "Developer",
          timestamp: now,
          message: "update"
        },
        is_clean: false,
        file_statuses: [{ path: "src/payment.ts", status: "modified", staged: false }],
        recent_commits: [],
        artifacts: [
          {
            id: "art-payment-ts",
            path_or_uri: "src/payment.ts",
            type: "code",
            version_or_hash: "hash-modified-2222",
            summary: "Modified payment processor",
            last_modified: now
          }
        ],
        evidence: [
          {
            id: "ev-art-payment-ts",
            type: "file_hash",
            source: "src/payment.ts",
            content: "src/payment.ts hash-modified-2222",
            captured_at: now,
            epistemic_status: "observed"
          }
        ],
        captured_at: now
      });

      const response = await dispatcher.execute({
        command: "Alexa, why is that assumption stale?",
        workspacePath: "/mock/repo",
        threadId: "thread-currency-validation"
      });

      expect(response.intent).toBe("why_is_that_assumption_stale");
      expect(response.spoken_response).toContain("src/payment.ts changed");
    });

    it("handles unknown commands gracefully with help prompts", async () => {
      const memoryProvider = new LocalMemoryProvider();
      const modelProvider = new FixtureModelProvider();
      const workspaceProvider = createMockWorkspaceProvider();
      const engine = new ContinuityEngine({ memoryProvider, modelProvider, workspaceProvider });

      const dispatcher = new AlexaDispatcher({
        engine,
        memoryProvider,
        workspaceProvider
      });

      const response = await dispatcher.execute({
        command: "Alexa, play some music"
      });

      expect(response.intent).toBe("unknown");
      expect(response.spoken_response).toContain("I didn't recognize");
      expect(response.spoken_response).toContain("Alexa, park this");
      expect(response.spoken_response).toContain("Alexa, where was I?");
    });
  });
});
