/**
 * ExecutionTracer
 *
 * Manages the hierarchical execution graph for a single Core invocation.
 * Enforces the invariants required by agentics-execution-engine:
 *
 *   Core
 *     └── Repo (one per invoked external repository)
 *         └── Agent (at least one per repo, returned by the repo)
 *
 * If any level is missing, the execution is treated as invalid
 * and the Core span is marked FAILED — but the full graph is still returned.
 */

import { randomUUID } from 'node:crypto';
import type {
  ExecutionSpan,
  ExecutionGraph,
  CoreExecutionResult,
  ExecutionArtifact,
  EvidenceReference,
  SpanStatus,
  InvocationContext,
  RepoExecutionResult,
} from './types.js';

export class ExecutionTracer {
  private readonly spans: ExecutionSpan[] = [];
  private readonly causalOrder: string[] = [];
  private readonly _coreSpanId: string;
  private readonly _coreName: string;

  constructor(coreName: string, parentSpanId: string | null) {
    this._coreName = coreName;
    this._coreSpanId = randomUUID();

    const coreSpan: ExecutionSpan = {
      span_id: this._coreSpanId,
      parent_span_id: parentSpanId,
      type: 'core',
      name: coreName,
      status: 'running',
      start_time: new Date().toISOString(),
      artifacts: [],
      evidence: [],
    };

    this.spans.push(coreSpan);
    this.causalOrder.push(this._coreSpanId);
  }

  /**
   * The span ID of the root core span.
   */
  get coreSpanId(): string {
    return this._coreSpanId;
  }

  /**
   * Create a repo-level child span under the core span.
   * Call this for every external repository invocation.
   */
  createRepoSpan(repoName: string): ExecutionSpan {
    const spanId = randomUUID();
    const span: ExecutionSpan = {
      span_id: spanId,
      parent_span_id: this._coreSpanId,
      type: 'repo',
      name: repoName,
      status: 'running',
      start_time: new Date().toISOString(),
      artifacts: [],
      evidence: [],
    };
    this.spans.push(span);
    this.causalOrder.push(spanId);
    return span;
  }

  /**
   * Build an InvocationContext to pass downstream to an invoked repo.
   * The repo uses parent_span_id to parent its own agent spans.
   */
  getInvocationContext(repoSpan: ExecutionSpan): InvocationContext {
    return { parent_span_id: repoSpan.span_id };
  }

  /**
   * Aggregate spans returned by an invoked repo into the execution graph.
   * Spans are appended without flattening, summarization, renaming, or re-parenting.
   */
  aggregateRepoResult(repoSpan: ExecutionSpan, repoResult: RepoExecutionResult): void {
    // Preserve exact parent_span_id references — do not re-parent
    for (const span of repoResult.spans) {
      this.spans.push(span);
      this.causalOrder.push(span.span_id);
    }
    void repoSpan; // used for future validation hooks
  }

  /**
   * Close a span with a terminal status.
   */
  closeSpan(spanId: string, status: SpanStatus, failureReasons?: string[]): void {
    const idx = this.spans.findIndex(s => s.span_id === spanId);
    if (idx === -1) return;

    const updated: ExecutionSpan = {
      ...this.spans[idx],
      status,
      end_time: new Date().toISOString(),
    };

    if (failureReasons && failureReasons.length > 0) {
      updated.failure_reasons = failureReasons;
    }

    this.spans[idx] = updated;
  }

  /**
   * Attach an artifact at the specified span level.
   * Artifacts should be attached at the lowest possible level.
   */
  attachArtifact(spanId: string, artifact: ExecutionArtifact): void {
    const idx = this.spans.findIndex(s => s.span_id === spanId);
    if (idx === -1) return;

    const span = this.spans[idx];
    this.spans[idx] = {
      ...span,
      artifacts: [...(span.artifacts || []), artifact],
    };
  }

  /**
   * Attach a machine-verifiable evidence reference at the specified span level.
   * Evidence must be IDs, hashes, or URIs — never inferred.
   */
  attachEvidence(spanId: string, evidence: EvidenceReference): void {
    const idx = this.spans.findIndex(s => s.span_id === spanId);
    if (idx === -1) return;

    const span = this.spans[idx];
    this.spans[idx] = {
      ...span,
      evidence: [...(span.evidence || []), evidence],
    };
  }

  /**
   * Invoke an external repo, wrapping the call in a repo-level span.
   * The callback receives an InvocationContext to pass downstream.
   * On error, the repo span is marked FAILED and the error is re-thrown.
   */
  async invokeRepo<T>(
    repoName: string,
    fn: (context: InvocationContext) => Promise<RepoExecutionResult>
  ): Promise<T | undefined> {
    const repoSpan = this.createRepoSpan(repoName);
    const context = this.getInvocationContext(repoSpan);

    try {
      const repoResult = await fn(context);
      this.aggregateRepoResult(repoSpan, repoResult);
      this.closeSpan(repoSpan.span_id, 'completed');
      return repoResult.result as T | undefined;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.closeSpan(repoSpan.span_id, 'failed', [message]);
      throw error;
    }
  }

  /**
   * Build the final CoreExecutionResult.
   * Validates all invariants and marks the core span as FAILED
   * if any are violated. The full graph is always returned.
   */
  buildResult(result?: unknown, error?: Error): CoreExecutionResult {
    const failureReasons: string[] = [];

    // ── Invariant checks (per enforcement spec) ──────────────

    // 1. Must have repo-level child spans
    const repoSpans = this.spans.filter(
      s => s.type === 'repo' && s.parent_span_id === this._coreSpanId
    );

    if (repoSpans.length === 0) {
      failureReasons.push('No repo-level child spans exist');
    }

    // 2. Each repo span must have agent-level children
    for (const repoSpan of repoSpans) {
      const agentSpans = this.spans.filter(
        s => s.type === 'agent' && s.parent_span_id === repoSpan.span_id
      );

      if (agentSpans.length === 0) {
        failureReasons.push(
          `Repo "${repoSpan.name}" (${repoSpan.span_id}) lacks agent-level child spans`
        );
      }
    }

    // 3. Check for repos that returned zero child spans
    for (const repoSpan of repoSpans) {
      const childSpans = this.spans.filter(
        s => s.parent_span_id === repoSpan.span_id
      );
      if (childSpans.length === 0) {
        failureReasons.push(
          `Invoked repo "${repoSpan.name}" returned zero spans`
        );
      }
    }

    // 4. Propagate repo-level failures
    for (const repoSpan of repoSpans) {
      if (repoSpan.status === 'failed' && repoSpan.failure_reasons) {
        for (const reason of repoSpan.failure_reasons) {
          if (!failureReasons.includes(reason)) {
            failureReasons.push(reason);
          }
        }
      }
    }

    // 5. Include execution-level error
    if (error) {
      if (!failureReasons.includes(error.message)) {
        failureReasons.push(error.message);
      }
    }

    // ── Determine final status ───────────────────────────────

    const status: SpanStatus = failureReasons.length > 0 ? 'failed' : 'completed';

    // Close core span
    this.closeSpan(
      this._coreSpanId,
      status,
      failureReasons.length > 0 ? failureReasons : undefined
    );

    // ── Build execution graph ────────────────────────────────

    const executionGraph: ExecutionGraph = {
      spans: [...this.spans],
      root_span_id: this._coreSpanId,
      causal_order: [...this.causalOrder],
    };

    return {
      core_name: this._coreName,
      execution_graph: executionGraph,
      status,
      ...(failureReasons.length > 0 ? { failure_reasons: failureReasons } : {}),
      ...(result !== undefined ? { result } : {}),
    };
  }
}
