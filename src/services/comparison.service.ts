/**
 * Comparison Service
 *
 * Exposes read-only research artifacts and comparisons.
 * Presents reproducible summaries.
 * Pure coordination - delegates comparison logic to research-lab.
 */

import type {
  NormalizedResultLegacy,
  ComparisonResultLegacy,
  ComparisonResponse,
} from '../types/index.js';
import { ResearchLabAdapter } from '../adapters/research-lab.adapter.js';

export class ComparisonService {
  constructor(private readonly _researchLabAdapter: ResearchLabAdapter) {}

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

    // Delegate comparison to research-lab (Layer-3 boundary compliance)
    const comparisons = await this._researchLabAdapter.compare(filteredResults, modelIds);

    return {
      comparisons,
      methodology: 'pairwise-statistical-analysis'
    };
  }

  /**
   * Generate a reproducible summary from comparison results
   * Creates human-readable summary of key findings (formatting only, no computation)
   */
  async generateSummary(results: ComparisonResultLegacy[]): Promise<string> {
    let summary = 'Model Comparison Summary\n';
    summary += '='.repeat(50) + '\n\n';

    results.forEach((comparison, index) => {
      summary += `Comparison ${index + 1}: ${comparison.modelA} vs ${comparison.modelB}\n`;
      summary += '-'.repeat(50) + '\n';

      // Format metric differences
      summary += 'Metric Differences:\n';
      Object.entries(comparison.metricDifferences).forEach(([metric, diff]) => {
        summary += `  ${metric}: ${diff.toFixed(4)}\n`;
      });

      // Format winner if present
      if (comparison.winner) {
        summary += `Winner: ${comparison.winner}\n`;
      }

      // Format statistical significance if present
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
   * Delegates to research-lab for comparison computation
   */
  async comparePairwise(
    results: NormalizedResultLegacy[],
    modelIds: string[]
  ): Promise<ComparisonResponse> {
    // Delegate to research-lab
    const comparisons = await this._researchLabAdapter.compare(results, modelIds);

    return {
      comparisons,
      methodology: 'pairwise-statistical-analysis'
    };
  }

  /**
   * Compare against baseline
   * Compares all models against a baseline model via research-lab
   */
  async compareToBaseline(
    results: NormalizedResultLegacy[],
    baselineModelId: string
  ): Promise<ComparisonResponse> {
    // Get all unique model IDs except baseline
    const allModelIds = [...new Set(results.map(r => r.modelId))];

    if (!allModelIds.includes(baselineModelId)) {
      throw new Error(`Baseline model not found in results: ${baselineModelId}`);
    }

    const otherModels = allModelIds.filter(id => id !== baselineModelId);

    // Delegate baseline comparisons to research-lab
    const comparisons: ComparisonResultLegacy[] = [];
    for (const modelId of otherModels) {
      const pairComparisons = await this._researchLabAdapter.compare(
        results,
        [baselineModelId, modelId]
      );
      comparisons.push(...pairComparisons);
    }

    return {
      comparisons,
      methodology: 'baseline-comparison'
    };
  }

  /**
   * Rank models by metric
   * Delegates ranking computation to research-lab via aggregation
   */
  async rankByMetric(
    results: NormalizedResultLegacy[],
    _metricName: string
  ): Promise<string[]> {
    // Get unique model IDs
    const modelIds = [...new Set(results.map(r => r.modelId))];

    // Delegate comparison to get metric differences
    const comparisons = await this._researchLabAdapter.compare(results, modelIds);

    // Extract ranking from comparison results (coordination logic only)
    const modelScores: Record<string, number> = {};
    modelIds.forEach(id => { modelScores[id] = 0; });

    // Count wins per model based on comparison results
    comparisons.forEach(comparison => {
      if (comparison.winner) {
        modelScores[comparison.winner] = (modelScores[comparison.winner] || 0) + 1;
      }
    });

    // Sort by wins (descending)
    return Object.entries(modelScores)
      .sort((a, b) => b[1] - a[1])
      .map(([modelId]) => modelId);
  }

  /**
   * Calculate statistical significance
   * Delegates to research-lab for significance computation
   */
  async calculateSignificance(
    modelA: string,
    modelB: string,
    results: NormalizedResultLegacy[]
  ): Promise<Record<string, boolean>> {
    // Delegate to research-lab
    const dataA = results
      .filter(r => r.modelId === modelA)
      .flatMap(r => Object.values(r.metrics));
    const dataB = results
      .filter(r => r.modelId === modelB)
      .flatMap(r => Object.values(r.metrics));

    // Use research-lab's significance calculation
    const isSignificant = await this._researchLabAdapter.calculateSignificance(dataA, dataB);

    // Get metric names for result structure
    const metricNames = new Set<string>();
    results.forEach(r => Object.keys(r.metrics).forEach(m => metricNames.add(m)));

    // Return significance per metric (delegated result)
    const significance: Record<string, boolean> = {};
    metricNames.forEach(metric => {
      significance[metric] = isSignificant;
    });

    return significance;
  }
}
