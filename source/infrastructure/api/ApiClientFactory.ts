/**
 * API Client Factory
 * Creates appropriate API client based on configuration
 */

import {IApiClient} from '../../core/domain/interfaces/IApiClient';
import {Configuration} from '../../core/domain/models/Configuration';
import {Provider} from '../../core/domain/valueObjects/Provider';
// SDK Adapters (Official SDKs)
import {AnthropicSDKAdapter} from './clients/AnthropicSDKAdapter.js';
import {OpenAISDKAdapter} from './clients/OpenAISDKAdapter.js';
import {OllamaSDKAdapter} from './clients/OllamaSDKAdapter.js';
import {GenericSDKAdapter} from './clients/GenericSDKAdapter.js';

export class ApiClientFactory {
	create(config: Configuration): IApiClient {
		// Use SDK adapters (official SDKs from providers)
		switch (config.provider) {
			case Provider.ANTHROPIC:
				if (!config.apiKey) {
					throw new Error('API key is required for Anthropic');
				}
				return new AnthropicSDKAdapter(
					config.apiKey,
					config.baseUrl || 'https://api.anthropic.com',
				);

			case Provider.OPENAI:
				if (!config.apiKey) {
					throw new Error('API key is required for OpenAI');
				}
				return new OpenAISDKAdapter(
					config.apiKey,
					config.baseUrl || 'https://api.openai.com/v1',
				);

			case Provider.OLLAMA:
				return new OllamaSDKAdapter(
					config.baseUrl || 'http://localhost:11434',
				);

			case Provider.GENERIC:
				if (!config.baseUrl) {
					throw new Error('Base URL is required for Generic API');
				}
				return new GenericSDKAdapter(config.baseUrl, config.apiKey);

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
