import http from "node:http";
import { randomUUID } from "node:crypto";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { ContinuityEngine } from "../engine/continuity.js";
import { LocalMemoryProvider } from "../providers/memory.js";
import { FixtureModelProvider } from "../providers/model.js";
import { createThreadKeeperMcpServer } from "../mcp/server.js";

function getTextContent(result: unknown): string {
  const r = result as { content?: Array<{ type: string; text?: string }> };
  if (!r.content || !r.content[0] || typeof r.content[0].text !== "string") {
    throw new Error("Missing text content in tool result: " + JSON.stringify(result));
  }
  return r.content[0].text;
}

async function verifyMcpServer() {
  console.log("================================================================================");
  console.log("  THREADKEEPER — MCP STREAMABLE HTTP VERIFICATION RUNNER");
  console.log("  Protocol Target: MCP >= 2025-11-25 over Streamable HTTP");
  console.log("================================================================================\n");

  // 1. Initialize Engine & MCP Server
  const memory = new LocalMemoryProvider();
  const model = new FixtureModelProvider();
  const engine = new ContinuityEngine({ memoryProvider: memory, modelProvider: model });
  const mcpServer = createThreadKeeperMcpServer(engine);

  // 2. Setup Streamable HTTP Server Transport
  const serverTransport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID()
  });
  await mcpServer.connect(serverTransport);

  // 3. Mount on local HTTP server
  const httpServer = http.createServer((req, res) => {
    serverTransport.handleRequest(req, res);
  });

  await new Promise<void>((resolve) => httpServer.listen(0, "127.0.0.1", resolve));
  const address = httpServer.address() as { address: string; port: number };
  const serverUrl = `http://127.0.0.1:${address.port}`;
  console.log(`✓ Ephemeral HTTP server listening at: ${serverUrl}`);

  // 4. Initialize Streamable HTTP Client Transport
  console.log(">>> Connecting real MCP Client over Streamable HTTP...");
  const clientTransport = new StreamableHTTPClientTransport(new URL(serverUrl));
  const client = new Client(
    { name: "threadkeeper-verifier-client", version: "1.0.0" },
    { capabilities: {} }
  );

  await client.connect(clientTransport);
  console.log("✓ MCP Client handshake completed successfully!\n");

  // Protocol version verification (Gate 2)
  const negotiatedVersion = clientTransport.protocolVersion || "unknown";
  const hackathonMinimum = "2025-11-25";
  const isProtocolCompliant = negotiatedVersion >= hackathonMinimum;

  console.log(`Negotiated MCP protocol: ${negotiatedVersion}`);
  console.log(`Hackathon minimum: ${hackathonMinimum}`);
  console.log(`Protocol requirement: ${isProtocolCompliant ? "PASS" : "FAIL"}\n`);

  if (!isProtocolCompliant) {
    throw new Error(
      `Negotiated MCP protocol version '${negotiatedVersion}' does not satisfy hackathon minimum '>= ${hackathonMinimum}'`
    );
  }

  try {
    // 5. Discover Tools
    console.log(">>> Discovering registered MCP tools (`tools/list`)...");
    const toolListResult = await client.listTools();
    const discoveredNames = toolListResult.tools.map((t) => t.name);
    console.log(`✓ Discovered ${discoveredNames.length} tools: ${discoveredNames.join(", ")}\n`);

    const requiredTools = [
      "capture_checkpoint",
      "resume_thread",
      "compare_current_state",
      "find_decision",
      "find_unfinished_work",
      "create_handoff"
    ];

    for (const reqTool of requiredTools) {
      if (!discoveredNames.includes(reqTool)) {
        throw new Error(`Missing required MCP tool: ${reqTool}`);
      }
    }
    console.log("✓ All 6 required MCP tools are present and registered!\n");

    const testThreadId = "mcp-test-thread-01";

    // 6. Invoke Tool 1: capture_checkpoint
    console.log(">>> Invoking Tool 1: `capture_checkpoint`...");
    const parkRes = await client.callTool({
      name: "capture_checkpoint",
      arguments: {
        thread_id: testThreadId,
        actor_id: "mcp-tester",
        goal_text: "Refactor database connection pool",
        state_summary: "Analyzing pool exhaustion during peak query load",
        workspace_root: "/workspace/backend",
        branch: "perf/db-pool",
        active_file: "config/database.ts",
        evidence: [
          {
            id: "ev-pool-01",
            type: "runtime_log",
            source: "logs/app.log",
            content: "Connection pool timeout after 5000ms: 10 connections busy",
            captured_at: new Date().toISOString(),
            epistemic_status: "observed"
          }
        ],
        decisions: [
          {
            id: "dec-pool-01",
            description: "Increase maximum connection pool size from 10 to 30",
            rationale: "Traffic spikes require 25 concurrent connections at 95th percentile",
            status: "active",
            assumptions: ["asm-rds-limits"],
            evidence_ids: ["ev-pool-01"]
          }
        ],
        artifacts: [
          {
            id: "art-db-cfg",
            path_or_uri: "config/database.ts",
            type: "config",
            version_or_hash: "hash-v1-cfg",
            summary: "Database connection pool settings"
          }
        ],
        assumptions: [
          {
            id: "asm-rds-limits",
            statement: "RDS PostgreSQL instance supports up to 100 max connections",
            status: "active",
            target_artifact_id: "art-db-cfg",
            evidence_ids: ["ev-pool-01"]
          }
        ],
        blockers: [],
        open_questions: ["Does pgBouncer need to be deployed?"],
        next_actions: [
          {
            id: "na-pool-01",
            description: "Update pool size in config/database.ts and run load tests",
            priority: "immediate",
            rationale: "Low-risk configuration change to validate capacity",
            target_artifact: "config/database.ts",
            evidence_ids: ["ev-pool-01"]
          }
        ]
      }
    });

    if (parkRes.isError) {
      throw new Error(`capture_checkpoint failed: ${JSON.stringify(parkRes)}`);
    }
    const parkText = getTextContent(parkRes);
    const parkData = JSON.parse(parkText);
    const checkpointId = parkData.checkpoint.checkpoint_id;
    console.log(`✓ capture_checkpoint succeeded! Checkpoint ID: ${checkpointId}\n`);

    // 7. Invoke Tool 2: resume_thread
    console.log(">>> Invoking Tool 2: `resume_thread` with simulated changed artifact...");
    const resumeRes = await client.callTool({
      name: "resume_thread",
      arguments: {
        thread_id: testThreadId,
        current_artifacts: [
          {
            id: "art-db-cfg",
            path_or_uri: "config/database.ts",
            type: "config",
            version_or_hash: "hash-v2-cfg-modified" // Modified!
          }
        ],
        current_evidence: [
          {
            id: "ev-git-mod",
            type: "git_status",
            source: "config/database.ts",
            content: "Commit 1a2b: DB config modified by DevOps",
            captured_at: new Date().toISOString(),
            epistemic_status: "observed",
            metadata: {
              invalidates_assumption_id: "asm-rds-limits"
            }
          }
        ]
      }
    });

    if (resumeRes.isError) {
      throw new Error(`resume_thread failed: ${JSON.stringify(resumeRes)}`);
    }
    const resumeText = getTextContent(resumeRes);
    const resumeData = JSON.parse(resumeText);
    console.log(`✓ resume_thread succeeded!`);
    console.log(`  - Voice Summary: "${resumeData.voice_summary}"`);
    console.log(`  - Stale Assumptions: ${resumeData.stale_assumption_count}`);
    console.log(`  - Changed Artifacts: ${resumeData.changed_artifact_count}\n`);

    // 8. Invoke Tool 3: compare_current_state
    console.log(">>> Invoking Tool 3: `compare_current_state`...");
    const compareRes = await client.callTool({
      name: "compare_current_state",
      arguments: {
        checkpoint_id: checkpointId,
        current_artifacts: [
          {
            id: "art-db-cfg",
            path_or_uri: "config/database.ts",
            type: "config",
            version_or_hash: "hash-v2-cfg-modified"
          }
        ]
      }
    });
    if (compareRes.isError) {
      throw new Error(`compare_current_state failed: ${JSON.stringify(compareRes)}`);
    }
    const compareData = JSON.parse(getTextContent(compareRes));
    console.log(`✓ compare_current_state succeeded! Changed count: ${compareData.changed.length}\n`);

    // 9. Invoke Tool 4: find_decision
    console.log(">>> Invoking Tool 4: `find_decision`...");
    const decRes = await client.callTool({
      name: "find_decision",
      arguments: {
        thread_id: testThreadId,
        query: "connection pool"
      }
    });
    if (decRes.isError) {
      throw new Error(`find_decision failed: ${JSON.stringify(decRes)}`);
    }
    const decData = JSON.parse(getTextContent(decRes));
    console.log(`✓ find_decision succeeded! Found ${decData.decisions.length} matching decisions.\n`);

    // 10. Invoke Tool 5: find_unfinished_work
    console.log(">>> Invoking Tool 5: `find_unfinished_work`...");
    const unfinRes = await client.callTool({
      name: "find_unfinished_work",
      arguments: {
        thread_id: testThreadId
      }
    });
    if (unfinRes.isError) {
      throw new Error(`find_unfinished_work failed: ${JSON.stringify(unfinRes)}`);
    }
    const unfinData = JSON.parse(getTextContent(unfinRes));
    console.log(`✓ find_unfinished_work succeeded! Open questions: ${unfinData.open_questions.length}\n`);

    // 11. Invoke Tool 6: create_handoff
    console.log(">>> Invoking Tool 6: `create_handoff`...");
    const handoffRes = await client.callTool({
      name: "create_handoff",
      arguments: {
        thread_id: testThreadId,
        current_artifacts: [
          {
            id: "art-db-cfg",
            path_or_uri: "config/database.ts",
            type: "config",
            version_or_hash: "hash-v2-cfg-modified"
          }
        ]
      }
    });
    if (handoffRes.isError) {
      throw new Error(`create_handoff failed: ${JSON.stringify(handoffRes)}`);
    }
    const handoffData = JSON.parse(getTextContent(handoffRes));
    console.log(`✓ create_handoff succeeded! Format: ${handoffData.format_version}, Objective: "${handoffData.objective}"\n`);

    // 12. Test Error Handling (Invalid input / non-existent thread)
    console.log(">>> Testing deterministic error handling for non-existent thread...");
    const errorRes = await client.callTool({
      name: "resume_thread",
      arguments: {
        thread_id: "non-existent-thread-999"
      }
    });
    if (errorRes.isError) {
      console.log(`✓ Controlled error handled properly: ${getTextContent(errorRes)}\n`);
    } else {
      throw new Error("Expected resume_thread to return isError: true for missing thread!");
    }

    console.log("================================================================================");
    console.log("  ALL 6 MCP TOOLS SUCCESSFULLY INVOKED OVER STREAMABLE HTTP");
    console.log("================================================================================");
  } finally {
    await client.close().catch(() => {});
    await serverTransport.close().catch(() => {});
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));
    process.exit(0);
  }
}

verifyMcpServer().catch((err) => {
  console.error("MCP verification failed:", err);
  process.exit(1);
});
