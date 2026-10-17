import { z } from "zod";
import { ValidationError } from "../domain/errors.js";

export interface StructuredModelRequest<T> {
  systemPrompt: string;
  userPrompt: string;
  schema: z.ZodType<T>;
  temperature?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Vendor-independent ModelProvider abstraction.
 * Allows switching between Bedrock, deterministic fixtures, or alternative providers
 * without altering Continuity Engine logic.
 */
export interface ModelProvider {
  readonly name: string;
  generateStructured<T>(request: StructuredModelRequest<T>): Promise<T>;
}

/**
 * Deterministic local fixture model provider for Foundation Milestone 1.
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
