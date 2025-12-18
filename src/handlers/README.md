# Handlers Layer

The handlers layer provides thin entry points for processing requests in LLM-Research-Core. Handlers are framework-agnostic and can be wrapped for HTTP APIs, CLI tools, or other interfaces.

## Architecture Principles

Handlers follow these strict principles:

1. **Input Validation**: Validate requests using schema adapters
2. **Delegation**: Delegate business logic to coordination service
3. **Output Normalization**: Return standardized response formats
4. **No Business Logic**: Handlers contain NO business logic
5. **No Infrastructure**: Handlers are agnostic to transport/framework
6. **Error Handling**: Graceful error handling with structured responses

## Available Handlers

### 1. ResearchRequestHandler

Handles standardized research requests.

```typescript
import { createResearchRequestHandler } from './handlers';

const handler = createResearchRequestHandler({
  schemaAdapter,
  coordinationService,
  validateSchema: true, // optional, defaults to true
});

const response = await handler.handle({
  query: 'What are the latest advances in LLM reasoning?',
  constraints: {
    maxDepth: 3,
    timeout: 30000,
  },
});
```

**Responsibilities:**
- Validates research request format
- Delegates to coordination service
- Returns normalized research results

### 2. SimulationRunHandler

Handles simulation run requests.

```typescript
import { createSimulationRunHandler } from './handlers';

const handler = createSimulationRunHandler({
  schemaAdapter,
  coordinationService,
  validateSchema: true, // optional
  defaultIterations: 1, // optional
});

const response = await handler.handle({
  scenario: 'multi-agent-collaboration',
  parameters: {
    variables: { agentCount: 5, rounds: 10 },
    seed: 12345,
  },
  iterations: 100,
});
```

**Responsibilities:**
- Validates simulation request format
- Applies default iteration count if not specified
- Coordinates with simulator adapter via coordination service
- Returns simulation results

### 3. ExperimentOutputHandler

Handles requests for experimental outputs.

```typescript
import { createExperimentOutputHandler } from './handlers';

const handler = createExperimentOutputHandler({
  schemaAdapter,
  coordinationService,
  validateSchema: true, // optional
  enableAggregation: true, // optional
});

const response = await handler.handle({
  experimentId: 'exp-2024-001',
  filters: {
    startDate: new Date('2024-01-01'),
    status: ['completed'],
  },
  aggregation: {
    format: 'summary',
    groupBy: ['modelType'],
  },
});
```

**Responsibilities:**
- Validates experiment output request
- Retrieves data from research lab adapter via coordination service
- Normalizes and aggregates results
- Returns structured experiment outputs

## Response Format

All handlers return a standardized response:

```typescript
interface HandlerResponse<T> {
  success: boolean;
  data?: T;
  error?: HandlerError;
}

interface HandlerError {
  code: string;
  message: string;
  details?: unknown;
}
```

## Error Codes

Common error codes returned by handlers:

- `VALIDATION_ERROR`: Input validation failed
- `INVALID_EXPERIMENT_ID`: Experiment ID is missing or invalid
- `HANDLER_ERROR`: General handler execution error

## Usage Patterns

### HTTP API Wrapper

```typescript
import express from 'express';

const app = express();

app.post('/api/research', async (req, res) => {
  const response = await researchRequestHandler.handle(req.body);
  res.status(response.success ? 200 : 400).json(response);
});
```

### CLI Wrapper

```typescript
import { Command } from 'commander';

const program = new Command();

program
  .command('research <query>')
  .action(async (query) => {
    const response = await researchRequestHandler.handle({ query });
    if (response.success) {
      console.log(JSON.stringify(response.data, null, 2));
    } else {
      console.error(response.error);
      process.exit(1);
    }
  });
```

### Event-Driven Wrapper

```typescript
eventBus.on('research.requested', async (event) => {
  const response = await researchRequestHandler.handle(event.payload);
  eventBus.emit('research.completed', response);
});
```

## Testing

Handlers are designed to be easily testable by mocking dependencies:

```typescript
import { describe, it, expect, vi } from 'vitest';

describe('ResearchRequestHandler', () => {
  it('should validate and delegate to coordination service', async () => {
    const mockSchemaAdapter = {
      validate: vi.fn().mockReturnValue({ valid: true }),
    };
    const mockCoordinationService = {
      executeResearch: vi.fn().mockResolvedValue({ id: '123', ... }),
    };

    const handler = createResearchRequestHandler({
      schemaAdapter: mockSchemaAdapter,
      coordinationService: mockCoordinationService,
    });

    const response = await handler.handle({ query: 'test' });

    expect(response.success).toBe(true);
    expect(mockSchemaAdapter.validate).toHaveBeenCalled();
    expect(mockCoordinationService.executeResearch).toHaveBeenCalled();
  });
});
```

## Dependencies

Handlers depend on:

- **SchemaAdapter**: For input validation
- **CoordinationService**: For business logic execution
- **Types**: From `../types/index.js`

## Best Practices

1. **Keep handlers thin**: No business logic
2. **Validate early**: Always validate input before delegation
3. **Handle errors gracefully**: Return structured error responses
4. **Use factory functions**: Prefer `createXHandler()` for dependency injection
5. **Type safety**: Leverage TypeScript for compile-time safety
6. **Framework agnostic**: Keep handlers independent of transport layer
