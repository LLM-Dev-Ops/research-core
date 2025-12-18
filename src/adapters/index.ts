/**
 * Adapters Module
 *
 * Thin integration layer with external systems.
 * All adapters are injectable for testing.
 */

// Schema Registry Adapter
export {
  SchemaRegistryAdapter,
  schemaRegistryAdapter,
} from './schema-registry.adapter.js';

// Simulator Adapter
export {
  SimulatorAdapter,
  simulatorAdapter,
} from './simulator.adapter.js';

// Research Lab Adapter
export {
  ResearchLabAdapter,
  researchLabAdapter,
} from './research-lab.adapter.js';
