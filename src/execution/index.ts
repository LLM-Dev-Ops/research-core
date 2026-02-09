/**
 * Execution Instrumentation Module
 *
 * Provides hierarchical execution span infrastructure for the
 * agentics-execution-engine integration.
 *
 * Exports:
 * - Types: ExecutionSpan, ExecutionGraph, CoreExecutionResult, etc.
 * - Tracer: ExecutionTracer class for managing execution graphs
 * - Utilities: span creation and finalization helpers
 */

export type {
  SpanType,
  SpanStatus,
  ExecutionSpan,
  ExecutionArtifact,
  EvidenceReference,
  ExecutionGraph,
  CoreExecutionResult,
  InvocationContext,
  RepoExecutionResult,
} from './types.js';

export { ExecutionTracer } from './tracer.js';

export {
  generateSpanId,
  createSpan,
  finalizeSpan,
} from './span.js';
