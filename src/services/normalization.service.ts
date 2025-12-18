/**
 * Normalization Service
 * Normalizes experimental outputs using schema registry
 * Coordinates normalization - does not implement normalization algorithms
 */

import type {
  SimulationResult,
  NormalizedResultLegacy,
  NormalizationResponse,
  SchemaDefinition
} from '../types/index.js';
import { SchemaRegistryAdapter } from '../adapters/schema-registry.adapter.js';

export class NormalizationService {
  private readonly DEFAULT_SCHEMA = 'default-v1';

  constructor(private readonly _schemaAdapter: SchemaRegistryAdapter) {}

  /**
   * Normalize simulation results using registered schemas
   * Delegates schema retrieval and validation to schema adapter
   */
  async normalizeOutput(
    results: SimulationResult[],
    schemaId?: string
  ): Promise<NormalizationResponse> {
    const targetSchema = schemaId || this.DEFAULT_SCHEMA;

    // Validate all results against schema
    const validationResults = await Promise.all(
      results.map(result => this.validate(result, targetSchema))
    );

    const allValid = validationResults.every(v => v);
    if (!allValid) {
      throw new Error(`Some results failed schema validation for: ${targetSchema}`);
    }

    // Transform to normalized format
    const normalizedResults = await this.transform(results, targetSchema);

    return {
      normalizedResults,
      schema: targetSchema
    };
  }

  /**
   * Normalize multiple result sets
   * Processes batches of results efficiently
   */
  async normalizeResults(
    resultSets: SimulationResult[][],
    schemaId?: string
  ): Promise<NormalizationResponse[]> {
    const responses: NormalizationResponse[] = [];

    for (const results of resultSets) {
      const response = await this.normalizeOutput(results, schemaId);
      responses.push(response);
    }

    return responses;
  }

  /**
   * Validate results against schema
   * Delegates validation to schema adapter
   */
  async validate(result: SimulationResult | SimulationResult[], schemaId: string): Promise<boolean> {
    try {
      // Handle single result or array
      const resultsArray = Array.isArray(result) ? result : [result];

      // Validate each result against schema
      const validations = await Promise.all(
        resultsArray.map(r => this._schemaAdapter.validate(r, schemaId))
      );

      return validations.every(v => v);
    } catch (error) {
      console.error(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }

  /**
   * Transform results to common format
   * Applies schema-based transformation
   */
  async transform(
    results: SimulationResult[],
    targetSchema: string
  ): Promise<NormalizedResultLegacy[]> {
    // Fetch schema definition
    const schema = await this._schemaAdapter.getSchemaDefinition(targetSchema);

    // Transform each result according to schema
    return results.map(result => this.transformSingle(result, schema));
  }

  /**
   * Transform a single result
   * Maps raw output to normalized format
   */
  private transformSingle(
    result: SimulationResult,
    schema: SchemaDefinition
  ): NormalizedResultLegacy {
    // Extract metrics from outputs based on schema
    const metrics = this.extractMetrics(result.outputs, schema);

    // Create normalized result
    return {
      modelId: result.modelId,
      scenarioId: result.scenarioId,
      metrics,
      metadata: {
        iteration: result.iteration,
        timestamp: result.timestamp,
        schema: schema.id
      }
    };
  }

  /**
   * Extract metrics from raw outputs
   * Applies schema field definitions
   */
  private extractMetrics(
    outputs: Record<string, unknown>,
    schema: SchemaDefinition
  ): Record<string, number> {
    const metrics: Record<string, number> = {};

    // Extract numeric fields defined in schema
    Object.entries(schema.fields).forEach(([fieldName, fieldDef]) => {
      if (fieldDef.type === 'number' && fieldName in outputs) {
        const value = outputs[fieldName];
        if (typeof value === 'number') {
          metrics[fieldName] = value;
        }
      }
    });

    // If no metrics extracted, try to extract any numeric fields
    if (Object.keys(metrics).length === 0) {
      Object.entries(outputs).forEach(([key, value]) => {
        if (typeof value === 'number') {
          metrics[key] = value;
        }
      });
    }

    return metrics;
  }

  /**
   * List available schemas
   * Delegates to schema adapter
   */
  async listSchemas(): Promise<string[]> {
    return this._schemaAdapter.listSchemas();
  }

  /**
   * Get schema definition
   * Retrieves schema from registry
   */
  async getSchema(schemaId: string): Promise<SchemaDefinition> {
    return this._schemaAdapter.getSchemaDefinition(schemaId);
  }
}
