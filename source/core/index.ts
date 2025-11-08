/**
 * Core Layer Exports
 * Public API for the core business logic layer
 */

// Domain Models
export { Message } from './domain/models/Message';
export { Conversation } from './domain/models/Conversation';
export { Turn } from './domain/models/Turn';
export { Configuration } from './domain/models/Configuration';

// Value Objects
export { Provider, ProviderInfo } from './domain/valueObjects/Provider';
export { InputType, InputClassification } from './domain/valueObjects/InputType';
export { ModelInfo, ModelRegistry } from './domain/valueObjects/ModelInfo';

// Interfaces
export type {
  IApiClient,
  ApiRequest,
  ApiResponse,
  StreamChunk,
  Tool as ITool,
  ToolCall,
} from './domain/interfaces/IApiClient';
export type {
  IConfigRepository,
  ConfigData,
} from './domain/interfaces/IConfigRepository';
export type {
  IHistoryRepository,
  ConversationHistory,
} from './domain/interfaces/IHistoryRepository';
export type {
  IToolExecutor,
  ToolDefinition,
  ToolExecutionResult,
} from './domain/interfaces/IToolExecutor';

// Application Services
export { InputClassifier } from './application/services/InputClassifier';
export { OutputFormatter, OutputType } from './application/services/OutputFormatter';

// Orchestrators
export { CodehClient } from './application/CodehClient';
export { CodehChat } from './application/CodehChat';

// Tools
export { Tool } from './tools/base/Tool';
export { ToolRegistry } from './tools/base/ToolRegistry';
export { ShellTool } from './tools/Shell';
export { FileOpsTool } from './tools/FileOps';

// DI Container
export { Container } from './di/Container';
export { setupContainer, createContainer } from './di/setup';
