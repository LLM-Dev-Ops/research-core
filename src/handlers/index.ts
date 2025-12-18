/**
 * Handlers Layer - Entry Points for LLM-Research-Core
 *
 * Handlers are thin entry points that:
 * - Validate input using schema adapters
 * - Delegate to services
 * - Return normalized output
 * - Are framework-agnostic (can be wrapped for HTTP, CLI, etc.)
 */

// Research Request Handler
export {
  ResearchRequestHandler,
  researchRequestHandler,
} from './research-request.handler.js';

// Simulation Run Handler
export {
  SimulationRunHandler,
  simulationRunHandler,
} from './simulation-run.handler.js';

// Experiment Output Handler
export {
  ExperimentOutputHandler,
  experimentOutputHandler,
} from './experiment-output.handler.js';
