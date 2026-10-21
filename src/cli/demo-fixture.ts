import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { ContinuityEngine } from "../engine/continuity.js";
import { LocalGitWorkspaceProvider } from "../providers/workspace.js";
import { createMemoryProvider } from "../providers/memory.js";
import { createModelProvider } from "../providers/model.js";
import { AlexaDispatcher } from "../alexa/dispatcher.js";
import { AlexaCommandResponse } from "../alexa/types.js";
import { CognitiveCheckpoint } from "../domain/types.js";
import { LocalMemoryProvider } from "../providers/memory.js";

const FIXTURE_DIR = path.resolve(process.cwd(), ".demo_fixture_repo");
const STATE_FILE = path.join(FIXTURE_DIR, ".threadkeeper_state.json");
const THREAD_ID = "thread-demo-currency-validation";

export interface DemoState {
  threadId: string;
  checkpointId?: string;
  workspacePath: string;
  stage: "setup" | "parked" | "interrupted" | "resumed";
  updatedAt: string;
  checkpoint?: CognitiveCheckpoint;
}

export function saveDemoState(state: DemoState): void {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf8");
}

export function loadDemoState(): DemoState | null {
  if (!fs.existsSync(STATE_FILE)) return null;
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf8")) as DemoState;
  } catch {
    return null;
  }
}

/**
 * 1. DEMO:SETUP
 * Initializes a clean Git repository fixture in .demo_fixture_repo with payment prototype.
 */
export async function setupDemoFixture(): Promise<void> {
  console.log("=================================================");
  console.log("THREADKEEPER DEMO MODE: SETUP FIXTURE");
  console.log("=================================================");
  console.log(`Target Repository Path: ${FIXTURE_DIR}\n`);

  if (fs.existsSync(FIXTURE_DIR)) {
    fs.rmSync(FIXTURE_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(path.join(FIXTURE_DIR, "src"), { recursive: true });

  // Initialize git repository
  execFileSync("git", ["init", "-b", "main"], { cwd: FIXTURE_DIR, stdio: "ignore" });
  execFileSync("git", ["config", "user.name", "Demo Developer"], { cwd: FIXTURE_DIR, stdio: "ignore" });
  execFileSync("git", ["config", "user.email", "developer@threadkeeper.local"], { cwd: FIXTURE_DIR, stdio: "ignore" });

  // Initial code: src/payment.ts (accepts currencies without whitelist validation)
  const initialPaymentCode = `/**
 * Multi-Currency Payment Processor
 * Rapid Prototype: accepts currencies without whitelist validation.
 */
export interface PaymentRequest {
  amount: number;
  currency: string;
  recipientId: string;
}

export function processPayment(req: PaymentRequest): { success: boolean; transactionId: string } {
  // Rapid prototype: accepts any currency without whitelist validation
  console.log(\`Processing payment: \${req.amount} \${req.currency} for \${req.recipientId}\`);
  return {
    success: true,
    transactionId: \`tx-init-\${Date.now()}\`
  };
}
`;

  fs.writeFileSync(path.join(FIXTURE_DIR, ".gitignore"), ".threadkeeper_state.json\n", "utf8");
  fs.writeFileSync(path.join(FIXTURE_DIR, "src", "payment.ts"), initialPaymentCode, "utf8");
  fs.writeFileSync(
    path.join(FIXTURE_DIR, "README.md"),
    "# Multi-Currency Payment Service\nPrototype implementation of international payment gateway.\n",
    "utf8"
  );

  execFileSync("git", ["add", "."], { cwd: FIXTURE_DIR, stdio: "ignore" });
  execFileSync("git", ["commit", "-m", "feat: initial payment processor prototype"], {
    cwd: FIXTURE_DIR,
    stdio: "ignore"
  });

  const headCommit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: FIXTURE_DIR, encoding: "utf8" }).trim();

  saveDemoState({
    threadId: THREAD_ID,
    workspacePath: FIXTURE_DIR,
    stage: "setup",
    updatedAt: new Date().toISOString()
  });

  console.log(`[PASS] Demo Git fixture repository created successfully.`);
  console.log(`       Branch:      main`);
  console.log(`       Commit HEAD: ${headCommit.slice(0, 8)}`);
  console.log(`       Baseline:    src/payment.ts accepts currencies without whitelist validation`);
  console.log(`\nNext step: Run "npm run demo:park" or say "Alexa, park this."\n`);
}

/**
 * 2. DEMO:PARK
 * Captures cognitive checkpoint from real Git fixture and stores in AgentCore Memory.
 */
