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
import { CoordinationService, coordinationService } from './services/coordination.service.js';

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
}

// Default instance
export const researchCore = new ResearchCore();
