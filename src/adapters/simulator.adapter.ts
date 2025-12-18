/**
 * Simulator Adapter
 * Integration with LLM-Simulator
 * Handles simulation execution coordination
 */

import type {
  SimulatorConfig,
  SimulationConfig,
  SimulationRun,
  SimulationStatus,
} from '../types/index.js';

export class SimulatorAdapter {
  constructor(private readonly _config: SimulatorConfig = {}) {
    // Config stored for future use when connecting to real simulator
    void this._config;
  }

  /**
   * Start a simulation run
   */
  async startSimulation(_config: SimulationConfig): Promise<string> {
    // Placeholder - will call LLM-Simulator
    throw new Error('Not implemented');
  }

  /**
   * Get simulation status
   */
  async getStatus(_runId: string): Promise<SimulationStatus> {
    // Placeholder - will poll LLM-Simulator
    throw new Error('Not implemented');
  }

  /**
   * Get simulation results
   */
  async getResults(_runId: string): Promise<SimulationRun> {
    // Placeholder - will fetch from LLM-Simulator
    throw new Error('Not implemented');
  }

  /**
   * Cancel a simulation
   */
  async cancelSimulation(_runId: string): Promise<void> {
    // Placeholder - will signal LLM-Simulator
    throw new Error('Not implemented');
  }

  /**
   * List running simulations
   */
  async listRunning(): Promise<string[]> {
    // Placeholder - will query LLM-Simulator
    throw new Error('Not implemented');
  }
}

export const simulatorAdapter = new SimulatorAdapter();
