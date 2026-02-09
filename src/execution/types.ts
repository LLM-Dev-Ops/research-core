/**
 * Execution Span Types for Agentics Execution Engine
 *
 * Defines the hierarchical execution graph contract:
 *   Core (this repo)
 *     └── Repo (invoked external repository)
 *         └── Agent (executed within the repo)
 *
 * All types conform to the ExecutionGraph / CoreExecutionResult
 * contract defined by agentics-execution-engine.
 */

/**
 * Span hierarchy levels.
 * Every valid execution graph must contain all three levels.
 */
export type SpanType = 'core' | 'repo' | 'agent';

/**
 * Terminal status of a span.
 */
export type SpanStatus = 'running' | 'completed' | 'failed';

/**
 * A single execution span in the hierarchical graph.
 * Parent-child relationships are encoded via parent_span_id.
 */
export interface ExecutionSpan {
  span_id: string;
  parent_span_id: string | null;
  type: SpanType;
  name: string;
  status: SpanStatus;
  start_time: string;
  end_time?: string;
  metadata?: Record<string, unknown>;
  artifacts?: ExecutionArtifact[];
  evidence?: EvidenceReference[];
  failure_reasons?: string[];
}

/**
 * An artifact attached to a span.
 * Must be attached at the lowest possible span level (agent > repo > core).
 * Must include a stable identifier or reference.
 */
export interface ExecutionArtifact {
  artifact_id: string;
  type: string;
  reference: string;
  metadata?: Record<string, unknown>;
}

/**
 * A machine-verifiable evidence reference attached to the span that produced it.
 * Must be an ID, hash, or URI — never inferred or synthesized.
 */
export interface EvidenceReference {
  evidence_id: string;
  type: 'id' | 'hash' | 'uri';
  value: string;
  description?: string;
}

/**
 * The full hierarchical, append-only execution graph.
 * Preserves causal ordering via parent_span_id and causal_order array.
 * JSON-serializable without loss of structure.
 */
export interface ExecutionGraph {
  spans: ExecutionSpan[];
  root_span_id: string;
  causal_order: string[];
}

/**
 * The top-level result returned by the Core.
 * Returned on success, partial failure, and total failure.
 */
export interface CoreExecutionResult {
  core_name: string;
  execution_graph: ExecutionGraph;
  status: SpanStatus;
  failure_reasons?: string[];
  result?: unknown;
}

/**
 * Context passed downstream to invoked repos so they can
 * parent their agent spans under the correct repo span.
 */
export interface InvocationContext {
  parent_span_id: string;
}

/**
 * What an invoked repo returns: its own execution spans
 * (must include at least one agent-level span) plus an optional result.
 */
export interface RepoExecutionResult {
  spans: ExecutionSpan[];
  result?: unknown;
}
