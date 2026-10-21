/**
 * Custom domain error hierarchy for ThreadKeeper
 */
export class ThreadKeeperError extends Error {
  constructor(message: string, public readonly code: string, public readonly details?: unknown) {
    super(message);
    this.name = "ThreadKeeperError";
  }
}

export class ValidationError extends ThreadKeeperError {
  constructor(message: string, details?: unknown) {
    super(message, "VALIDATION_ERROR", details);
    this.name = "ValidationError";
  }
}

export class CheckpointNotFoundError extends ThreadKeeperError {
  constructor(identifier: string) {
    super(`Checkpoint not found: ${identifier}`, "CHECKPOINT_NOT_FOUND", { identifier });
    this.name = "CheckpointNotFoundError";
  }
}

export class InvalidEvidenceReferenceError extends ThreadKeeperError {
  constructor(evidenceId: string, context: string) {
    super(
      `Referenced evidence ID '${evidenceId}' does not exist in checkpoint context: ${context}`,
      "INVALID_EVIDENCE_REFERENCE",
      { evidenceId, context }
    );
    this.name = "InvalidEvidenceReferenceError";
  }
}

export class ProviderUnavailableError extends ThreadKeeperError {
  constructor(providerName: string, reason: string) {
    super(`Provider '${providerName}' is currently unavailable: ${reason}`, "PROVIDER_UNAVAILABLE", {
      providerName,
      reason
    });
    this.name = "ProviderUnavailableError";
  }
}

export class GroundingValidationError extends ThreadKeeperError {
  constructor(message: string, details?: unknown) {
    super(message, "GROUNDING_VALIDATION_ERROR", details);
    this.name = "GroundingValidationError";
  }
}

export class ModelInvocationError extends ThreadKeeperError {
  constructor(message: string, details?: unknown) {
    super(message, "MODEL_INVOCATION_ERROR", details);
    this.name = "ModelInvocationError";
  }
}

export class ModelConfigurationError extends ThreadKeeperError {
  constructor(message: string, details?: unknown) {
    super(message, "MODEL_CONFIGURATION_ERROR", details);
    this.name = "ModelConfigurationError";
  }
}

export class MemoryConfigurationError extends ThreadKeeperError {
  constructor(message: string, details?: unknown) {
    super(message, "MEMORY_CONFIGURATION_ERROR", details);
    this.name = "MemoryConfigurationError";
  }
}

export class MemoryOperationError extends ThreadKeeperError {
  constructor(message: string, details?: unknown) {
    super(message, "MEMORY_OPERATION_ERROR", details);
    this.name = "MemoryOperationError";
  }
}
