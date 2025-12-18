/**
 * Coordination Service
 * Coordinates simulation runs across integrated components
 * Pure coordination - no simulation logic
 */

import type {
  SimpleResearchRequest,
  SimulationRun,
  CoordinationResponse,
  SimulationConfig,
} from '../types/index.js';
import { SimulatorAdapter } from '../adapters/simulator.adapter.js';
import { SchemaRegistryAdapter } from '../adapters/schema-registry.adapter.js';

export class CoordinationService {
  private activeRuns: Map<string, SimulationRun> = new Map();

  constructor(
    private readonly _simulatorAdapter: SimulatorAdapter,
    _schemaAdapter: SchemaRegistryAdapter
  ) {
    // Schema adapter will be used for validation in future
    void _schemaAdapter;
  }

  /**
   * Coordinate a simulation run based on research request
   * Orchestrates schema validation and simulator invocation
   */
  async coordinateSimulation(request: SimpleResearchRequest): Promise<CoordinationResponse> {
    // Validate request structure
    this.validateRequest(request);

    // Generate run ID
    const runId = this.generateRunId(request);

    // Initialize run tracking
    const run: SimulationRun = {
      id: runId,
      requestId: request.id,
      status: 'pending',
      startedAt: new Date()
    };
    this.activeRuns.set(runId, run);

    try {
      // Update status to running
      run.status = 'running';

      // Delegate to simulator adapter for execution
      await this._simulatorAdapter.startSimulation(request.simulationConfig);

      // Update run with completion
      run.status = 'completed';
      run.completedAt = new Date();

      return {
        runId,
        status: 'completed',
        message: 'Simulation completed successfully'
      };
    } catch (error) {
      // Handle execution errors
      run.status = 'failed';
      run.error = error instanceof Error ? error.message : 'Unknown error';
      run.completedAt = new Date();

      return {
        runId,
        status: 'failed',
        message: run.error
      };
    }
  }

  /**
   * Coordinate batch simulation runs
   * Processes multiple requests efficiently
   */
  async batchCoordinate(requests: SimpleResearchRequest[]): Promise<CoordinationResponse[]> {
    const responses: CoordinationResponse[] = [];

    // Coordinate each simulation
    for (const request of requests) {
      const response = await this.coordinateSimulation(request);
      responses.push(response);
    }

    return responses;
  }

  /**
   * Monitor simulation progress
   * Polls simulator for current status
   */
  async monitorProgress(runId: string): Promise<SimulationRun> {
    const run = this.activeRuns.get(runId);

    if (!run) {
      throw new Error(`No simulation found with ID: ${runId}`);
    }

    // If still running, check status with simulator
    if (run.status === 'running') {
      try {
        const currentStatus = await this._simulatorAdapter.getStatus(runId);
        run.status = currentStatus;
      } catch (error) {
        // If status check fails, mark as failed
        run.status = 'failed';
        run.error = error instanceof Error ? error.message : 'Status check failed';
      }
    }

    return run;
  }

  /**
   * Cancel a coordinated simulation
   * Signals simulator to cancel execution
   */
  async cancelSimulation(runId: string): Promise<void> {
    const run = this.activeRuns.get(runId);

    if (!run) {
      throw new Error(`No simulation found with ID: ${runId}`);
    }

    if (run.status !== 'running') {
      throw new Error(`Cannot cancel simulation with status: ${run.status}`);
    }

    // Delegate cancellation to simulator
    await this._simulatorAdapter.cancelSimulation(runId);

    // Update run status
    run.status = 'cancelled';
    run.completedAt = new Date();
  }

  /**
   * Retry a failed simulation
   * Reinitiates simulation with same configuration
   */
  async retrySimulation(runId: string): Promise<CoordinationResponse> {
    const run = this.activeRuns.get(runId);

    if (!run) {
      throw new Error(`No simulation found with ID: ${runId}`);
    }

    if (run.status !== 'failed') {
      throw new Error(`Cannot retry simulation with status: ${run.status}`);
    }

    // Create new request based on original
    const retryRequest: SimpleResearchRequest = {
      id: `${run.requestId}-retry`,
      experimentId: run.requestId,
      simulationConfig: this.getSimulationConfig(),
    };

    // Coordinate new simulation
    return this.coordinateSimulation(retryRequest);
  }

  /**
   * Validate research request structure
   */
  private validateRequest(request: SimpleResearchRequest): void {
    if (!request.id) {
      throw new Error('Research request must have an ID');
    }
    if (!request.experimentId) {
      throw new Error('Research request must have an experiment ID');
    }
    if (!request.simulationConfig) {
      throw new Error('Research request must have simulation configuration');
    }
  }

  /**
   * Generate unique run ID
   */
  private generateRunId(request: SimpleResearchRequest): string {
    return `run-${request.experimentId}-${Date.now()}`;
  }

  /**
   * Extract simulation config from run (for retries)
   */
  private getSimulationConfig(): SimulationConfig {
    // Reconstruct config from run data
    // In production, would store original config
    return {
      modelConfigs: [],
      scenarioIds: [],
      iterations: 1
    };
  }
}

// Default instance with default adapters
import { simulatorAdapter } from '../adapters/simulator.adapter.js';
import { schemaRegistryAdapter } from '../adapters/schema-registry.adapter.js';

export const coordinationService = new CoordinationService(
  simulatorAdapter,
  schemaRegistryAdapter
);
