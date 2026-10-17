import { CognitiveCheckpoint } from "../domain/types.js";
import { CurrentWorkspaceState } from "../engine/diff.js";

/**
 * Seeded Demo Scenario: Invoice Filtering Investigation
 * Matches Phase 7 exact specification.
 */
export function getSeededCheckpoint(): CognitiveCheckpoint {
  return {
    checkpoint_id: "cp-invoice-001",
    thread_id: "thread-invoice-filtering",
    actor_id: "developer-alex",
    created_at: "2026-10-17T14:00:00.000Z",
    goal: {
      text: "Fix invoice filtering by status on the customer billing dashboard",
      success_criteria: [
        "Filter dropdown displays correct invoice subsets when 'PAID' or 'PENDING' is selected",
        "Zero regressions in existing invoice pagination"
      ],
      evidence_ids: ["ev-api-01"]
    },
    state_summary:
      "Investigated bug where selecting 'Paid' in invoice filter returns 0 items. Verified backend endpoint returns expected data. Isolated suspect to frontend filter mapping.",
    work_context: {
      project_name: "billing-dashboard",
      workspace_root: "/workspace/billing-dashboard",
      branch: "fix/invoice-filter-mapping",
      active_file: "components/InvoiceFilter.tsx",
      environment_details: {
        node: "25.9.0",
        framework: "React 19"
      }
    },
    evidence: [
      {
        id: "ev-api-01",
        type: "api_response",
        source: "GET /api/v1/invoices?status=paid",
        content: "HTTP 200: Returns 15 invoices matching status 'PAID'",
        captured_at: "2026-10-17T13:45:00.000Z",
        epistemic_status: "observed"
      },
      {
        id: "ev-be-02",
        type: "code_snippet",
        source: "services/invoice.ts:45",
        content: "Backend query serializer normalizes query param to uppercase enum InvoiceStatus.PAID",
        captured_at: "2026-10-17T13:48:00.000Z",
        epistemic_status: "observed"
      },
      {
        id: "ev-fe-03",
        type: "file_hash",
        source: "components/InvoiceFilter.tsx",
        content: "hash:sha256-a1b2c3d4e5",
        captured_at: "2026-10-17T13:52:00.000Z",
        epistemic_status: "observed"
      }
    ],
    attempts: [
      {
        id: "att-01",
        description: "Tested backend /api/v1/invoices endpoint directly with curl",
        status: "succeeded",
        timestamp: "2026-10-17T13:45:00.000Z",
        learnings: "API returns expected records; backend database query is healthy",
        evidence_ids: ["ev-api-01"]
      },
      {
        id: "att-02",
        description: "Verified database query index for invoice status field",
        status: "succeeded",
        timestamp: "2026-10-17T13:48:00.000Z",
        learnings: "Index scans correctly, no slow queries",
        evidence_ids: ["ev-be-02"]
      }
    ],
    decisions: [
      {
        id: "dec-01",
        description: "Backend service is not responsible for the invoice filtering failure",
        rationale: "Direct API verification proves server returns 15 valid records for status=paid",
        status: "active",
        assumptions: ["asm-fe-mapping"],
        evidence_ids: ["ev-api-01", "ev-be-02"]
      }
    ],
    artifacts: [
      {
        id: "art-fe-filter",
        path_or_uri: "components/InvoiceFilter.tsx",
        type: "code",
        version_or_hash: "v1.0.0-hash-a1b2c3d4",
        summary: "Frontend status filter dropdown and reducer mapping",
        last_modified: "2026-10-17T13:52:00.000Z"
      },
      {
        id: "art-be-service",
        path_or_uri: "services/invoice.ts",
        type: "code",
        version_or_hash: "v2.4.1-hash-f9e8d7c6",
        summary: "Backend invoice controller and repository query builder",
        last_modified: "2026-10-17T12:00:00.000Z"
      }
    ],
    assumptions: [
      {
        id: "asm-fe-mapping",
        statement: "Frontend mapping in components/InvoiceFilter.tsx expects uppercase 'PAID' string",
        status: "active",
        target_artifact_id: "art-fe-filter",
        evidence_ids: ["ev-fe-03"]
      }
    ],
    blockers: [
      {
        id: "blk-01",
        description: "Customer dashboard UI displays 0 invoices when user selects 'Paid' filter",
        severity: "high",
        open_questions: ["Does InvoiceFilter dropdown dispatch lowercase or uppercase status value?"],
        evidence_ids: ["ev-api-01"]
      }
    ],
    open_questions: [
      "Why did the dashboard filter begin failing after yesterday's UI package release?"
    ],
    next_actions: [
      {
        id: "na-01",
        description: "Inspect frontend filter mapping in components/InvoiceFilter.tsx",
        priority: "immediate",
        rationale: "Backend is confirmed working; the UI component mapping is the next link in the chain",
        target_artifact: "components/InvoiceFilter.tsx",
        evidence_ids: ["ev-api-01", "ev-fe-03"]
      }
    ],
    uncertainties: []
  };
}

/**
 * Returns current workspace state AFTER the interruption:
 * components/InvoiceFilter.tsx was modified while away (e.g. teammate commit or local edit)
 */
export function getInterruptedWorkspaceState(): CurrentWorkspaceState {
  return {
    timestamp: "2026-10-17T15:30:00.000Z",
    git_branch: "fix/invoice-filter-mapping",
    git_status: "M components/InvoiceFilter.tsx",
    artifacts: [
      {
        id: "art-fe-filter",
        path_or_uri: "components/InvoiceFilter.tsx",
        type: "code",
        version_or_hash: "v1.1.0-hash-e5f6g7h8", // Changed version!
        summary: "Frontend status filter dropdown modified by teammate commit",
        last_modified: "2026-10-17T15:20:00.000Z"
      },
      {
        id: "art-be-service",
        path_or_uri: "services/invoice.ts",
        type: "code",
        version_or_hash: "v2.4.1-hash-f9e8d7c6", // Unchanged
        summary: "Backend invoice controller and repository query builder",
        last_modified: "2026-10-17T12:00:00.000Z"
      }
    ],
    evidence: [
      {
        id: "ev-diff-04",
        type: "git_status",
        source: "components/InvoiceFilter.tsx",
        content: "Git diff: Teammate commit changed filter status value mapping to lowercase 'paid'",
        captured_at: "2026-10-17T15:25:00.000Z",
        epistemic_status: "observed",
        metadata: {
          invalidates_assumption_id: "asm-fe-mapping"
        }
      }
    ],
    uncertainties: []
  };
}

/**
 * Returns workspace state if NO changes happened during interruption.
 */
export function getUnchangedWorkspaceState(): CurrentWorkspaceState {
  const cp = getSeededCheckpoint();
  return {
    timestamp: "2026-10-17T14:30:00.000Z",
    git_branch: cp.work_context.branch,
    git_status: "clean",
    artifacts: cp.artifacts,
    evidence: [],
    uncertainties: []
  };
}
