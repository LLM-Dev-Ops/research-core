/**
 * Span Utilities
 *
 * Helper functions for creating and finalizing execution spans.
 * Used by this Core and by invoked repos to construct their own spans.
 */

import { randomUUID } from 'node:crypto';
import type { ExecutionSpan, SpanType, SpanStatus } from './types.js';

/**
 * Generate a new unique span ID (UUID v4).
 */
export function generateSpanId(): string {
  return randomUUID();
}

/**
 * Create a new execution span in 'running' status.
 */
export function createSpan(
  type: SpanType,
  name: string,
  parentSpanId: string | null,
  spanId?: string
): ExecutionSpan {
  return {
    span_id: spanId ?? randomUUID(),
    parent_span_id: parentSpanId,
    type,
    name,
    status: 'running',
    start_time: new Date().toISOString(),
    artifacts: [],
    evidence: [],
  };
}

/**
 * Finalize a span by setting its terminal status and end time.
 * Returns a new span object (immutable pattern).
 */
export function finalizeSpan(
  span: ExecutionSpan,
  status: SpanStatus,
  failureReasons?: string[]
): ExecutionSpan {
  return {
    ...span,
    status,
    end_time: new Date().toISOString(),
    ...(failureReasons && failureReasons.length > 0
      ? { failure_reasons: failureReasons }
      : {}),
  };
}
