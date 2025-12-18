/**
 * Services Layer
 *
 * Services coordinate business logic across adapters.
 * Pure coordination - no implementation of core algorithms.
 *
 * All services use dependency injection for adapters.
 * Instantiate services with appropriate adapters in your application.
 */

export { CoordinationService, coordinationService } from './coordination.service.js';
export { NormalizationService } from './normalization.service.js';
export { AggregationService } from './aggregation.service.js';
export { ComparisonService } from './comparison.service.js';
