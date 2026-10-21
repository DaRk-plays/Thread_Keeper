import { z } from "zod";
import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import {
  ModelConfigurationError,
  ModelInvocationError,
  ThreadKeeperError,
  ValidationError
} from "../domain/errors.js";

export interface StructuredModelRequest<T> {
  systemPrompt: string;
  userPrompt: string;
  schema: z.ZodType<T>;
  temperature?: number;
  metadata?: Record<string, unknown>;
}

export interface ModelUsageMetadata {
  modelId: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  latencyMs?: number;
}

/**
 * Vendor-independent ModelProvider abstraction.
 * Allows switching between Bedrock, deterministic fixtures, or alternative providers
 * without altering Continuity Engine logic.
 */
export interface ModelProvider {
  readonly name: string;
  lastUsage?: ModelUsageMetadata;
  generateStructured<T>(request: StructuredModelRequest<T>): Promise<T>;
}

/**
 * Deterministic local fixture model provider.
 * Supports zero-cost, offline testing without cloud or LLM dependencies.
 */
export class FixtureModelProvider implements ModelProvider {
  readonly name = "fixture-local";
  private customHandlers: Map<string, (prompt: string) => unknown> = new Map();

  /**
   * Register a custom fixture handler keyed by pattern match
   */
  registerHandler(keyPattern: string, handler: (prompt: string) => unknown): void {
    this.customHandlers.set(keyPattern, handler);
  }

  async generateStructured<T>(request: StructuredModelRequest<T>): Promise<T> {
    // Check if custom handler matches userPrompt
    for (const [pattern, handler] of this.customHandlers.entries()) {
      if (request.userPrompt.includes(pattern)) {
        const raw = handler(request.userPrompt);
        const parsed = request.schema.safeParse(raw);
        if (!parsed.success) {
          throw new ValidationError(
            `Fixture model response failed schema validation for pattern '${pattern}'`,
            parsed.error.format()
          );
        }
        return parsed.data;
      }
    }

    // Default heuristic: If schema has default shape or fallback
    throw new ValidationError(
      "No deterministic fixture handler registered for prompt: " + request.userPrompt.slice(0, 100)
    );
  }
}

export interface BedrockModelProviderOptions {
  modelId?: string;
  region?: string;
  profile?: string;
  maxTokens?: number;
  temperature?: number;
  client?: BedrockRuntimeClient;
}

/**
 * Amazon Bedrock Model Provider using the Bedrock Converse API.
 * Connects to Amazon Nova Lite (amazon.nova-lite-v1:0) in ap-southeast-2.
 */
export class BedrockModelProvider implements ModelProvider {
  readonly name = "bedrock";
  readonly modelId: string;
  readonly region: string;
  readonly profile: string;
  readonly maxTokens: number;
  readonly temperature: number;

  lastUsage?: ModelUsageMetadata;
  private client?: BedrockRuntimeClient;

  constructor(options?: BedrockModelProviderOptions) {
    this.modelId = options?.modelId || "amazon.nova-lite-v1:0";
    this.region = options?.region || process.env.AWS_REGION || "ap-southeast-2";
    this.profile = options?.profile || process.env.AWS_PROFILE || "threadkeeper";
    this.maxTokens = options?.maxTokens ?? 300;
    this.temperature = options?.temperature ?? 0.0;
    this.client = options?.client;
  }

  private getClient(): BedrockRuntimeClient {
    if (this.client) {
      return this.client;
    }
    try {
      this.client = new BedrockRuntimeClient({
        region: this.region,
        profile: this.profile
      });
      return this.client;
    } catch (err) {
      throw new ModelConfigurationError(
        `Failed to initialize AWS Bedrock client for region '${this.region}' and profile '${this.profile}': ${(err as Error).message}`,
        err
      );
    }
  }

  async generateStructured<T>(request: StructuredModelRequest<T>): Promise<T> {
    try {
      const client = this.getClient();
      const command = new ConverseCommand({
        modelId: this.modelId,
        messages: [
          {
            role: "user",
            content: [{ text: request.userPrompt }]
          }
        ],
        system: request.systemPrompt ? [{ text: request.systemPrompt }] : undefined,
        inferenceConfig: {
          maxTokens: this.maxTokens,
          temperature: request.temperature ?? this.temperature
        }
      });

      const response = await client.send(command);

      this.lastUsage = {
        modelId: this.modelId,
        inputTokens: response.usage?.inputTokens ?? 0,
        outputTokens: response.usage?.outputTokens ?? 0,
        totalTokens: response.usage?.totalTokens ?? 0,
        latencyMs: response.metrics?.latencyMs
      };

      const rawText = response.output?.message?.content?.[0]?.text;
      if (!rawText) {
        throw new ModelInvocationError("Bedrock Converse returned an empty text payload");
      }

      const cleanJson = extractJsonText(rawText);
      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(cleanJson);
      } catch (parseErr) {
        throw new ModelInvocationError(
          `Bedrock Converse output is not valid JSON: ${(parseErr as Error).message}`,
          { rawText }
        );
      }

      const result = request.schema.safeParse(parsedJson);
      if (!result.success) {
        throw new ValidationError(
          `Bedrock response failed schema validation: ${result.error.message}`,
          result.error.format()
        );
      }

      return result.data;
    } catch (err) {
      if (err instanceof ThreadKeeperError) {
        throw err;
      }
      throw new ModelInvocationError(
        `Bedrock invocation failed: ${(err as Error).message}`,
        err
      );
    }
  }
}

/**
 * Strips markdown code block wrappers (e.g. ```json ... ```) from model output
 */
export function extractJsonText(text: string): string {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (match && match[1]) {
    return match[1].trim();
  }
  return text.trim();
}

export interface CreateModelProviderOptions extends BedrockModelProviderOptions {
  provider?: "local" | "bedrock" | string;
}

/**
 * Explicit Model Provider Factory
 * Provider selection must be explicit via options.provider or THREADKEEPER_MODEL_PROVIDER.
 * Default is always "local". Having AWS credentials present NEVER silently triggers Bedrock calls.
 */
export function createModelProvider(options?: CreateModelProviderOptions): ModelProvider {
  const providerType = (
    options?.provider ||
    process.env.THREADKEEPER_MODEL_PROVIDER ||
    "local"
  ).toLowerCase();

  if (providerType === "local") {
    return new FixtureModelProvider();
  }

  if (providerType === "bedrock") {
    return new BedrockModelProvider(options);
  }

  throw new ModelConfigurationError(
    `Unsupported model provider: '${providerType}'. Supported providers are 'local' and 'bedrock'.`
  );
}
