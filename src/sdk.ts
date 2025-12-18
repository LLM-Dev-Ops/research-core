/**
 * LLM-Research-Core SDK
 * Public SDK exports for programmatic usage
 */

import type { SimpleResearchRequest, SimulationConfig, ModelConfig } from './types/index.js';

// Re-export everything from lib
export * from './lib.js';

// SDK-specific utilities and helpers
export class ResearchSDK {
  /**
   * Create a research request builder
   */
  static createRequest() {
    return new ResearchRequestBuilder();
  }

  /**
   * Create a simulation config builder
   */
  static createSimulationConfig() {
    return new SimulationConfigBuilder();
  }
}

/**
 * Fluent builder for research requests
 */
export class ResearchRequestBuilder {
  private _id?: string;
  private _experimentId?: string;
  private _simulationConfig?: SimulationConfig;
  private _metadata: Record<string, unknown> = {};

  setId(id: string): this {
    this._id = id;
    return this;
  }

  setExperimentId(id: string): this {
    this._experimentId = id;
    return this;
  }

  setSimulationConfig(config: SimulationConfig): this {
    this._simulationConfig = config;
    return this;
  }

  setMetadata(metadata: Record<string, unknown>): this {
    this._metadata = metadata;
    return this;
  }

  build(): SimpleResearchRequest {
    if (!this._experimentId) {
      throw new Error('experimentId is required');
    }
    if (!this._simulationConfig) {
      throw new Error('simulationConfig is required');
    }

    return {
      id: this._id || crypto.randomUUID(),
      experimentId: this._experimentId,
      simulationConfig: this._simulationConfig,
      metadata: this._metadata,
    };
  }
}

/**
 * Fluent builder for simulation configs
 */
export class SimulationConfigBuilder {
  private _modelConfigs: ModelConfig[] = [];
  private _scenarioIds: string[] = [];
  private _iterations = 1;
  private _parameters: Record<string, unknown> = {};

  addModel(modelId: string, provider: string, parameters?: Record<string, unknown>): this {
    this._modelConfigs.push({
      modelId,
      provider,
      parameters
    } as ModelConfig);
    return this;
  }

  addScenario(scenarioId: string): this {
    this._scenarioIds.push(scenarioId);
    return this;
  }

  setIterations(iterations: number): this {
    this._iterations = iterations;
    return this;
  }

  setParameters(parameters: Record<string, unknown>): this {
    this._parameters = parameters;
    return this;
  }

  build(): SimulationConfig {
    if (this._modelConfigs.length === 0) {
      throw new Error('At least one model config is required');
    }
    if (this._scenarioIds.length === 0) {
      throw new Error('At least one scenario is required');
    }

    return {
      modelConfigs: this._modelConfigs,
      scenarioIds: this._scenarioIds,
      iterations: this._iterations,
      parameters: this._parameters
    };
  }
}
