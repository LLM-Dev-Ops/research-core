/**
 * LLM-Research-Core Type Definitions
 *
 * Comprehensive type contracts for the LLM-Research-Core system.
 * These types serve as thin glue contracts between external systems:
 * - LLM-Schema-Registry (schema definitions and validation)
 * - LLM-Simulator (simulation execution)
 * - LLM-Research-Lab (experimental outputs)
 */

// ============================================================================
// ENUMS AND CONSTANTS
// ============================================================================

/**
 * Supported LLM providers for research experiments
 */
export enum LLMProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GOOGLE = 'google',
  COHERE = 'cohere',
  MISTRAL = 'mistral',
  META = 'meta',
  CUSTOM = 'custom'
}

/**
 * Status of a research run or experiment
 */
export enum RunStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  PARTIAL = 'partial'
}

/**
 * Metric types for evaluation
 */
export enum MetricType {
  ACCURACY = 'accuracy',
  PRECISION = 'precision',
  RECALL = 'recall',
  F1_SCORE = 'f1_score',
  LATENCY = 'latency',
  THROUGHPUT = 'throughput',
  COST = 'cost',
  TOKEN_COUNT = 'token_count',
  ERROR_RATE = 'error_rate',
  CUSTOM = 'custom'
}

/**
 * Comparison operators for result analysis
 */
export enum ComparisonOperator {
  GREATER_THAN = 'gt',
  LESS_THAN = 'lt',
  EQUAL = 'eq',
  GREATER_THAN_OR_EQUAL = 'gte',
  LESS_THAN_OR_EQUAL = 'lte',
  NOT_EQUAL = 'neq'
}

// ============================================================================
// SCHEMA REGISTRY INTEGRATION TYPES
// ============================================================================

/**
 * Reference to a schema in LLM-Schema-Registry
 */
export interface SchemaReference {
  readonly schemaId: string;
  readonly version: string;
  readonly namespace?: string;
}

/**
 * Schema validation result from Schema-Registry
 */
export interface SchemaValidationResult {
  readonly valid: boolean;
  readonly errors?: ReadonlyArray<ValidationError>;
  readonly schemaRef: SchemaReference;
}

/**
 * Individual validation error
 */
export interface ValidationError {
  readonly path: string;
  readonly message: string;
  readonly code?: string;
  readonly severity: 'error' | 'warning';
}

/**
 * Schema metadata from Schema-Registry
 */
export interface SchemaMetadata {
  readonly id: string;
  readonly version: string;
  readonly namespace: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly description?: string;
  readonly tags?: ReadonlyArray<string>;
}

// ============================================================================
// RESEARCH REQUEST TYPES
// ============================================================================

/**
 * Core research request input format
 */
export interface ResearchRequest<TParams = unknown> {
  readonly requestId: string;
  readonly name: string;
  readonly description?: string;
  readonly schemaRef: SchemaReference;
  readonly parameters: TParams;
  readonly metadata?: ResearchRequestMetadata;
}

/**
 * Metadata for research requests
 */
export interface ResearchRequestMetadata {
  readonly createdAt: string;
  readonly createdBy?: string;
  readonly tags?: ReadonlyArray<string>;
  readonly priority?: number;
  readonly timeout?: number;
  readonly retryPolicy?: RetryPolicy;
}

/**
 * Retry policy configuration
 */
export interface RetryPolicy {
  readonly maxRetries: number;
  readonly retryDelayMs: number;
  readonly backoffMultiplier?: number;
  readonly retryableErrors?: ReadonlyArray<string>;
}

/**
 * Prompt configuration for research experiments
 */
export interface PromptConfig {
  readonly template: string;
  readonly variables?: Record<string, unknown>;
  readonly systemPrompt?: string;
  readonly examples?: ReadonlyArray<PromptExample>;
}

/**
 * Example for few-shot prompting
 */
