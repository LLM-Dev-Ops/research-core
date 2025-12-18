/**
 * Aggregation Service
 * Aggregates research results across models and scenarios
 * Pure aggregation coordination - delegates statistical computation to research-lab
 */

import type {
  NormalizedResultLegacy,
  AggregationResponse,
  MetricsSummaryLegacy
} from '../types/index.js';
import { ResearchLabAdapter } from '../adapters/research-lab.adapter.js';

export class AggregationService {
  constructor(private readonly _researchLabAdapter: ResearchLabAdapter) {}

  /**
   * Aggregate normalized results
   * Delegates statistical computation to research lab adapter
   */
  async aggregateResults(results: NormalizedResultLegacy[]): Promise<AggregationResponse> {
    if (results.length === 0) {
      throw new Error('Cannot aggregate empty results');
    }

    // Delegate aggregation to research-lab (Layer-3 boundary compliance)
    const aggregatedMetrics = await this._researchLabAdapter.aggregate(results);

    return {
      aggregatedMetrics,
      resultCount: results.length
    };
  }

  /**
   * Combine results from multiple experiments
   * Groups and aggregates across experiment boundaries
   */
  async combineExperiments(
    experimentResults: Map<string, NormalizedResultLegacy[]>
  ): Promise<AggregationResponse> {
    // Flatten all results for delegation
    const allResults: NormalizedResultLegacy[] = [];
    experimentResults.forEach(results => {
      allResults.push(...results);
    });

    // Delegate to research-lab
    return this.aggregateResults(allResults);
  }

  /**
   * Aggregate by model
   * Groups results by model ID and delegates computation to research-lab
   */
  async aggregateByModel(
    results: NormalizedResultLegacy[]
  ): Promise<Record<string, MetricsSummaryLegacy>> {
    // Group results by model, then delegate aggregation
    const grouped = this.groupByKey(results, r => r.modelId);
    const aggregated: Record<string, MetricsSummaryLegacy> = {};

    for (const [modelId, modelResults] of Object.entries(grouped)) {
      const metrics = await this._researchLabAdapter.aggregate(modelResults);
      aggregated[modelId] = metrics.overall;
    }

    return aggregated;
  }

  /**
   * Aggregate by scenario
   * Groups results by scenario ID and delegates computation to research-lab
   */
  async aggregateByScenario(
    results: NormalizedResultLegacy[]
  ): Promise<Record<string, MetricsSummaryLegacy>> {
    // Group results by scenario, then delegate aggregation
    const grouped = this.groupByKey(results, r => r.scenarioId);
    const aggregated: Record<string, MetricsSummaryLegacy> = {};

    for (const [scenarioId, scenarioResults] of Object.entries(grouped)) {
      const metrics = await this._researchLabAdapter.aggregate(scenarioResults);
      aggregated[scenarioId] = metrics.overall;
    }

    return aggregated;
  }

  /**
   * Calculate overall statistics
   * Delegates computation to research-lab
   */
  async calculateOverall(results: NormalizedResultLegacy[]): Promise<MetricsSummaryLegacy> {
    const metrics = await this._researchLabAdapter.aggregate(results);
    return metrics.overall;
  }

  /**
   * Get summary statistics for a specific metric
   * Delegates to research-lab for computation
   */
  async getMetricSummary(
    results: NormalizedResultLegacy[],
    metricName: string
  ): Promise<{ mean: number; median: number; stdDev: number; min: number; max: number }> {
    // Validate metric exists in results
    const hasMetric = results.some(r => r.metrics[metricName] !== undefined);
    if (!hasMetric) {
      throw new Error(`No values found for metric: ${metricName}`);
    }

    // Delegate to research-lab and extract specific metric
    const aggregated = await this._researchLabAdapter.aggregate(results);
    const overall = aggregated.overall;

    return {
      mean: overall.mean[metricName] ?? 0,
      median: overall.median[metricName] ?? 0,
      stdDev: overall.stdDev[metricName] ?? 0,
      min: overall.min[metricName] ?? 0,
      max: overall.max[metricName] ?? 0
    };
  }

  /**
   * Group results by a key function (coordination helper, no computation)
   */
  private groupByKey(
    results: NormalizedResultLegacy[],
    keyFn: (r: NormalizedResultLegacy) => string
  ): Record<string, NormalizedResultLegacy[]> {
    const grouped: Record<string, NormalizedResultLegacy[]> = {};

    results.forEach(result => {
      const key = keyFn(result);
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(result);
    });

    return grouped;
  }
}
