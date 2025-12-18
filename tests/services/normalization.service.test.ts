/**
 * Tests for NormalizationService
 */

import { describe, it, expect } from '@jest/globals';
import { NormalizationService } from '../../src/services/normalization.service.js';

describe('NormalizationService', () => {
  it('should be defined', () => {
    expect(NormalizationService).toBeDefined();
  });

  // Placeholder tests - implementation pending
  it.todo('should normalize simulation results');
  it.todo('should validate against schema');
  it.todo('should transform to common format');
});