export interface PromptExample {
  readonly input: string;
  readonly output: string;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Model configuration for experiments
 */
export interface ModelConfig {
  readonly provider: LLMProvider;
  readonly modelId: string;
  readonly temperature?: number;
  readonly maxTokens?: number;
  readonly topP?: number;
  readonly topK?: number;
  readonly frequencyPenalty?: number;
  readonly presencePenalty?: number;
  readonly stopSequences?: ReadonlyArray<string>;
  readonly additionalParams?: Record<string, unknown>;
}

// ============================================================================
// SIMULATION RUN TYPES (LLM-Simulator Integration)
// ============================================================================

/**
 * Simulation run request for LLM-Simulator
 */
export interface SimulationRunRequest {
  readonly runId: string;
  readonly researchRequestId: string;
  readonly modelConfig: ModelConfig;
  readonly promptConfig: PromptConfig;
  readonly datasetRef?: DatasetReference;
  readonly simulationParams: SimulationParameters;
  readonly metadata?: SimulationRunMetadata;
}

/**
 * Reference to a dataset
 */
export interface DatasetReference {
  readonly datasetId: string;
  readonly version?: string;
  readonly subset?: string;
  readonly sampleSize?: number;
}

/**
 * Parameters for simulation execution
 */
export interface SimulationParameters {
  readonly iterations?: number;
  readonly parallelism?: number;
  readonly samplingStrategy?: 'random' | 'sequential' | 'stratified';
  readonly seed?: number;
  readonly timeoutPerRequest?: number;
  readonly customParams?: Record<string, unknown>;
}

/**
 * Metadata for simulation runs
 */
export interface SimulationRunMetadata {
  readonly startedAt?: string;
  readonly completedAt?: string;
  readonly executor?: string;
  readonly environment?: EnvironmentInfo;
  readonly tags?: ReadonlyArray<string>;
}

/**
 * Environment information for reproducibility
 */
export interface EnvironmentInfo {
  readonly platform: string;
  readonly runtime: string;
  readonly version: string;
  readonly additionalInfo?: Record<string, unknown>;
}

/**
 * Simulation run result from LLM-Simulator
 */
export interface SimulationRunResult {
  readonly runId: string;
  readonly status: RunStatus;
  readonly outputs: ReadonlyArray<SimulationOutput>;
  readonly metrics?: SimulationMetrics;
  readonly errors?: ReadonlyArray<SimulationError>;
  readonly metadata: SimulationRunMetadata;
}

/**
 * Individual simulation output
 */
export interface SimulationOutput {
  readonly outputId: string;
  readonly input: string;
  readonly output: string;
  readonly tokenUsage?: TokenUsage;
  readonly latencyMs?: number;
  readonly timestamp: string;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Token usage statistics
 */
export interface TokenUsage {
  readonly promptTokens: number;
  readonly completionTokens: number;
  readonly totalTokens: number;
}

/**
 * Metrics from simulation run
 */
export interface SimulationMetrics {
  readonly totalRequests: number;
  readonly successfulRequests: number;
  readonly failedRequests: number;
  readonly averageLatencyMs: number;
  readonly totalTokensUsed: number;
  readonly totalCost?: number;
  readonly customMetrics?: Record<string, number>;
}

/**
 * Simulation error information
 */
export interface SimulationError {
  readonly errorId: string;
  readonly code: string;
  readonly message: string;
  readonly timestamp: string;
  readonly context?: Record<string, unknown>;
  readonly retryable: boolean;
}

// ============================================================================
// EXPERIMENTAL OUTPUT TYPES (LLM-Research-Lab Integration)
// ============================================================================

/**
 * Experimental run configuration for Research-Lab
 */
export interface ExperimentConfig {
  readonly experimentId: string;
  readonly name: string;
  readonly description?: string;
  readonly hypothesis?: string;
  readonly simulationRuns: ReadonlyArray<SimulationRunRequest>;
  readonly evaluationCriteria: ReadonlyArray<EvaluationCriterion>;
  readonly metadata?: ExperimentMetadata;
}

/**
 * Evaluation criterion for experiments
 */
export interface EvaluationCriterion {
  readonly metricType: MetricType;
  readonly threshold?: number;
  readonly weight?: number;
  readonly customEvaluator?: string;
  readonly parameters?: Record<string, unknown>;
}

/**
 * Metadata for experiments
 */
export interface ExperimentMetadata {
  readonly createdAt: string;
  readonly createdBy?: string;
  readonly project?: string;
  readonly tags?: ReadonlyArray<string>;
  readonly baseline?: string;
}

/**
 * Experimental output from Research-Lab
 */
export interface ExperimentalOutput {
  readonly experimentId: string;
  readonly status: RunStatus;
  readonly simulationResults: ReadonlyArray<SimulationRunResult>;
  readonly evaluationResults: ReadonlyArray<EvaluationResult>;
  readonly aggregatedMetrics: AggregatedMetrics;
  readonly insights?: ReadonlyArray<Insight>;
  readonly metadata: ExperimentOutputMetadata;
}

/**
 * Result of evaluating against a criterion
 */
export interface EvaluationResult {
  readonly criterionId: string;
  readonly metricType: MetricType;
  readonly score: number;
  readonly passed: boolean;
  readonly details?: Record<string, unknown>;
}

/**
 * Aggregated metrics across simulation runs
 */
export interface AggregatedMetrics {
  readonly metrics: Record<string, MetricValue>;
  readonly summary: MetricsSummary;
}

/**
 * Individual metric value with statistics
 */
export interface MetricValue {
  readonly mean: number;
  readonly median: number;
  readonly stdDev: number;
  readonly min: number;
  readonly max: number;
  readonly percentiles?: Record<number, number>;
}

/**
 * Summary of all metrics
 */
export interface MetricsSummary {
  readonly totalSamples: number;
  readonly successRate: number;
  readonly overallScore?: number;
  readonly customSummary?: Record<string, unknown>;
}

/**
 * AI-generated or rule-based insights
 */
export interface Insight {
  readonly id: string;
  readonly type: 'observation' | 'recommendation' | 'anomaly' | 'pattern';
  readonly title: string;
  readonly description: string;
  readonly confidence?: number;
  readonly supportingData?: Record<string, unknown>;
}

/**
 * Metadata for experimental output
 */
export interface ExperimentOutputMetadata {
  readonly startedAt: string;
  readonly completedAt: string;
  readonly duration: number;
  readonly environment: EnvironmentInfo;
  readonly version: string;
}

// ============================================================================
// NORMALIZED RESULT TYPES
// ============================================================================

/**
 * Normalized result format (unified output)
 */
export interface NormalizedResult<TData = unknown> {
  readonly resultId: string;
  readonly sourceType: 'simulation' | 'experiment' | 'custom';
  readonly sourceId: string;
  readonly data: TData;
  readonly schema: SchemaReference;
  readonly validation: SchemaValidationResult;
  readonly metrics: ResultMetrics;
  readonly timestamp: string;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Metrics for normalized results
 */
export interface ResultMetrics {
  readonly quality: number;
  readonly completeness: number;
  readonly consistency: number;
  readonly customMetrics?: Record<string, number>;
}

/**
 * Batch of normalized results
 */
export interface NormalizedResultBatch<TData = unknown> {
  readonly batchId: string;
  readonly results: ReadonlyArray<NormalizedResult<TData>>;
  readonly summary: BatchSummary;
  readonly createdAt: string;
}

/**
 * Summary for a batch of results
 */
export interface BatchSummary {
  readonly totalResults: number;
  readonly validResults: number;
  readonly invalidResults: number;
  readonly averageQuality: number;
  readonly processingTimeMs: number;
}

// ============================================================================
// AGGREGATED RESULT TYPES
// ============================================================================

/**
 * Aggregated research results combining multiple sources
 */
export interface AggregatedResearchResult {
  readonly aggregationId: string;
  readonly researchRequestId: string;
  readonly experimentIds: ReadonlyArray<string>;
  readonly combinedMetrics: CombinedMetrics;
  readonly crossExperimentInsights: ReadonlyArray<CrossExperimentInsight>;
  readonly recommendations: ReadonlyArray<Recommendation>;
  readonly metadata: AggregationMetadata;
}

/**
 * Combined metrics across experiments
 */
export interface CombinedMetrics {
  readonly metrics: Record<string, AggregatedMetricValue>;
  readonly correlations?: ReadonlyArray<MetricCorrelation>;
  readonly trends?: ReadonlyArray<MetricTrend>;
}

/**
 * Aggregated metric value with advanced statistics
 */
export interface AggregatedMetricValue extends MetricValue {
  readonly variance: number;
  readonly confidenceInterval?: ConfidenceInterval;
  readonly distribution?: Distribution;
}

/**
 * Confidence interval for statistical analysis
 */
export interface ConfidenceInterval {
  readonly level: number;
  readonly lower: number;
  readonly upper: number;
}

/**
 * Distribution information
 */
export interface Distribution {
  readonly type: 'normal' | 'uniform' | 'exponential' | 'custom';
  readonly parameters: Record<string, number>;
}

/**
 * Correlation between metrics
 */
export interface MetricCorrelation {
  readonly metric1: string;
  readonly metric2: string;
  readonly coefficient: number;
  readonly pValue?: number;
}

/**
 * Trend analysis for a metric
 */
export interface MetricTrend {
  readonly metric: string;
  readonly direction: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  readonly slope?: number;
  readonly significance?: number;
}

/**
 * Insight spanning multiple experiments
 */
export interface CrossExperimentInsight {
  readonly id: string;
  readonly type: 'comparison' | 'synthesis' | 'meta-analysis';
  readonly title: string;
  readonly description: string;
  readonly experimentIds: ReadonlyArray<string>;
  readonly confidence: number;
  readonly supportingEvidence: ReadonlyArray<Evidence>;
}

/**
 * Evidence supporting an insight
 */
export interface Evidence {
  readonly type: 'metric' | 'pattern' | 'statistical';
  readonly description: string;
  readonly source: string;
  readonly strength: number;
}

/**
 * Actionable recommendation
 */
export interface Recommendation {
  readonly id: string;
  readonly priority: 'high' | 'medium' | 'low';
  readonly category: string;
  readonly title: string;
  readonly description: string;
  readonly expectedImpact?: string;
  readonly implementationComplexity?: 'low' | 'medium' | 'high';
  readonly relatedMetrics?: ReadonlyArray<string>;
}

/**
 * Metadata for aggregation
 */
export interface AggregationMetadata {
  readonly createdAt: string;
  readonly aggregationStrategy: string;
  readonly dataQuality: DataQualityMetrics;
  readonly version: string;
}

/**
 * Data quality metrics
 */
export interface DataQualityMetrics {
  readonly completeness: number;
  readonly consistency: number;
  readonly accuracy: number;
  readonly timeliness: number;
}

// ============================================================================
// COMPARISON TYPES
// ============================================================================

/**
 * Comparison request between experiments or results
 */
export interface ComparisonRequest {
  readonly comparisonId: string;
  readonly name: string;
  readonly subjectIds: ReadonlyArray<string>;
  readonly comparisonType: 'experiment' | 'model' | 'prompt' | 'dataset';
  readonly metrics: ReadonlyArray<string>;
  readonly parameters?: ComparisonParameters;
}

/**
 * Parameters for comparison
 */
export interface ComparisonParameters {
  readonly baselineId?: string;
  readonly normalizeMetrics?: boolean;
  readonly statisticalTests?: ReadonlyArray<string>;
  readonly confidenceLevel?: number;
  readonly customParams?: Record<string, unknown>;
}

/**
 * Comparison result
 */
export interface ComparisonResult {
  readonly comparisonId: string;
  readonly subjects: ReadonlyArray<ComparisonSubject>;
  readonly metricComparisons: ReadonlyArray<MetricComparison>;
  readonly ranking?: ReadonlyArray<RankingEntry>;
  readonly statisticalSignificance?: ReadonlyArray<SignificanceTest>;
  readonly summary: ComparisonSummary;
  readonly visualizations?: ReadonlyArray<VisualizationSpec>;
  readonly createdAt: string;
}

/**
 * Subject being compared
 */
export interface ComparisonSubject {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly metrics: Record<string, number>;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Comparison of a specific metric
 */
export interface MetricComparison {
  readonly metric: string;
  readonly values: ReadonlyArray<MetricValuePair>;
  readonly winner?: string;
  readonly relativeDifference?: number;
  readonly absoluteDifference?: number;
  readonly significant?: boolean;
}

/**
 * Metric value for a subject
 */
export interface MetricValuePair {
  readonly subjectId: string;
  readonly value: number;
  readonly normalized?: number;
}

/**
 * Ranking entry in comparison
 */
export interface RankingEntry {
  readonly rank: number;
  readonly subjectId: string;
  readonly score: number;
  readonly strengths?: ReadonlyArray<string>;
  readonly weaknesses?: ReadonlyArray<string>;
}

/**
 * Statistical significance test result
 */
export interface SignificanceTest {
  readonly testName: string;
  readonly metric: string;
  readonly subjectIds: ReadonlyArray<string>;
  readonly pValue: number;
  readonly significant: boolean;
  readonly effectSize?: number;
}

/**
 * Summary of comparison results
 */
export interface ComparisonSummary {
  readonly totalSubjects: number;
  readonly totalMetrics: number;
  readonly bestPerformer?: string;
  readonly keyFindings: ReadonlyArray<string>;
  readonly confidence: number;
}

/**
 * Specification for data visualization
 */
export interface VisualizationSpec {
  readonly id: string;
  readonly type: 'bar' | 'line' | 'scatter' | 'heatmap' | 'table';
  readonly title: string;
  readonly data: Record<string, unknown>;
  readonly config?: Record<string, unknown>;
}

// ============================================================================
// ADAPTER CONTRACT INTERFACES
// ============================================================================

/**
 * Adapter for Schema Registry integration
 */
export interface SchemaRegistryAdapter {
  validateSchema<T>(data: T, schemaRef: SchemaReference): Promise<SchemaValidationResult>;
  getSchema(schemaRef: SchemaReference): Promise<SchemaMetadata>;
  registerSchema(schema: unknown, metadata: Partial<SchemaMetadata>): Promise<SchemaReference>;
}

/**
 * Adapter for Simulator integration
 */
export interface SimulatorAdapter {
  executeSimulation(request: SimulationRunRequest): Promise<SimulationRunResult>;
  getSimulationStatus(runId: string): Promise<RunStatus>;
  cancelSimulation(runId: string): Promise<void>;
}

/**
 * Adapter for Research Lab integration
 */
export interface ResearchLabAdapter {
  runExperiment(config: ExperimentConfig): Promise<ExperimentalOutput>;
  getExperimentStatus(experimentId: string): Promise<RunStatus>;
  getExperimentResults(experimentId: string): Promise<ExperimentalOutput>;
}

/**
 * Adapter for result normalization
 */
export interface NormalizationAdapter<TInput, TOutput> {
  normalize(input: TInput): Promise<NormalizedResult<TOutput>>;
  normalizeBatch(inputs: ReadonlyArray<TInput>): Promise<NormalizedResultBatch<TOutput>>;
  validate(result: NormalizedResult<TOutput>): Promise<SchemaValidationResult>;
}

/**
 * Adapter for result aggregation
 */
export interface AggregationAdapter {
  aggregate(
    experimentOutputs: ReadonlyArray<ExperimentalOutput>
  ): Promise<AggregatedResearchResult>;
  addInsights(
    aggregation: AggregatedResearchResult,
    insights: ReadonlyArray<CrossExperimentInsight>
  ): Promise<AggregatedResearchResult>;
  generateRecommendations(
    aggregation: AggregatedResearchResult
  ): Promise<ReadonlyArray<Recommendation>>;
}

/**
 * Adapter for comparison operations
 */
export interface ComparisonAdapter {
  compare(request: ComparisonRequest): Promise<ComparisonResult>;
  rankSubjects(
    subjects: ReadonlyArray<ComparisonSubject>,
    metrics: ReadonlyArray<string>
  ): Promise<ReadonlyArray<RankingEntry>>;
  performStatisticalTests(
    subjects: ReadonlyArray<ComparisonSubject>,
    metrics: ReadonlyArray<string>,
    tests: ReadonlyArray<string>
  ): Promise<ReadonlyArray<SignificanceTest>>;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Generic response wrapper
 */
export interface ApiResponse<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: ApiError;
  readonly metadata?: ResponseMetadata;
}

/**
 * API error information
 */
export interface ApiError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
  readonly stack?: string;
}

/**
 * Response metadata
 */
export interface ResponseMetadata {
  readonly requestId: string;
  readonly timestamp: string;
  readonly duration: number;
  readonly version: string;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  readonly page: number;
  readonly pageSize: number;
  readonly sortBy?: string;
  readonly sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  readonly items: ReadonlyArray<T>;
  readonly pagination: PaginationInfo;
}

/**
 * Pagination information
 */
export interface PaginationInfo {
  readonly currentPage: number;
  readonly pageSize: number;
  readonly totalItems: number;
  readonly totalPages: number;
  readonly hasNext: boolean;
  readonly hasPrevious: boolean;
}

/**
 * Filter criteria for queries
 */
export interface FilterCriteria {
  readonly field: string;
  readonly operator: ComparisonOperator;
  readonly value: unknown;
}

/**
 * Query parameters
 */
export interface QueryParams {
  readonly filters?: ReadonlyArray<FilterCriteria>;
  readonly search?: string;
  readonly pagination?: PaginationParams;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard for checking if a value is a valid RunStatus
 */
export function isRunStatus(value: unknown): value is RunStatus {
  return Object.values(RunStatus).includes(value as RunStatus);
}

/**
 * Type guard for checking if a value is a valid MetricType
 */
export function isMetricType(value: unknown): value is MetricType {
  return Object.values(MetricType).includes(value as MetricType);
}

/**
 * Type guard for checking if a value is a valid LLMProvider
 */
export function isLLMProvider(value: unknown): value is LLMProvider {
  return Object.values(LLMProvider).includes(value as LLMProvider);
}

// ============================================================================
// EXPORTED TYPE UTILITIES
// ============================================================================

/**
 * Extract the data type from a NormalizedResult
 */
export type ExtractResultData<T> = T extends NormalizedResult<infer D> ? D : never;

/**
 * Make all properties in T optional recursively
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T[P] extends ReadonlyArray<infer U>
    ? ReadonlyArray<DeepPartial<U>>
    : T[P] extends object
    ? DeepPartial<T[P]>
    : T[P];
};

/**
 * Make all readonly properties in T mutable
 */
export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

/**
 * Extract keys from T where the value extends U
 */
export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

/**
 * Create a type with required fields from T
 */
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Union of all adapter types
 */
export type Adapter =
  | SchemaRegistryAdapter
  | SimulatorAdapter
  | ResearchLabAdapter
  | NormalizationAdapter<unknown, unknown>
  | AggregationAdapter
  | ComparisonAdapter;

// ============================================================================
// CONFIGURATION TYPES (for adapter constructors)
// ============================================================================

/**
 * Configuration for Schema Registry adapter
 */
export interface SchemaRegistryConfig {
  endpoint?: string;
  apiKey?: string;
}

/**
 * Configuration for Simulator adapter
 */
export interface SimulatorConfig {
  endpoint?: string;
  apiKey?: string;
  timeout?: number;
}

/**
 * Configuration for Research Lab adapter
 */
export interface ResearchLabConfig {
  endpoint?: string;
  apiKey?: string;
}

// ============================================================================
// LEGACY TYPES (for backward compatibility)
// ============================================================================

/**
 * Simple simulation config (legacy)
 */
export interface SimulationConfig {
  modelConfigs?: ModelConfig[];
  scenarioIds?: string[];
  iterations?: number;
  parameters?: Record<string, unknown>;
}

/**
 * Simulation run (legacy)
 */
export interface SimulationRun {
  id: string;
  requestId: string;
  status: SimulationStatus;
  startedAt?: Date;
  completedAt?: Date;
  results?: SimulationResult[];
  error?: string;
}

/**
 * Simulation status type (legacy)
 */
export type SimulationStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

/**
 * Simulation result (legacy)
 */
export interface SimulationResult {
  modelId: string;
  scenarioId: string;
  iteration: number;
  outputs: Record<string, unknown>;
  metrics?: Record<string, number>;
  timestamp: Date;
}

/**
 * Coordination response (legacy)
 */
export interface CoordinationResponse {
  runId: string;
  status: SimulationStatus;
  message?: string;
}

/**
 * Experiment output (legacy)
 */
export interface ExperimentOutput {
  id: string;
  experimentId: string;
  runId: string;
  normalizedResults: NormalizedResultLegacy[];
  aggregatedMetrics: AggregatedMetricsLegacy;
  comparisons?: ComparisonResultLegacy[];
  generatedAt: Date;
}

/**
 * Normalized result (legacy)
 */
export interface NormalizedResultLegacy {
  modelId: string;
  scenarioId: string;
  metrics: Record<string, number>;
  metadata?: Record<string, unknown>;
}

/**
 * Aggregated metrics (legacy)
 */
export interface AggregatedMetricsLegacy {
  byModel: Record<string, MetricsSummaryLegacy>;
  byScenario: Record<string, MetricsSummaryLegacy>;
  overall: MetricsSummaryLegacy;
}

/**
 * Metrics summary (legacy)
 */
export interface MetricsSummaryLegacy {
  mean: Record<string, number>;
  median: Record<string, number>;
  stdDev: Record<string, number>;
  min: Record<string, number>;
  max: Record<string, number>;
  count: number;
}

/**
 * Comparison result (legacy)
 */
export interface ComparisonResultLegacy {
  modelA: string;
  modelB: string;
  metricDifferences: Record<string, number>;
  statisticalSignificance?: Record<string, boolean>;
  winner?: string;
}

/**
 * Comparison response
 */
export interface ComparisonResponse {
  comparisons: ComparisonResultLegacy[];
  methodology: string;
}

/**
 * Normalization response
 */
export interface NormalizationResponse {
  normalizedResults: NormalizedResultLegacy[];
  schema: string;
}

/**
 * Aggregation response
 */
export interface AggregationResponse {
  aggregatedMetrics: AggregatedMetricsLegacy;
  resultCount: number;
}

/**
 * Schema adapter interface
 */
export interface SchemaAdapter {
  getSchema(schemaId: string): Promise<SchemaDefinition>;
  validateAgainstSchema(data: unknown, schemaId: string): Promise<boolean>;
  listSchemas(): Promise<string[]>;
}

/**
 * Schema definition
 */
export interface SchemaDefinition {
  id: string;
  version: string;
  fields: Record<string, FieldDefinition>;
}

/**
 * Field definition
 */
export interface FieldDefinition {
  type: string;
  required?: boolean;
  description?: string;
}

/**
 * Storage adapter interface
 */
export interface StorageAdapter {
  store(key: string, data: unknown): Promise<void>;
  retrieve(key: string): Promise<unknown>;
  list(prefix: string): Promise<string[]>;
  delete(key: string): Promise<void>;
}

/**
 * Simple research request (for coordination service)
 */
export interface SimpleResearchRequest {
  id: string;
  experimentId: string;
  simulationConfig: SimulationConfig;
  metadata?: Record<string, unknown>;
}
