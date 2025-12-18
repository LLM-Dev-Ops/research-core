/**
 * Aggregation Service
 * Aggregates research results across models and scenarios
 * Pure aggregation coordination - delegates statistical computation to research-lab
 */

import type {
  NormalizedResultLegacy,
  AggregatedMetricsLegacy,
  AggregationResponse,
  MetricsSummaryLegacy
} from '../types/index.js';
import { ResearchLabAdapter } from '../adapters/research-lab.adapter.js';

export class AggregationService {
  constructor(private readonly _researchLabAdapter: ResearchLabAdapter) {
    // Adapter stored for future use when connecting to real research lab
    void this._researchLabAdapter;
  }

  /**
   * Aggregate normalized results
   * Delegates statistical computation to research lab adapter
   */
  async aggregateResults(results: NormalizedResultLegacy[]): Promise<AggregationResponse> {
    if (results.length === 0) {
      throw new Error('Cannot aggregate empty results');
    }

    // Calculate aggregated metrics locally (delegation placeholder)
    const aggregatedMetrics = this.calculateAggregatedMetrics(results);

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
    // Flatten all results
    const allResults: NormalizedResultLegacy[] = [];
    experimentResults.forEach(results => {
      allResults.push(...results);
    });

    // Aggregate combined results
    return this.aggregateResults(allResults);
  }

  /**
   * Aggregate by model
   * Groups results by model ID and computes statistics
   */
  async aggregateByModel(
    results: NormalizedResultLegacy[]
  ): Promise<Record<string, MetricsSummaryLegacy>> {
    // Group results by model
    const grouped = this.groupByModel(results);

    const aggregated: Record<string, MetricsSummaryLegacy> = {};

    // Aggregate each model's results
    for (const [modelId, modelResults] of Object.entries(grouped)) {
      aggregated[modelId] = this.calculateMetricsSummary(modelResults);
    }

    return aggregated;
  }

  /**
   * Aggregate by scenario
   * Groups results by scenario ID and computes statistics
   */
  async aggregateByScenario(
    results: NormalizedResultLegacy[]
  ): Promise<Record<string, MetricsSummaryLegacy>> {
    // Group results by scenario
    const grouped = this.groupByScenario(results);

    const aggregated: Record<string, MetricsSummaryLegacy> = {};

    // Aggregate each scenario's results
    for (const [scenarioId, scenarioResults] of Object.entries(grouped)) {
      aggregated[scenarioId] = this.calculateMetricsSummary(scenarioResults);
    }

    return aggregated;
  }

  /**
   * Calculate overall statistics
   * Computes aggregate metrics across all results
   */
  async calculateOverall(results: NormalizedResultLegacy[]): Promise<MetricsSummaryLegacy> {
    return this.calculateMetricsSummary(results);
  }

  /**
   * Calculate aggregated metrics from results
   */
  private calculateAggregatedMetrics(results: NormalizedResultLegacy[]): AggregatedMetricsLegacy {
    return {
      byModel: this.groupAndSummarize(results, r => r.modelId),
      byScenario: this.groupAndSummarize(results, r => r.scenarioId),
      overall: this.calculateMetricsSummary(results)
    };
  }

  /**
   * Group results and calculate summaries
   */
  private groupAndSummarize(
    results: NormalizedResultLegacy[],
    keyFn: (r: NormalizedResultLegacy) => string
  ): Record<string, MetricsSummaryLegacy> {
    const grouped: Record<string, NormalizedResultLegacy[]> = {};

    results.forEach(result => {
      const key = keyFn(result);
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(result);
    });

    const summaries: Record<string, MetricsSummaryLegacy> = {};
    for (const [key, groupResults] of Object.entries(grouped)) {
      summaries[key] = this.calculateMetricsSummary(groupResults);
    }

    return summaries;
  }

  /**
   * Calculate metrics summary for a group of results
   */
  private calculateMetricsSummary(results: NormalizedResultLegacy[]): MetricsSummaryLegacy {
    if (results.length === 0) {
      return {
        mean: {},
        median: {},
        stdDev: {},
        min: {},
        max: {},
        count: 0
      };
    }

    // Collect all metric names
    const metricNames = new Set<string>();
    results.forEach(r => {
      Object.keys(r.metrics).forEach(name => metricNames.add(name));
    });

    const mean: Record<string, number> = {};
    const median: Record<string, number> = {};
    const stdDev: Record<string, number> = {};
    const min: Record<string, number> = {};
    const max: Record<string, number> = {};

    metricNames.forEach(metricName => {
      const values = results
        .map(r => r.metrics[metricName])
        .filter((v): v is number => v !== undefined);

      if (values.length > 0) {
        const stats = this.calculateStats(values);
        mean[metricName] = stats.mean;
        median[metricName] = stats.median;
        stdDev[metricName] = stats.stdDev;
        min[metricName] = stats.min;
        max[metricName] = stats.max;
      }
    });

    return { mean, median, stdDev, min, max, count: results.length };
  }

  /**
   * Calculate basic statistics for a set of values
   */
  private calculateStats(values: number[]): {
    mean: number;
    median: number;
    stdDev: number;
    min: number;
    max: number;
  } {
    const sorted = [...values].sort((a, b) => a - b);
    const n = values.length;

    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / n;

    const median = n % 2 === 0
      ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
      : sorted[Math.floor(n / 2)];

    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    return {
      mean,
      median,
      stdDev,
      min: sorted[0],
      max: sorted[n - 1]
    };
  }

  /**
   * Group results by model ID
   */
  private groupByModel(results: NormalizedResultLegacy[]): Record<string, NormalizedResultLegacy[]> {
    const grouped: Record<string, NormalizedResultLegacy[]> = {};

    results.forEach(result => {
      if (!grouped[result.modelId]) {
        grouped[result.modelId] = [];
      }
      grouped[result.modelId].push(result);
    });

    return grouped;
  }

  /**
   * Group results by scenario ID
   */
  private groupByScenario(results: NormalizedResultLegacy[]): Record<string, NormalizedResultLegacy[]> {
    const grouped: Record<string, NormalizedResultLegacy[]> = {};

    results.forEach(result => {
      if (!grouped[result.scenarioId]) {
        grouped[result.scenarioId] = [];
      }
      grouped[result.scenarioId].push(result);
    });

    return grouped;
  }

  /**
   * Get summary statistics for a specific metric
   * Extracts and analyzes a single metric across results
   */
  async getMetricSummary(
    results: NormalizedResultLegacy[],
    metricName: string
  ): Promise<{ mean: number; median: number; stdDev: number; min: number; max: number }> {
    // Extract metric values
    const values = results
      .map(r => r.metrics[metricName])
      .filter((v): v is number => v !== undefined);

    if (values.length === 0) {
      throw new Error(`No values found for metric: ${metricName}`);
    }

    return this.calculateStats(values);
  }
}
