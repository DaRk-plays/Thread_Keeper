export type AlexaIntent =
  | "park_this"
  | "where_was_i"
  | "what_changed"
  | "what_should_i_do_next"
  | "why_is_that_assumption_stale"
  | "unknown";

export interface AlexaCommandRequest {
  command: string;
  threadId?: string;
  workspacePath?: string;
}

export interface ThenStateView {
  goal: string;
  checkpoint_time: string;
  relevant_decision?: string;
  active_assumption?: string;
  old_evidence_hash?: string;
  checkpoint_id: string;
}

export interface NowStateView {
  changed_artifacts: string[];
  new_evidence_hash?: string;
  stale_assumption_status: string;
  invalidation_reason?: string;
}

export interface ThreadKeeperAssessmentView {
  observed: string[];
  derived: string[];
  inferred: string[];
  unknown: string[];
}

export interface GroundedNextActionView {
  description: string;
  priority: string;
  target?: string;
  rationale?: string;
}

export interface AlexaCommandResponse {
  intent: AlexaIntent;
  spoken_response: string;
  display_title: string;
  badges: string[];
  then_state?: ThenStateView;
  now_state?: NowStateView;
  assessment?: ThreadKeeperAssessmentView;
  next_action?: GroundedNextActionView;
  thread_id?: string;
  checkpoint_id?: string;
  raw_data?: unknown;
}
