/**
 * Infrastructure Layer Exports
 * Public API for the infrastructure layer
 */

// API Clients
export {HttpClient} from './api/HttpClient';
export {AnthropicClient} from './api/clients/AnthropicClient';
export {OpenAIClient} from './api/clients/OpenAIClient';
export {OllamaClient} from './api/clients/OllamaClient';
export {GenericClient} from './api/clients/GenericClient';
export {ApiClientFactory} from './api/ApiClientFactory';

// Configuration
export {EnvConfigRepository} from './config/EnvConfigRepository';
export {FileConfigRepository} from './config/FileConfigRepository';
export {ConfigLoader} from './config/ConfigLoader';

// History
export {InMemoryHistoryRepository} from './history/InMemoryHistoryRepository';

// File System
export {FileOperations} from './filesystem/FileOperations';
export type {FileInfo} from './filesystem/FileOperations';

// Process Execution
export {ShellExecutor} from './process/ShellExecutor';
export type {CommandResult, CommandOptions} from './process/ShellExecutor';
export {CommandValidator} from './process/CommandValidator';
