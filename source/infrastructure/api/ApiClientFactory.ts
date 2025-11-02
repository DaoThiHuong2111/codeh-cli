/**
 * API Client Factory
 * Creates appropriate API client based on configuration
 */

import { IApiClient } from '../../core/domain/interfaces/IApiClient';
import { Configuration } from '../../core/domain/models/Configuration';
import { Provider } from '../../core/domain/valueObjects/Provider';
import { AnthropicClient } from './clients/AnthropicClient';
import { OpenAIClient } from './clients/OpenAIClient';
import { OllamaClient } from './clients/OllamaClient';
import { GenericClient } from './clients/GenericClient';

export class ApiClientFactory {
  create(config: Configuration): IApiClient {
    switch (config.provider) {
      case Provider.ANTHROPIC:
        if (!config.apiKey) {
          throw new Error('API key is required for Anthropic');
        }
        return new AnthropicClient(config.apiKey, config.baseUrl);

      case Provider.OPENAI:
        if (!config.apiKey) {
          throw new Error('API key is required for OpenAI');
        }
        return new OpenAIClient(config.apiKey, config.baseUrl);

      case Provider.OLLAMA:
        return new OllamaClient(config.baseUrl);

      case Provider.GENERIC:
        if (!config.baseUrl) {
          throw new Error('Base URL is required for Generic API');
        }
        return new GenericClient(config.baseUrl, config.apiKey);

      default:
        throw new Error(`Unsupported provider: ${config.provider}`);
    }
  }

  createFromEnv(): IApiClient {
    // This will be implemented to read from environment
    // For now, throw error
    throw new Error('createFromEnv not implemented yet');
  }
}
