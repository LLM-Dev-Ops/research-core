/**
 * Comparison Service
 *
 * Exposes read-only research artifacts and comparisons.
 * Presents reproducible summaries.
 */

import type {
  NormalizedResultLegacy,
  ComparisonResultLegacy,
  ComparisonResponse,
} from '../types/index.js';
import { ResearchLabAdapter } from '../adapters/research-lab.adapter.js';

export class ComparisonService {
  constructor(private readonly _researchLabAdapter: ResearchLabAdapter) {
    // Adapter stored for future use when connecting to real research lab
    void this._researchLabAdapter;
  }

  /**
   * Compare results across multiple models
   * Delegates comparison logic to research lab adapter
   */
  async compareResults(
    results: NormalizedResultLegacy[],
    modelIds: string[]
  ): Promise<ComparisonResponse> {
    // Validate inputs
    if (results.length === 0) {
      throw new Error('Cannot compare empty results');
    }
    if (modelIds.length < 2) {
      throw new Error('Must provide at least 2 models to compare');
    }

    // Filter results for specified models
    const filteredResults = results.filter(r => modelIds.includes(r.modelId));

    // Generate pairwise comparisons
    const comparisons = this.generatePairwiseComparisons(filteredResults, modelIds);

    return {
      comparisons,
      methodology: 'pairwise-statistical-analysis'
    };
  }

  /**
   * Generate a reproducible summary from comparison results
   * Creates human-readable summary of key findings
   */
  async generateSummary(results: ComparisonResultLegacy[]): Promise<string> {
    let summary = 'Model Comparison Summary\n';
    summary += '='.repeat(50) + '\n\n';

    results.forEach((comparison, index) => {
      summary += `Comparison ${index + 1}: ${comparison.modelA} vs ${comparison.modelB}\n`;
      summary += '-'.repeat(50) + '\n';

      // Add metric differences
      summary += 'Metric Differences:\n';
      Object.entries(comparison.metricDifferences).forEach(([metric, diff]) => {
        summary += `  ${metric}: ${diff.toFixed(4)}\n`;
      });

      // Add winner if present
      if (comparison.winner) {
        summary += `Winner: ${comparison.winner}\n`;
      }

      // Add statistical significance if present
      if (comparison.statisticalSignificance) {
        summary += 'Statistical Significance:\n';
        Object.entries(comparison.statisticalSignificance).forEach(([metric, sig]) => {
          summary += `  ${metric}: ${sig ? 'Yes' : 'No'}\n`;
        });
      }

      summary += '\n';
    });

    return summary;
  }

  /**
   * Compare models pairwise
   * Creates all pairwise comparisons between models
   */
  async comparePairwise(
    results: NormalizedResultLegacy[],
    modelIds: string[]
  ): Promise<ComparisonResponse> {
    const comparisons = this.generatePairwiseComparisons(results, modelIds);

    return {
      comparisons,
      methodology: 'pairwise-statistical-analysis'
    };
  }

  /**
   * Compare against baseline
   * Compares all models against a baseline model
   */
  async compareToBaseline(
    results: NormalizedResultLegacy[],
    baselineModelId: string
  ): Promise<ComparisonResponse> {
    // Get all unique model IDs except baseline
    const allModelIds = [...new Set(results.map(r => r.modelId))];
    const otherModels = allModelIds.filter(id => id !== baselineModelId);

    if (!allModelIds.includes(baselineModelId)) {
      throw new Error(`Baseline model not found in results: ${baselineModelId}`);
    }

    // Compare each model against baseline
    const comparisons: ComparisonResultLegacy[] = [];
    for (const modelId of otherModels) {
      const comparison = this.compareModels(results, baselineModelId, modelId);
      comparisons.push(comparison);
    }

    return {
      comparisons,
      methodology: 'baseline-comparison'
    };
  }

  /**
   * Rank models by metric
   * Orders models by performance on a specific metric
   */
  async rankByMetric(
    results: NormalizedResultLegacy[],
    metricName: string
  ): Promise<string[]> {
    // Group results by model
    const modelMetrics: Record<string, number[]> = {};

    results.forEach(result => {
      if (result.metrics[metricName] !== undefined) {
        if (!modelMetrics[result.modelId]) {
          modelMetrics[result.modelId] = [];
        }
        modelMetrics[result.modelId].push(result.metrics[metricName]);
      }
    });

    // Calculate mean for each model
    const modelAverages: [string, number][] = Object.entries(modelMetrics).map(
      ([modelId, values]) => {
        const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
        return [modelId, mean];
      }
    );

    // Sort by metric (descending)
    modelAverages.sort((a, b) => b[1] - a[1]);

    return modelAverages.map(([modelId]) => modelId);
  }

  /**
   * Calculate statistical significance
   * Determines if differences between models are statistically significant
   */
  async calculateSignificance(
    modelA: string,
    modelB: string,
    results: NormalizedResultLegacy[]
  ): Promise<Record<string, boolean>> {
    const comparison = this.compareModels(results, modelA, modelB);
    return comparison.statisticalSignificance || {};
  }

  /**
   * Generate pairwise comparisons for all model pairs
   */
  private generatePairwiseComparisons(
    results: NormalizedResultLegacy[],
    modelIds: string[]
  ): ComparisonResultLegacy[] {
    const comparisons: ComparisonResultLegacy[] = [];

    // Generate all pairwise model combinations
    for (let i = 0; i < modelIds.length; i++) {
      for (let j = i + 1; j < modelIds.length; j++) {
        const comparison = this.compareModels(results, modelIds[i], modelIds[j]);
        comparisons.push(comparison);
      }
    }

    return comparisons;
  }

  /**
   * Compare two models
   */
  private compareModels(
    results: NormalizedResultLegacy[],
    modelA: string,
    modelB: string
  ): ComparisonResultLegacy {
    const resultsA = results.filter(r => r.modelId === modelA);
    const resultsB = results.filter(r => r.modelId === modelB);

    // Collect all metric names
    const metricNames = new Set<string>();
    [...resultsA, ...resultsB].forEach(r => {
      Object.keys(r.metrics).forEach(name => metricNames.add(name));
    });

    // Calculate differences
    const metricDifferences: Record<string, number> = {};
    const statisticalSignificance: Record<string, boolean> = {};

    let winsA = 0;
    let winsB = 0;

    metricNames.forEach(metricName => {
      const valuesA = resultsA
        .map(r => r.metrics[metricName])
        .filter((v): v is number => v !== undefined);
      const valuesB = resultsB
        .map(r => r.metrics[metricName])
        .filter((v): v is number => v !== undefined);

      if (valuesA.length > 0 && valuesB.length > 0) {
        const meanA = valuesA.reduce((a, b) => a + b, 0) / valuesA.length;
        const meanB = valuesB.reduce((a, b) => a + b, 0) / valuesB.length;

        metricDifferences[metricName] = meanA - meanB;

        // Simple significance check (placeholder for proper statistical test)
        statisticalSignificance[metricName] = Math.abs(meanA - meanB) > 0.1;

        if (meanA > meanB) winsA++;
        else if (meanB > meanA) winsB++;
      }
    });

    return {
      modelA,
      modelB,
      metricDifferences,
      statisticalSignificance,
      winner: winsA > winsB ? modelA : winsB > winsA ? modelB : undefined
    };
  }
}