export async function parkDemo(): Promise<AlexaCommandResponse> {
  console.log("=================================================");
  console.log("THREADKEEPER DEMO MODE: ALEXA PARK");
  console.log("=================================================");

  const state = loadDemoState();
  if (!state) {
    throw new Error("Demo fixture not set up! Run 'npm run demo:setup' first.");
  }

  // Ensure environment variables point to cloud if configured
  if (!process.env.THREADKEEPER_MEMORY_PROVIDER && process.env.AWS_PROFILE) {
    process.env.THREADKEEPER_MEMORY_PROVIDER = "agentcore";
  }
  if (!process.env.THREADKEEPER_AGENTCORE_MEMORY_ID) {
    process.env.THREADKEEPER_AGENTCORE_MEMORY_ID = "ThreadKeeperHackathonMemory-KkM33n8BE1";
  }

  const memory = createMemoryProvider();
  const workspace = new LocalGitWorkspaceProvider();
  const engine = new ContinuityEngine({
    memoryProvider: memory,
    workspaceProvider: workspace
  });

  const dispatcher = new AlexaDispatcher({
    engine,
    memoryProvider: memory,
    workspaceProvider: workspace,
    defaultWorkspacePath: FIXTURE_DIR,
    defaultThreadId: THREAD_ID
  });

  console.log(`>>> Developer says: "Alexa, park this."\n`);
  const response = await dispatcher.execute({
    command: "Alexa, park this.",
    workspacePath: FIXTURE_DIR,
    threadId: THREAD_ID
  });

  saveDemoState({
    ...state,
    checkpointId: response.checkpoint_id,
    stage: "parked",
    updatedAt: new Date().toISOString(),
    checkpoint: response.raw_data as CognitiveCheckpoint
  });

  console.log(`🎙️ Alexa+ Spoken Response:`);
  console.log(`   "${response.spoken_response}"\n`);
  console.log(`[PASS] Checkpoint ID:    ${response.checkpoint_id}`);
  console.log(`       Memory Provider:  ${memory.name} (${response.badges.join(", ")})`);
  console.log(`       Goal:             "${response.then_state?.goal}"`);
  console.log(`       Active Decision:  "${response.then_state?.relevant_decision}"`);
  console.log(`       Active Assumption:"${response.then_state?.active_assumption}"`);
  console.log(`\nNext step: Run "npm run demo:interrupt" to simulate external modification.\n`);
  return response;
}

/**
 * 3. DEMO:INTERRUPT
 * Controlled workspace mutation: src/payment.ts changed while the developer was away.
 */
export async function interruptDemo(): Promise<void> {
  console.log("=================================================");
  console.log("THREADKEEPER DEMO MODE: CONTROLLED INTERRUPTION");
  console.log("=================================================");

  const state = loadDemoState();
  if (!state) {
    throw new Error("Demo fixture not set up! Run 'npm run demo:setup' first.");
  }

  // src/payment.ts changed while the developer was away
  const modifiedPaymentCode = `/**
 * Multi-Currency Payment Processor
 * Note: src/payment.ts changed while the developer was away.
 */
export interface PaymentRequest {
  amount: number;
  currency: string;
  recipientId: string;
}

const ALLOWED_CURRENCIES = ["USD", "EUR", "GBP"];

export function processPayment(req: PaymentRequest): { success: boolean; transactionId: string } {
  if (!ALLOWED_CURRENCIES.includes(req.currency)) {
    throw new Error(\`Unsupported currency: \${req.currency}\`);
  }
  console.log(\`Processing validated payment: \${req.amount} \${req.currency} for \${req.recipientId}\`);
  return {
    success: true,
    transactionId: \`tx-modified-\${Date.now()}\`
  };
}
`;

  fs.writeFileSync(path.join(FIXTURE_DIR, "src", "payment.ts"), modifiedPaymentCode, "utf8");

  saveDemoState({
    ...state,
    stage: "interrupted",
    updatedAt: new Date().toISOString()
  });

  console.log(`⚡ [INTERRUPTION APPLIED]`);
  console.log(`   File modified while away: .demo_fixture_repo/src/payment.ts`);
  console.log(`   New code introduced currency whitelist: ["USD", "EUR", "GBP"]`);
  console.log(`   Local Git working tree is now DIRTY.`);
  console.log(`\nNext step: Run "npm run demo:resume" or ask "Alexa, where was I?"\n`);
}

/**
 * 4. DEMO:RESUME
 * Fresh process starts: pulls checkpoint from cloud memory, diffs workspace, calls Bedrock.
 */
