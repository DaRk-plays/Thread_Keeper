import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { ContinuityEngine } from "../engine/continuity.js";
import { LocalMemoryProvider, createMemoryProvider } from "../providers/memory.js";
import { FixtureModelProvider, createModelProvider } from "../providers/model.js";
import { createThreadKeeperMcpServer } from "../mcp/server.js";
import {
  getInterruptedWorkspaceState,
  getSeededCheckpoint,
  getUnchangedWorkspaceState
} from "../scenario/seeded.js";
import { CurrentWorkspaceState } from "../engine/diff.js";
import { LocalGitWorkspaceProvider } from "../providers/workspace.js";
import { AlexaDispatcher } from "../alexa/dispatcher.js";
import {
  setupDemoFixture,
  parkDemo,
  interruptDemo,
  resumeDemo,
  loadDemoState
} from "../cli/demo-fixture.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createServer(customEngine?: ContinuityEngine) {
  const app = express();
  app.use(cors());

  // Memory & Engine setup
  let memoryProvider;
  try {
    memoryProvider = createMemoryProvider();
  } catch {
    memoryProvider = new LocalMemoryProvider();
  }
  let modelProvider;
  try {
    modelProvider = createModelProvider();
  } catch {
    modelProvider = new FixtureModelProvider();
  }
  const workspaceProvider = new LocalGitWorkspaceProvider();
  const engine = customEngine || new ContinuityEngine({ memoryProvider, modelProvider, workspaceProvider });

  const alexaDispatcher = new AlexaDispatcher({
    engine,
    memoryProvider,
    workspaceProvider
  });

  // Setup MCP Streamable HTTP transport
  const mcpServer = createThreadKeeperMcpServer(engine);
  const mcpTransport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID()
  });

  // Connect MCP Server to transport
  mcpServer.connect(mcpTransport).catch((err) => {
    console.error("Failed to connect MCP server to Streamable HTTP transport:", err);
  });

  // MCP Streamable HTTP Endpoint
  // Handles POST and GET requests per Streamable HTTP specification
  app.all("/mcp", (req, res) => {
    mcpTransport.handleRequest(req, res);
  });

  // Parse JSON for web console REST routes
  app.use(express.json());

  // Static web console assets
  app.use(express.static(path.join(__dirname, "public")));

  // REST API for Web Console & Simulator
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "healthy",
      service: "ThreadKeeper",
      version: "1.0.0",
      mcp_transport: "Streamable HTTP",
      active_provider: "LocalMemoryProvider",
      timestamp: new Date().toISOString()
    });
  });

  // Park Checkpoint
  app.post("/api/park", async (req, res) => {
    try {
      const checkpoint = req.body;
      const saved = await engine.park(checkpoint);
      res.json({ status: "success", checkpoint: saved });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(400).json({ status: "error", message: msg });
    }
  });

  // Resume Thread
  app.post("/api/resume", async (req, res) => {
    try {
      const { thread_id, current_state } = req.body;
      const state: CurrentWorkspaceState = current_state || getUnchangedWorkspaceState();
      const brief = await engine.resume(thread_id, state);
      res.json({ status: "success", brief });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(400).json({ status: "error", message: msg });
    }
  });

  // Get Latest Checkpoint
  app.get("/api/checkpoint/:threadId", async (req, res) => {
    try {
      const cp = await memoryProvider.getLatestCheckpoint(req.params.threadId);
      if (!cp) {
        res.status(404).json({ status: "not_found", message: "No checkpoint found for thread" });
        return;
      }
      res.json({ status: "success", checkpoint: cp });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ status: "error", message: msg });
    }
  });

  // Seeded Demo: Load Initial Invoice Bug Scenario
  app.post("/api/scenario/load-seeded", async (_req, res) => {
    try {
      const seeded = getSeededCheckpoint();
      const saved = await engine.park(seeded);
      res.json({
        status: "success",
        scenario: "Invoice Filtering Bug (Initial Parked State)",
        checkpoint: saved
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ status: "error", message: msg });
    }
  });

  // Seeded Demo: Simulate Interruption & Resume with Changed State
  app.post("/api/scenario/simulate-interruption", async (_req, res) => {
    try {
      const interruptedState = getInterruptedWorkspaceState();
      const brief = await engine.resume("thread-invoice-filtering", interruptedState);
      res.json({
        status: "success",
        event: "Interruption State Change Simulated",
        changed_artifact: "components/InvoiceFilter.tsx",
        brief
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ status: "error", message: msg });
    }
  });

  // Handoff Packet Export
  app.get("/api/handoff/:threadId", async (req, res) => {
    try {
      const handoff = await engine.createHandoff(req.params.threadId, getInterruptedWorkspaceState());
      res.json({ status: "success", handoff });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(400).json({ status: "error", message: msg });
    }
  });

  // Workspace: Inspect Local Repository
  app.post("/api/workspace/inspect", async (req, res) => {
    try {
      const { workspace_path } = req.body;
      const workspaceProvider = new LocalGitWorkspaceProvider();
      const snapshot = await workspaceProvider.captureSnapshot(workspace_path || process.cwd());
      res.json({ status: "success", snapshot });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(400).json({ status: "error", message: msg });
    }
  });

  // Workspace: Park Real Repository
  app.post("/api/workspace/park", async (req, res) => {
    try {
      const { workspace_path, goal_text, thread_id } = req.body;
      const saved = await engine.parkWorkspace({
        workspacePath: workspace_path || process.cwd(),
        goalText: goal_text,
        threadId: thread_id
      });
      res.json({ status: "success", checkpoint: saved });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(400).json({ status: "error", message: msg });
    }
  });

  // Workspace: Resume Real Repository
  app.post("/api/workspace/resume", async (req, res) => {
    try {
      const { workspace_path, thread_id } = req.body;
      const targetPath = workspace_path || process.cwd();
      const brief = await engine.resumeWorkspace({
        workspacePath: targetPath,
        threadId: thread_id || `thread-${path.basename(targetPath)}`
      });
      res.json({ status: "success", brief });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(400).json({ status: "error", message: msg });
    }
  });

  // Alexa+ Conversational Command Dispatcher
  app.post("/api/alexa/command", async (req, res) => {
    try {
      const { command, threadId, workspacePath } = req.body;
      if (!command || typeof command !== "string") {
        res.status(400).json({ status: "error", message: "Missing command field" });
        return;
      }
      const response = await alexaDispatcher.execute({
        command,
        threadId,
        workspacePath
      });
      res.json({ status: "success", response });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ status: "error", message: msg });
    }
  });

  // Demo Fixture Endpoints (Judge-Ready Interactive Stepper)
  app.get("/api/demo/status", (_req, res) => {
    try {
      const state = loadDemoState();
      res.json({ status: "success", demo_state: state });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ status: "error", message: msg });
    }
  });

  app.post("/api/demo/setup", async (_req, res) => {
    try {
      await setupDemoFixture();
      const state = loadDemoState();
      res.json({ status: "success", message: "Demo fixture initialized", demo_state: state });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ status: "error", message: msg });
    }
  });

  app.post("/api/demo/park", async (_req, res) => {
    try {
      const response = await parkDemo();
      const state = loadDemoState();
      res.json({ status: "success", response, demo_state: state });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ status: "error", message: msg });
    }
  });

  app.post("/api/demo/interrupt", async (_req, res) => {
    try {
      await interruptDemo();
      const state = loadDemoState();
      res.json({ status: "success", message: "Interruption mutation applied", demo_state: state });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ status: "error", message: msg });
    }
  });

  app.post("/api/demo/resume", async (_req, res) => {
    try {
      const response = await resumeDemo();
      const state = loadDemoState();
      res.json({ status: "success", response, demo_state: state });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ status: "error", message: msg });
    }
  });

  return { app, engine, memoryProvider, mcpServer, mcpTransport, alexaDispatcher };
}

// Start server if executed directly
if (process.env.NODE_ENV !== "test") {
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3100;
  const { app } = createServer();
  app.listen(PORT, () => {
    console.log(`[ThreadKeeper] Core server running on http://127.0.0.1:${PORT}`);
    console.log(`[ThreadKeeper] MCP Streamable HTTP endpoint: http://127.0.0.1:${PORT}/mcp`);
    console.log(`[ThreadKeeper] Visual Continuity Console: http://127.0.0.1:${PORT}/`);
  });
}
