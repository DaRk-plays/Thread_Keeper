import { describe, it, expect, beforeEach } from "vitest";
import { LocalMemoryProvider } from "../src/providers/memory.js";
import { getSeededCheckpoint } from "../src/scenario/seeded.js";

describe("LocalMemoryProvider", () => {
  let memory: LocalMemoryProvider;

  beforeEach(() => {
    memory = new LocalMemoryProvider();
  });

  it("saves and retrieves a checkpoint by ID", async () => {
    const cp = getSeededCheckpoint();
    await memory.saveCheckpoint(cp);

    const retrieved = await memory.getCheckpoint(cp.checkpoint_id);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.checkpoint_id).toBe(cp.checkpoint_id);
    expect(retrieved?.goal.text).toBe(cp.goal.text);
  });

  it("returns null when retrieving non-existent checkpoint", async () => {
    const retrieved = await memory.getCheckpoint("cp-non-existent");
    expect(retrieved).toBeNull();
  });

  it("retrieves the latest checkpoint for a thread in chronological order", async () => {
    const cp1 = getSeededCheckpoint();
    const cp2 = {
      ...getSeededCheckpoint(),
      checkpoint_id: "cp-invoice-002",
      state_summary: "Second stage of investigation"
    };

    await memory.saveCheckpoint(cp1);
    await memory.saveCheckpoint(cp2);

    const latest = await memory.getLatestCheckpoint(cp1.thread_id);
    expect(latest?.checkpoint_id).toBe("cp-invoice-002");
    expect(latest?.state_summary).toBe("Second stage of investigation");
  });

  it("lists thread history with limit ordering (most recent first)", async () => {
    const cp1 = { ...getSeededCheckpoint(), checkpoint_id: "cp-1" };
    const cp2 = { ...getSeededCheckpoint(), checkpoint_id: "cp-2" };
    const cp3 = { ...getSeededCheckpoint(), checkpoint_id: "cp-3" };

    await memory.saveCheckpoint(cp1);
    await memory.saveCheckpoint(cp2);
    await memory.saveCheckpoint(cp3);

    const history = await memory.listThreadHistory(cp1.thread_id, 2);
    expect(history.length).toBe(2);
    expect(history[0].checkpoint_id).toBe("cp-3");
    expect(history[1].checkpoint_id).toBe("cp-2");
  });

  it("searches memory by keyword across goals and decisions", async () => {
    const cp = getSeededCheckpoint();
    await memory.saveCheckpoint(cp);

    const matchGoal = await memory.searchMemory({ query_text: "invoice filtering" });
    expect(matchGoal.length).toBe(1);

    const matchDecision = await memory.searchMemory({ query_text: "backend" });
    expect(matchDecision.length).toBe(1);

    const noMatch = await memory.searchMemory({ query_text: "quantum computing" });
    expect(noMatch.length).toBe(0);
  });

  it("clears memory for a specific thread or all threads", async () => {
    const cp1 = { ...getSeededCheckpoint(), checkpoint_id: "cp-1", thread_id: "thread-a" };
    const cp2 = { ...getSeededCheckpoint(), checkpoint_id: "cp-2", thread_id: "thread-b" };

    await memory.saveCheckpoint(cp1);
    await memory.saveCheckpoint(cp2);

    await memory.clear("thread-a");
    expect(await memory.getCheckpoint("cp-1")).toBeNull();
    expect(await memory.getCheckpoint("cp-2")).not.toBeNull();

    await memory.clear();
    expect(await memory.getCheckpoint("cp-2")).toBeNull();
  });
});
