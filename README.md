# LLM-Research-Core

A Layer-3 integration bundle that coordinates research capabilities across LLM evaluation systems. Provides unified orchestration for schema validation, simulation execution, and experimental analysis.

## Overview

LLM-Research-Core serves as the coordination layer between three specialized systems:

| System | Purpose |
|--------|---------|
| **LLM-Schema-Registry** | Schema validation and data normalization |
| **LLM-Simulator** | Simulation execution and model inference |
| **LLM-Research-Lab** | Statistical analysis and model comparison |

This module provides **glue-level coordination only**. It does not implement simulation engines, evaluation algorithms, storage systems, or infrastructure concerns.

## Installation

```bash
npm install @llm-research/core
```

### Peer Dependencies

This package requires the following peer dependencies:

```bash
npm install @llm-research/schema-registry @llm-research/simulator @llm-research/research-lab
```

## Quick Start

### Library Usage

```typescript
import { researchCore } from '@llm-research/core';

// Coordinate a simulation run
const response = await researchCore.coordinateSimulation({
  id: 'request-001',
  experimentId: 'exp-001',
  simulationConfig: {
    modelConfigs: [
      { provider: 'openai', modelId: 'gpt-4' },
      { provider: 'anthropic', modelId: 'claude-3' }
    ],
    scenarioIds: ['scenario-a', 'scenario-b'],
    iterations: 10
  }
});

// Monitor progress
const status = await researchCore.monitorProgress(response.runId);
```

### SDK Builder Pattern

```typescript
import { ResearchSDK } from '@llm-research/core/sdk';

// Build a research request fluently
const request = ResearchSDK.createRequest()
  .setExperimentId('exp-001')
  .setSimulationConfig(
    ResearchSDK.createSimulationConfig()
      .addModel('gpt-4', 'openai')
      .addModel('claude-3', 'anthropic')
      .addScenario('benchmark-qa')
      .setIterations(100)
      .build()
  )
  .build();
```

### CLI Usage

```bash
# Start a research simulation
research-core start --experiment exp-001 --models gpt-4,claude-3

# Check simulation status
research-core status run-123

# Get experiment results
research-core results exp-001 --format json

# Compare models
research-core compare --experiment exp-001 --models gpt-4,claude-3
```

## Architecture

```
src/
├── types/           # Type definitions and contracts
├── adapters/        # External system integrations
│   ├── schema-registry.adapter.ts
│   ├── simulator.adapter.ts
│   └── research-lab.adapter.ts
├── handlers/        # Framework-agnostic entry points
│   ├── research-request.handler.ts
│   ├── simulation-run.handler.ts
│   └── experiment-output.handler.ts
├── services/        # Coordination logic
│   ├── coordination.service.ts
│   ├── normalization.service.ts
│   ├── aggregation.service.ts
│   └── comparison.service.ts
├── lib.ts           # Main library entry point
├── sdk.ts           # SDK with builder patterns
└── cli.ts           # Command-line interface
```

### Design Principles

1. **Glue-Level Only** — No simulation engines, algorithms, or storage implementations
2. **Pure Coordination** — Orchestrates external systems via adapters
3. **Framework Agnostic** — Handlers work with any transport (HTTP, CLI, events)
4. **Dependency Injection** — Services accept adapters for testability

## API Reference

### ResearchCore

Main facade for research coordination.

```typescript
class ResearchCore {
  coordinateSimulation(request: SimpleResearchRequest): Promise<CoordinationResponse>
  monitorProgress(runId: string): Promise<SimulationRun>
  cancelSimulation(runId: string): Promise<void>
  retrySimulation(runId: string): Promise<CoordinationResponse>
}
```

### Services

| Service | Purpose |
|---------|---------|
| `CoordinationService` | Orchestrates simulation runs across adapters |
| `NormalizationService` | Coordinates schema-based data normalization |
| `AggregationService` | Coordinates result aggregation via research-lab |
| `ComparisonService` | Coordinates model comparisons via research-lab |

### Adapters

| Adapter | Integration |
|---------|-------------|
| `SchemaRegistryAdapter` | LLM-Schema-Registry for validation |
| `SimulatorAdapter` | LLM-Simulator for execution |
| `ResearchLabAdapter` | LLM-Research-Lab for analysis |

## Configuration

### Adapter Configuration

```typescript
import {
  SchemaRegistryAdapter,
  SimulatorAdapter,
  ResearchLabAdapter
} from '@llm-research/core';

const schemaAdapter = new SchemaRegistryAdapter({
  endpoint: 'https://schema-registry.example.com',
  apiKey: process.env.SCHEMA_REGISTRY_API_KEY
});

const simulatorAdapter = new SimulatorAdapter({
  endpoint: 'https://simulator.example.com',
  apiKey: process.env.SIMULATOR_API_KEY,
  timeout: 30000
});

const researchLabAdapter = new ResearchLabAdapter({
  endpoint: 'https://research-lab.example.com',
  apiKey: process.env.RESEARCH_LAB_API_KEY
});
```

### Custom Service Injection

```typescript
import {
  ResearchCore,
  CoordinationService,
  SimulatorAdapter,
  SchemaRegistryAdapter
} from '@llm-research/core';

const coordinationService = new CoordinationService(
  new SimulatorAdapter({ endpoint: 'custom-endpoint' }),
  new SchemaRegistryAdapter()
);

const research = new ResearchCore({ coordinationService });
```

## Development

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

### Setup

```bash
git clone https://github.com/your-org/research-core.git
cd research-core
npm install --legacy-peer-deps
```

### Build

```bash
npm run build        # Compile TypeScript
npm run dev          # Watch mode
npm run clean        # Remove dist/
```

### Test

```bash
npm test             # Run tests
npm run test:watch   # Watch mode
```

## Type Definitions

The package exports comprehensive TypeScript types:

```typescript
import type {
  // Request/Response
  ResearchRequest,
  SimpleResearchRequest,
  CoordinationResponse,

  // Simulation
  SimulationConfig,
  SimulationRun,
  SimulationResult,
  SimulationStatus,

  // Results
  ExperimentOutput,
  NormalizedResultLegacy,
  AggregatedMetricsLegacy,
  ComparisonResultLegacy,

  // Configuration
  ModelConfig,
  SchemaDefinition,

  // Enums
  LLMProvider,
  RunStatus,
  MetricType
} from '@llm-research/core';
```

## Layer-3 Compliance

This repository adheres to Layer-3 architectural constraints:

| Constraint | Status |
|------------|--------|
| No infrastructure ownership (retry, metrics, logging, config) | Compliant |
| No algorithm implementation (statistics, ML, evaluation) | Compliant |
| No storage engines | Compliant |
| Pure coordination and delegation | Compliant |
| Simulator compatibility | Compliant |

## License

See [LICENSE.md](./LICENSE.md) for license terms.

## Related Packages

- [@llm-research/schema-registry](https://github.com/your-org/schema-registry) — Schema validation and normalization
- [@llm-research/simulator](https://github.com/your-org/simulator) — Simulation execution engine
- [@llm-research/research-lab](https://github.com/your-org/research-lab) — Statistical analysis and comparison
