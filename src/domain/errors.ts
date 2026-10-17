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
