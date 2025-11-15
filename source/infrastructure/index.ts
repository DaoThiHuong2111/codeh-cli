/**
 * Infrastructure Layer Exports
 * Public API for the infrastructure layer
 */

// API Clients
export {HttpClient} from './api/HttpClient';
export {ApiClientFactory} from './api/ApiClientFactory';

// SDK Adapters (Official SDKs)
export {AnthropicSDKAdapter} from './api/clients/AnthropicSDKAdapter';
export {OpenAISDKAdapter} from './api/clients/OpenAISDKAdapter';
export {OllamaSDKAdapter} from './api/clients/OllamaSDKAdapter';
export {GenericSDKAdapter} from './api/clients/GenericSDKAdapter';

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