export async function resumeDemo(): Promise<AlexaCommandResponse> {
  console.log("=================================================");
  console.log("THREADKEEPER DEMO MODE: ALEXA RESUME");
  console.log("=================================================");

  const state = loadDemoState();
  if (!state || !state.checkpointId) {
    throw new Error("Demo fixture not parked! Run 'npm run demo:setup' then 'npm run demo:park'.");
  }

  if (!process.env.THREADKEEPER_MEMORY_PROVIDER && process.env.AWS_PROFILE) {
    process.env.THREADKEEPER_MEMORY_PROVIDER = "agentcore";
  }
  if (!process.env.THREADKEEPER_MODEL_PROVIDER && process.env.AWS_PROFILE) {
    process.env.THREADKEEPER_MODEL_PROVIDER = "bedrock";
  }
  if (!process.env.THREADKEEPER_AGENTCORE_MEMORY_ID) {
    process.env.THREADKEEPER_AGENTCORE_MEMORY_ID = "ThreadKeeperHackathonMemory-KkM33n8BE1";
  }

  const memory = createMemoryProvider();
  if (memory instanceof LocalMemoryProvider && state.checkpoint) {
    await memory.saveCheckpoint(state.checkpoint);
  }
  const model = createModelProvider();
  const workspace = new LocalGitWorkspaceProvider();

  const engine = new ContinuityEngine({
    memoryProvider: memory,
    modelProvider: model,
    workspaceProvider: workspace
  });

  const dispatcher = new AlexaDispatcher({
    engine,
    memoryProvider: memory,
    workspaceProvider: workspace,
    defaultWorkspacePath: FIXTURE_DIR,
    defaultThreadId: THREAD_ID
  });

  console.log(`>>> Developer returns after interruption and asks:`);
  console.log(`    "Alexa, where was I?"\n`);

  const t0 = Date.now();
  const response = await dispatcher.execute({
    command: "Alexa, where was I?",
    workspacePath: FIXTURE_DIR,
    threadId: THREAD_ID
  });
  const totalLatency = Date.now() - t0;

  saveDemoState({
    ...state,
    stage: "resumed",
    updatedAt: new Date().toISOString()
  });

  console.log("🎙️ Alexa+ Judge-Ready Spoken Brief:");
  console.log("-------------------------------------------------");
  console.log(response.spoken_response);
  console.log("-------------------------------------------------\n");

  console.log("📊 VISUAL CONTINUITY CONSOLE (THEN VS NOW):");
  console.log("-------------------------------------------------");
  console.log(`[THEN] Checkpoint:    ${response.then_state?.checkpoint_id}`);
  console.log(`       Goal:          ${response.then_state?.goal}`);
  console.log(`       Decision:      ${response.then_state?.relevant_decision}`);
  console.log(`       Assumption:    ${response.then_state?.active_assumption}`);
  console.log(`       Old Hash:      ${response.then_state?.old_evidence_hash?.slice(0, 16)}...`);
  console.log("");
  console.log(`[NOW]  Changed Files: ${response.now_state?.changed_artifacts.join(", ")}`);
  console.log(`       New Hash:      ${response.now_state?.new_evidence_hash?.slice(0, 16)}...`);
  console.log(`       Status:        ${response.now_state?.stale_assumption_status}`);
  console.log("");
  console.log(`[THREADKEEPER ASSESSMENT]`);
  console.log(`       Observed:      ${response.assessment?.observed[0]}`);
  console.log(`       Derived:       ${response.assessment?.derived[0]}`);
  console.log(`       Inferred:      ${response.assessment?.inferred[0]}`);
  console.log(`       Unknown:       ${response.assessment?.unknown[0]}`);
  console.log("");
  console.log(`[RECOMMENDED NEXT ACTION]`);
  console.log(`       ${response.next_action?.description}`);
  console.log(`       Priority:      ${response.next_action?.priority.toUpperCase()}`);
  console.log(`       Rationale:     ${response.next_action?.rationale}`);
  console.log("-------------------------------------------------");
  console.log(`Badges:   [${response.badges.join("] [")}]`);
  console.log(`Latency:  ${totalLatency} ms\n`);
  return response;
}

async function main(): Promise<void> {
  const command = process.argv[2];

  switch (command) {
    case "setup":
      await setupDemoFixture();
      break;
    case "park":
      await parkDemo();
      break;
    case "interrupt":
      await interruptDemo();
      break;
    case "resume":
      await resumeDemo();
      break;
    default:
      console.log(`Usage: node demo-fixture.js [setup | park | interrupt | resume]`);
      process.exit(1);
  }
}

if (process.argv[1] && process.argv[1].endsWith("demo-fixture.js")) {
  main().catch((err) => {
    console.error("\n[DEMO ERROR]:", err);
    process.exit(1);
  });
}
