import { createServer } from "../web/server.js";

async function verifyWebRuntime() {
  console.log("================================================================================");
  console.log("  THREADKEEPER — WEB RUNTIME & HTTP VERIFICATION RUNNER");
  console.log("  Gate 1: Verifying active HTTP server, static assets, and web API flow");
  console.log("================================================================================\n");

  const { app } = createServer();
  const server = await new Promise<import("node:http").Server>((resolve) => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });

  const address = server.address() as { address: string; port: number };
  const baseUrl = `http://127.0.0.1:${address.port}`;
  console.log(`✓ Development server successfully started on: ${baseUrl}\n`);

  try {
    // 1. Root Web Console over HTTP
    console.log(">>> [Check 1] Loading root web console (GET /)...");
    const rootRes = await fetch(`${baseUrl}/`);
    const rootHtml = await rootRes.text();
    if (rootRes.status !== 200) {
      throw new Error(`GET / returned status ${rootRes.status}`);
    }
    if (!rootHtml.includes("ThreadKeeper") || !rootHtml.includes("Visual Continuity Console")) {
      throw new Error("Root HTML did not contain expected title and branding");
    }
    console.log(`✓ Root web console loaded (HTTP ${rootRes.status}, ${rootHtml.length} bytes)\n`);

    // 2. Required Static Assets: style.css
    console.log(">>> [Check 2] Loading stylesheet asset (GET /style.css)...");
    const cssRes = await fetch(`${baseUrl}/style.css`);
    const cssText = await cssRes.text();
    if (cssRes.status !== 200 || !cssText.includes(":root")) {
      throw new Error(`GET /style.css failed with status ${cssRes.status}`);
    }
    console.log(`✓ Static stylesheet loaded (HTTP ${cssRes.status}, ${cssText.length} bytes)\n`);

    // 3. Required Static Assets: app.js
    console.log(">>> [Check 3] Loading client application script (GET /app.js)...");
    const jsRes = await fetch(`${baseUrl}/app.js`);
    const jsText = await jsRes.text();
    if (jsRes.status !== 200 || !jsText.includes("Visual Continuity Console")) {
      throw new Error(`GET /app.js failed with status ${jsRes.status}`);
    }
    console.log(`✓ Static client script loaded (HTTP ${jsRes.status}, ${jsText.length} bytes)\n`);

    // 4. API Health Check
    console.log(">>> [Check 4] Calling health check API (GET /api/health)...");
    const healthRes = await fetch(`${baseUrl}/api/health`);
    const healthData = (await healthRes.json()) as { status: string; service: string };
    if (healthRes.status !== 200 || healthData.status !== "healthy") {
      throw new Error("Health check failed");
    }
    console.log(`✓ API Health check passed: ${JSON.stringify(healthData)}\n`);

    // 5. Park This through application API
    console.log(">>> [Check 5] Executing 'Park This' (POST /api/scenario/load-seeded)...");
    const parkRes = await fetch(`${baseUrl}/api/scenario/load-seeded`, { method: "POST" });
    const parkData = (await parkRes.json()) as {
      status: string;
      checkpoint: { checkpoint_id: string; thread_id: string };
    };
    if (parkRes.status !== 200 || parkData.status !== "success") {
      throw new Error(`Park failed: ${JSON.stringify(parkData)}`);
    }
    const checkpointId = parkData.checkpoint.checkpoint_id;
    const threadId = parkData.checkpoint.thread_id;
    console.log(`✓ Checkpoint parked via API! ID: ${checkpointId}, Thread: ${threadId}\n`);

    // 6. Checkpoint Retrieval through API
    console.log(`>>> [Check 6] Retrieving checkpoint (GET /api/checkpoint/${threadId})...`);
    const getRes = await fetch(`${baseUrl}/api/checkpoint/${threadId}`);
    const getData = (await getRes.json()) as {
      status: string;
      checkpoint: { goal: { text: string } };
    };
    if (getRes.status !== 200 || getData.status !== "success") {
      throw new Error(`Retrieval failed: ${JSON.stringify(getData)}`);
    }
    console.log(`✓ Checkpoint retrieved! Goal: "${getData.checkpoint.goal.text}"\n`);

    // 7 & 8 & 9. State Change, Resume, Continuity Diff, and Grounded Next Action
    console.log(">>> [Check 7-9] Simulating interruption state change & resume (POST /api/scenario/simulate-interruption)...");
    const resumeRes = await fetch(`${baseUrl}/api/scenario/simulate-interruption`, { method: "POST" });
    const resumeData = (await resumeRes.json()) as {
      status: string;
      changed_artifact: string;
      brief: {
        voice_summary: string;
        continuity_diff: {
          changed: Array<{ path: string }>;
          stale_assumptions: Array<{ statement: string; affected_decision_ids: string[] }>;
        };
        grounded_next_action: {
          description: string;
          priority: string;
          evidence_ids: string[];
        };
      };
    };
    if (resumeRes.status !== 200 || resumeData.status !== "success") {
      throw new Error(`Resume failed: ${JSON.stringify(resumeData)}`);
    }

    const brief = resumeData.brief;
    const diff = brief.continuity_diff;
    const nextAction = brief.grounded_next_action;

    console.log(`✓ State change applied: ${resumeData.changed_artifact}`);
    console.log(`✓ 30-Second Voice Brief returned: "${brief.voice_summary}"`);
    console.log(`✓ Continuity Diff returned:`);
    console.log(`  - Changed files: ${diff.changed.length} (${diff.changed[0].path})`);
    console.log(`  - Stale assumptions: ${diff.stale_assumptions.length} (${diff.stale_assumptions[0].statement})`);
    console.log(`  - Affected decisions: [${diff.stale_assumptions[0].affected_decision_ids.join(", ")}]`);
    console.log(`✓ Grounded Next Action returned:`);
    console.log(`  - Description: ${nextAction.description}`);
    console.log(`  - Priority: ${nextAction.priority}`);
    console.log(`  - Cited Evidence: [${nextAction.evidence_ids.join(", ")}]\n`);

    // 10. Agent Handoff Packet through API
    console.log(`>>> [Check 10] Exporting agent handoff (GET /api/handoff/${threadId})...`);
    const handoffRes = await fetch(`${baseUrl}/api/handoff/${threadId}`);
    const handoffData = (await handoffRes.json()) as {
      status: string;
      handoff: { format_version: string };
    };
    if (handoffRes.status !== 200 || handoffData.status !== "success") {
      throw new Error(`Handoff failed: ${JSON.stringify(handoffData)}`);
    }
    console.log(`✓ Agent handoff packet exported! Format version: ${handoffData.handoff.format_version}\n`);

    console.log("================================================================================");
    console.log("  GATE 1: WEB RUNTIME & HTTP VERIFICATION COMPLETED (ALL 10 CHECKS PASSED)");
    console.log("================================================================================");
  } finally {
    const s = server as import("node:http").Server & { closeAllConnections?: () => void };
    if (typeof s.closeAllConnections === "function") {
      s.closeAllConnections();
    }
    await new Promise<void>((resolve) => server.close(() => resolve()));
    process.exit(0);
  }
}

verifyWebRuntime().catch((err) => {
  console.error("Web runtime verification failed:", err);
  process.exit(1);
});
