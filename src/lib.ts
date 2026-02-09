/**
 * LLM-Research-Core - Main Entry Point
 *
 * Layer-3 core integration bundle for research capabilities.
 * Coordinates research workflows across:
 * - LLM-Schema-Registry: Schema validation and normalization
 * - LLM-Simulator: Simulation execution
 * - LLM-Research-Lab: Analysis and comparison
 *
 * This module provides glue-level coordination only:
 * - Coordinates simulation runs
 * - Normalizes experimental outputs
 * - Aggregates research results
 * - Exposes read-only research artifacts and comparisons
 *
 * It does NOT implement:
 * - Simulation engines
 * - Evaluation algorithms
 * - Storage engines
 * - Infrastructure (retry, tracing, logging, metrics, config)
 */

import type { SimpleResearchRequest } from './types/index.js';
import type { CoreExecutionResult } from './execution/types.js';
import { CoordinationService, coordinationService } from './services/coordination.service.js';
import { ExecutionTracer } from './execution/tracer.js';
import { generateSpanId } from './execution/span.js';

// Export types
export * from './types/index.js';

// Export handlers
export {
  ResearchRequestHandler,
  researchRequestHandler,
  SimulationRunHandler,
  simulationRunHandler,
  ExperimentOutputHandler,
  experimentOutputHandler,
} from './handlers/index.js';

// Export services
export { CoordinationService, coordinationService } from './services/coordination.service.js';
export { NormalizationService } from './services/normalization.service.js';
export { AggregationService } from './services/aggregation.service.js';
export { ComparisonService } from './services/comparison.service.js';

// Export adapters
export {
  SchemaRegistryAdapter,
  schemaRegistryAdapter,
  SimulatorAdapter,
  simulatorAdapter,
  ResearchLabAdapter,
  researchLabAdapter,
} from './adapters/index.js';

// Export execution instrumentation
export * from './execution/index.js';

/**
 * ResearchCore - Main facade for research coordination
 *
 * Provides a unified interface for:
 * - Initiating research requests
 * - Running simulations via LLM-Simulator
 * - Retrieving experimental outputs from LLM-Research-Lab
 * - Normalizing results using LLM-Schema-Registry
 * - Generating comparisons and summaries
 */
export class ResearchCore {
  private _coordinationService: CoordinationService;

  constructor(deps?: {
    coordinationService?: CoordinationService;
  }) {
    this._coordinationService = deps?.coordinationService ?? coordinationService;
  }

  /**
   * Coordinate a research simulation run
   * Delegates to LLM-Simulator via coordination service
   */
  async coordinateSimulation(request: SimpleResearchRequest) {
    return this._coordinationService.coordinateSimulation(request);
  }

  /**
   * Monitor simulation progress
   */
  async monitorProgress(runId: string) {
    return this._coordinationService.monitorProgress(runId);
  }

  /**
   * Cancel a running simulation
   */
  async cancelSimulation(runId: string) {
    return this._coordinationService.cancelSimulation(runId);
  }

  /**
   * Retry a failed simulation
   */
  async retrySimulation(runId: string) {
    return this._coordinationService.retrySimulation(runId);
  }

  /**
   * Execute a coordinated simulation with full execution tracing.
   *
   * Emits a hierarchical execution graph conforming to the
   * agentics-execution-engine contract:
   *
   *   Core (research-core)
   *     └── Repo (llm-simulator)
   *         └── Agent (returned by simulator)
   *
   * Returns CoreExecutionResult on success, partial failure,
   * and total failure — the execution graph is always included.
   *
   * @param request - The research request to execute
   * @param parentSpanId - Optional parent span ID from the execution engine
   */
  async execute(
    request: SimpleResearchRequest,
    parentSpanId?: string
  ): Promise<CoreExecutionResult> {
    const tracer = new ExecutionTracer('research-core', parentSpanId ?? null);

    // Create repo span for simulator invocation
    const repoSpan = tracer.createRepoSpan('llm-simulator');

    try {
      // Delegate to coordination service (which internally calls simulator adapter)
      const response = await this._coordinationService.coordinateSimulation(request);

      // Attach machine-verifiable evidence: the simulation run ID
      tracer.attachEvidence(repoSpan.span_id, {
        evidence_id: generateSpanId(),
        type: 'id',
        value: response.runId,
        description: 'Simulation run identifier',
      });

      // Attach coordination response as an artifact at the repo span level
      tracer.attachArtifact(repoSpan.span_id, {
        artifact_id: generateSpanId(),
        type: 'coordination-response',
        reference: `run://${response.runId}`,
        metadata: {
          status: response.status,
          message: response.message,
        },
      });

      // Close repo span based on coordination result
      if (response.status === 'failed') {
        tracer.closeSpan(repoSpan.span_id, 'failed', [
          response.message || 'Simulation failed',
        ]);
      } else {
        tracer.closeSpan(repoSpan.span_id, 'completed');
      }

      return tracer.buildResult(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      tracer.closeSpan(repoSpan.span_id, 'failed', [message]);
      return tracer.buildResult(
        undefined,
        error instanceof Error ? error : new Error(message)
      );
    }
  }
}

// Default instance
export const researchCore = new ResearchCore();
