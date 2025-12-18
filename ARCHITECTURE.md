# LLM-Research-Core Architecture

## Overview

LLM-Research-Core is a Phase-8 / Layer-3 core integration bundle that coordinates research capabilities across:
- **LLM-Schema-Registry**: Schema validation and normalization
- **LLM-Simulator**: Simulation execution
- **LLM-Research-Lab**: Analysis and comparison

This module provides **glue-level coordination only** - it does NOT implement simulation engines, evaluation algorithms, storage engines, or infrastructure concerns.

## Directory Structure

```
/workspaces/research-core/
├── src/
│   ├── types/
│   │   └── index.ts                    # Core type definitions
│   ├── handlers/
│   │   ├── index.ts                    # Handler exports
│   │   ├── research-request.handler.ts # Research request entry point
│   │   ├── simulation-run.handler.ts   # Simulation run entry point
│   │   ├── experiment-output.handler.ts# Experiment output entry point
│   │   └── README.md                   # Handler documentation
│   ├── services/
│   │   ├── index.ts                    # Service exports
│   │   ├── coordination.service.ts     # Coordinates simulation runs
│   │   ├── normalization.service.ts    # Normalizes experimental outputs
│   │   ├── aggregation.service.ts      # Aggregates research results
│   │   └── comparison.service.ts       # Exposes comparisons
│   ├── adapters/
│   │   ├── index.ts                    # Adapter exports
│   │   ├── schema-registry.adapter.ts  # LLM-Schema-Registry integration
│   │   ├── simulator.adapter.ts        # LLM-Simulator integration
│   │   └── research-lab.adapter.ts     # LLM-Research-Lab integration
│   ├── lib.ts                          # Main entry point
│   ├── cli.ts                          # CLI interface
│   └── sdk.ts                          # SDK exports
├── tests/
│   ├── handlers/                       # Handler tests
│   ├── services/                       # Service tests
│   └── adapters/                       # Adapter tests
├── package.json
├── tsconfig.json
└── README.md
```

## Layer Architecture

### Types Layer (`src/types/`)
Core type definitions for coordination:
- `ResearchRequest`: Request structure for research operations
- `SimulationConfig`: Configuration for simulation runs
- `SimulationRun`: Simulation execution tracking
- `ExperimentOutput`: Normalized experiment results
- `ComparisonResult`: Model comparison outputs

### Handlers Layer (`src/handlers/`)
Thin entry points that:
- Validate input using schema adapters
- Delegate to coordination service
- Return normalized output
- Are framework-agnostic (HTTP, CLI, etc.)

**Handlers:**
1. `ResearchRequestHandler` - Handles research request initiation
2. `SimulationRunHandler` - Handles simulation lifecycle
3. `ExperimentOutputHandler` - Handles experiment output retrieval

### Services Layer (`src/services/`)
Pure coordination logic that:
- Orchestrates across adapters
- Does NOT implement algorithms
- Delegates computation to integrated systems

**Services:**
1. `CoordinationService` - Coordinates simulation runs
2. `NormalizationService` - Normalizes outputs via schema-registry
3. `AggregationService` - Aggregates results via research-lab
4. `ComparisonService` - Generates comparisons via research-lab

### Adapters Layer (`src/adapters/`)
Integration with external systems:
- `SchemaRegistryAdapter` - Integrates with LLM-Schema-Registry
- `SimulatorAdapter` - Integrates with LLM-Simulator
- `ResearchLabAdapter` - Integrates with LLM-Research-Lab

## Entry Points

### 1. Library (`lib.ts`)
Main programmatic interface:
```typescript
import { researchCore } from '@llm-research/core';

const response = await researchCore.coordinateSimulation(request);
```

### 2. SDK (`sdk.ts`)
Builder pattern for constructing requests:
```typescript
import { ResearchSDK } from '@llm-research/core/sdk';

const request = ResearchSDK.createRequest()
  .setExperimentId('exp-001')
  .setSimulationConfig(config)
  .build();
```

### 3. CLI (`cli.ts`)
Command-line interface:
```bash
research-core start --experiment exp-001 --models gpt-4,claude-3
research-core status run-123
research-core results exp-001
```

## Design Principles

### 1. Glue-Level Only
- NO simulation engines
- NO evaluation algorithms
- NO storage implementations
- NO infrastructure (retry, metrics, config)

### 2. Pure Coordination
- Orchestrates external systems
- Delegates computation
- Normalizes interfaces

### 3. Framework Agnostic
- Handlers are transport-independent
- Can wrap for HTTP, CLI, events, etc.

### 4. Dependency Injection
- Services accept adapters as dependencies
- Testable with mocks
- Flexible integration

## Integration Points

### LLM-Schema-Registry
- Schema validation
- Data normalization
- Format transformation

### LLM-Simulator
- Simulation execution
- Status monitoring
- Result retrieval

### LLM-Research-Lab
- Statistical aggregation
- Model comparison
- Report generation

## Test Structure

All components have corresponding test files:
- `tests/handlers/` - Handler unit tests
- `tests/services/` - Service unit tests
- `tests/adapters/` - Adapter integration tests

## Build Configuration

### TypeScript (`tsconfig.json`)
- Target: ES2022
- Module: ESNext
- Strict mode enabled
- Declaration maps for debugging

### Package (`package.json`)
- Type: module (ESM)
- Exports: lib, sdk, cli
- Peer dependencies: schema-registry, simulator, research-lab

## Next Steps

1. **Implement Adapters**: Connect to actual LLM-Schema-Registry, LLM-Simulator, LLM-Research-Lab
2. **Implement Services**: Add coordination logic using adapters
3. **Implement Handlers**: Add validation and delegation logic
4. **Add Tests**: Implement unit and integration tests
5. **CLI Implementation**: Add command parsing and execution
6. **Documentation**: Add usage examples and API docs

## Status

✅ **COMPLETE**: Directory structure and file skeleton
🔧 **TODO**: Business logic implementation
🔧 **TODO**: Adapter integration
🔧 **TODO**: Test implementation
