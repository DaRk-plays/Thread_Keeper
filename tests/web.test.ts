import { describe, it, expect, beforeAll, afterAll } from "vitest";
import http from "node:http";
import { createServer } from "../src/web/server.js";

describe("Web Server & REST Runtime Verification (Gate 1)", () => {
  let server: http.Server;
  let baseUrl: string;

  beforeAll(async () => {
    const { app } = createServer();
    server = await new Promise<http.Server>((resolve) => {
      const s = app.listen(0, "127.0.0.1", () => resolve(s));
    });
    const addr = server.address() as { port: number };
    baseUrl = `http://127.0.0.1:${addr.port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it("serves the root Visual Continuity Console HTML", async () => {
    const res = await fetch(`${baseUrl}/`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("ThreadKeeper");
    expect(html).toContain("Visual Continuity Console");
  });

  it("serves required static assets (style.css and app.js)", async () => {
    const cssRes = await fetch(`${baseUrl}/style.css`);
    expect(cssRes.status).toBe(200);
    expect(await cssRes.text()).toContain(":root");

    const jsRes = await fetch(`${baseUrl}/app.js`);
    expect(jsRes.status).toBe(200);
    expect(await jsRes.text()).toContain("Visual Continuity Console");
  });

  it("responds to /api/health with healthy status and metadata", async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("healthy");
    expect(data.service).toBe("ThreadKeeper");
  });

  it("parks a checkpoint and retrieves it via REST API", async () => {
    const parkRes = await fetch(`${baseUrl}/api/scenario/load-seeded`, { method: "POST" });
    expect(parkRes.status).toBe(200);
    const parkData = await parkRes.json();
    expect(parkData.status).toBe("success");
    expect(parkData.checkpoint.checkpoint_id).toBe("cp-invoice-001");

    const getRes = await fetch(`${baseUrl}/api/checkpoint/thread-invoice-filtering`);
    expect(getRes.status).toBe(200);
    const getData = await getRes.json();
    expect(getData.checkpoint.goal.text).toContain("Fix invoice filtering");
  });

  it("simulates interruption, executes resume, returns Continuity Diff and grounded next action", async () => {
    const resumeRes = await fetch(`${baseUrl}/api/scenario/simulate-interruption`, { method: "POST" });
    expect(resumeRes.status).toBe(200);
    const data = await resumeRes.json();
    expect(data.status).toBe("success");

    const brief = data.brief;
    expect(brief.voice_summary).toContain("Fix invoice filtering");
    expect(brief.voice_summary).toContain("stale");
    expect(brief.continuity_diff.changed.length).toBe(1);
    expect(brief.continuity_diff.stale_assumptions.length).toBe(1);
    expect(brief.grounded_next_action.evidence_ids).toContain("ev-diff-04");
  });

  it("exports a lossless agent handoff packet via REST API", async () => {
    const res = await fetch(`${baseUrl}/api/handoff/thread-invoice-filtering`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.handoff.format_version).toBe("1.0.0");
    expect(data.handoff.objective).toContain("Fix invoice filtering");
  });

  it("handles Alexa+ conversational commands via /api/alexa/command", async () => {
    const res = await fetch(`${baseUrl}/api/alexa/command`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command: "Alexa, where was I?", threadId: "thread-invoice-filtering" })
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("success");
    expect(data.response.intent).toBe("where_was_i");
    expect(data.response.spoken_response).toBeDefined();
    expect(data.response.badges).toBeInstanceOf(Array);
  });

  it("queries demo fixture status via /api/demo/status", async () => {
    const res = await fetch(`${baseUrl}/api/demo/status`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("success");
  });
});
