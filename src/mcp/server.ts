import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { ContinuityEngine } from "../engine/continuity.js";
import {
  ArtifactSchema,
  CognitiveCheckpoint,
  EvidenceSchema,
  ResumeBrief
} from "../domain/types.js";
import { CurrentWorkspaceState } from "../engine/diff.js";

/**
 * Creates and registers the ThreadKeeper MCP Server with all required tools.
 */
export function createThreadKeeperMcpServer(engine: ContinuityEngine): McpServer {
  const server = new McpServer({
    name: "threadkeeper",
    version: "1.0.0"
  });

  // 1. TOOL: capture_checkpoint
  server.tool(
    "capture_checkpoint",
    "Captures a structured Cognitive Checkpoint (Goal, Evidence, Attempts, Decisions, Artifacts, Assumptions, Blockers, Next Actions) preserving provenance and context.",
    {
      thread_id: z.string().describe("Unique identifier for the work thread"),
      actor_id: z.string().describe("Actor/user ID creating the checkpoint"),
      goal_text: z.string().describe("What the user was trying to accomplish"),
      state_summary: z.string().describe("High-level summary of the working state"),
      workspace_root: z.string().describe("Root path of the project workspace"),
      branch: z.string().describe("Active Git branch name"),
      active_file: z.string().optional().describe("Currently open/focused file"),
      evidence: z.array(EvidenceSchema).default([]).describe("Observed facts, command outputs, or API responses"),
      attempts: z.array(z.object({
        id: z.string(),
        description: z.string(),
        status: z.enum(["succeeded", "failed", "in_progress", "abandoned"]),
        timestamp: z.string(),
        error_details: z.string().optional(),
        learnings: z.string().optional(),
        evidence_ids: z.array(z.string()).default([])
      })).default([]).describe("Approaches attempted and their outcomes"),
      decisions: z.array(z.object({
        id: z.string(),
        description: z.string(),
        rationale: z.string(),
        status: z.enum(["active", "superseded", "needs_review"]).default("active"),
        assumptions: z.array(z.string()).default([]),
        evidence_ids: z.array(z.string()).default([])
      })).default([]).describe("Decisions made and their supporting rationale"),
      artifacts: z.array(ArtifactSchema).default([]).describe("Key files, configs, or modules relevant to the state"),
      assumptions: z.array(z.object({
        id: z.string(),
        statement: z.string(),
        status: z.enum(["active", "stale", "invalidated", "validated"]).default("active"),
        target_artifact_id: z.string().optional(),
        evidence_ids: z.array(z.string()).default([])
      })).default([]).describe("Active assumptions that could become stale upon change"),
      blockers: z.array(z.object({
        id: z.string(),
        description: z.string(),
        severity: z.enum(["low", "medium", "high", "critical"]).default("medium"),
        open_questions: z.array(z.string()).default([]),
        evidence_ids: z.array(z.string()).default([])
      })).default([]).describe("Current impediments or obstacles"),
      open_questions: z.array(z.string()).default([]).describe("Unresolved questions requiring future inquiry"),
      workspace_path: z.string().optional().describe("Local Git repository path to automatically inspect and capture evidence from"),
      next_actions: z.array(z.object({
        id: z.string(),
        description: z.string(),
        priority: z.enum(["immediate", "next", "later"]).default("immediate"),
        rationale: z.string(),
        target_artifact: z.string().optional(),
        evidence_ids: z.array(z.string()).default([])
      })).default([]).describe("Intended next steps before interruption")
    },
    async (args) => {
      try {
        let saved: CognitiveCheckpoint;

        if (args.workspace_path) {
          saved = await engine.parkWorkspace({
            workspacePath: args.workspace_path,
            goalText: args.goal_text,
            stateSummary: args.state_summary,
            actorId: args.actor_id,
            threadId: args.thread_id,
            nextActionDescription: args.next_actions?.[0]?.description,
            assumptions: args.assumptions,
            decisions: args.decisions
          });
        } else {
          const checkpointId = `cp-${randomUUID().slice(0, 8)}`;
          const checkpoint: CognitiveCheckpoint = {
            checkpoint_id: checkpointId,
            thread_id: args.thread_id,
            actor_id: args.actor_id,
            created_at: new Date().toISOString(),
            goal: {
              text: args.goal_text,
              success_criteria: [],
              evidence_ids: args.evidence.map((e) => e.id)
            },
            state_summary: args.state_summary,
            work_context: {
              project_name: args.workspace_root.split("/").pop() || "workspace",
              workspace_root: args.workspace_root,
              branch: args.branch,
              active_file: args.active_file
            },
            evidence: args.evidence,
            attempts: args.attempts,
            decisions: args.decisions,
            artifacts: args.artifacts,
            assumptions: args.assumptions,
            blockers: args.blockers,
            open_questions: args.open_questions,
            next_actions: args.next_actions,
            uncertainties: []
          };
          saved = await engine.park(checkpoint);
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                status: "success",
                message: `Cognitive checkpoint '${saved.checkpoint_id}' successfully parked for thread '${saved.thread_id}'.`,
                checkpoint: saved
              }, null, 2)
            }
          ]
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to capture checkpoint: ${msg}` }]
        };
      }
    }
  );

  // 2. TOOL: resume_thread
  server.tool(
    "resume_thread",
    "Reconstructs state for a thread, calculates Continuity Diff against current reality, detects stale context, and produces a 30-second voice brief plus next action.",
    {
      thread_id: z.string().describe("Thread identifier to resume"),
      workspace_path: z.string().optional().describe("Local Git repository path to automatically inspect and compare against checkpoint"),
      current_branch: z.string().optional().describe("Current Git branch"),
      current_artifacts: z.array(ArtifactSchema).optional().describe("Current state of key artifacts"),
      current_evidence: z.array(EvidenceSchema).optional().describe("Newly observed evidence since checkpoint")
    },
    async (args) => {
      try {
        let brief: ResumeBrief;

        if (args.workspace_path) {
          brief = await engine.resumeWorkspace({
            threadId: args.thread_id,
            workspacePath: args.workspace_path
          });
        } else {
          const currentState: CurrentWorkspaceState = {
            timestamp: new Date().toISOString(),
            git_branch: args.current_branch || "main",
            artifacts: args.current_artifacts || [],
            evidence: args.current_evidence || []
          };
          brief = await engine.resume(args.thread_id, currentState);
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(brief, null, 2)
            }
          ]
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to resume thread: ${msg}` }]
        };
      }
    }
  );

  // 3. TOOL: compare_current_state
  server.tool(
    "compare_current_state",
    "Computes Continuity Diff between a specific checkpoint and current workspace reality.",
    {
      checkpoint_id: z.string().describe("Checkpoint ID to compare against"),
      workspace_path: z.string().optional().describe("Local Git repository path to inspect and compare"),
      current_artifacts: z.array(ArtifactSchema).optional().describe("Current workspace artifacts (if workspace_path not supplied)"),
      current_evidence: z.array(EvidenceSchema).optional().describe("Newly observed evidence items")
    },
    async (args) => {
      try {
        let diff;

        if (args.workspace_path) {
          diff = await engine.compareWorkspace(args.checkpoint_id, args.workspace_path);
        } else {
          const currentState: CurrentWorkspaceState = {
            timestamp: new Date().toISOString(),
            git_branch: "current",
            artifacts: args.current_artifacts || [],
            evidence: args.current_evidence || []
          };
          diff = await engine.compareCurrentState(args.checkpoint_id, currentState);
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(diff, null, 2)
            }
          ]
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to compare state: ${msg}` }]
        };
      }
    }
  );

  // 4. TOOL: find_decision
  server.tool(
    "find_decision",
    "Answers why a decision was made in a thread with supporting rationale and cited evidence.",
    {
      thread_id: z.string().describe("Thread identifier to search within"),
      query: z.string().describe("Search term or decision topic")
    },
    async (args) => {
      try {
        const result = await engine.findDecision(args.thread_id, args.query);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to find decision: ${msg}` }]
        };
      }
    }
  );

  // 5. TOOL: find_unfinished_work
  server.tool(
    "find_unfinished_work",
    "Recovers unresolved goals, blockers, open questions, and pending next actions across a thread.",
    {
      thread_id: z.string().describe("Thread identifier")
    },
    async (args) => {
      try {
        const unfinished = await engine.findUnfinishedWork(args.thread_id);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(unfinished, null, 2)
            }
          ]
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to find unfinished work: ${msg}` }]
        };
      }
    }
  );

  // 6. TOOL: create_handoff
  server.tool(
    "create_handoff",
    "Produces a structured, lossless context packet (HandoffPacket) to continue work without repeating investigation.",
    {
      thread_id: z.string().describe("Thread identifier to generate handoff from"),
      current_artifacts: z.array(ArtifactSchema).optional().describe("Current workspace artifacts"),
      current_evidence: z.array(EvidenceSchema).optional().describe("Newly observed evidence items")
    },
    async (args) => {
      try {
        const currentState: CurrentWorkspaceState | undefined = args.current_artifacts
          ? {
              timestamp: new Date().toISOString(),
              git_branch: "current",
              artifacts: args.current_artifacts,
              evidence: args.current_evidence || []
            }
          : undefined;

        const handoff = await engine.createHandoff(args.thread_id, currentState);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(handoff, null, 2)
            }
          ]
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          isError: true,
          content: [{ type: "text", text: `Failed to create handoff: ${msg}` }]
        };
      }
    }
  );

  return server;
}
