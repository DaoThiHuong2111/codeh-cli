/**
 * API Client Factory
 * Creates appropriate API client based on configuration
 */

import {IApiClient} from '../../core/domain/interfaces/IApiClient';
import {Configuration} from '../../core/domain/models/Configuration';
import {Provider} from '../../core/domain/valueObjects/Provider';
import {AnthropicClient} from './clients/AnthropicClient';
import {OpenAIClient} from './clients/OpenAIClient';
import {OllamaClient} from './clients/OllamaClient';
import {GenericClient} from './clients/GenericClient';
// SDK Adapters (Official SDKs)
import {AnthropicSDKAdapter} from './clients/AnthropicSDKAdapter.js';
import {OpenAISDKAdapter} from './clients/OpenAISDKAdapter.js';
import {OllamaSDKAdapter} from './clients/OllamaSDKAdapter.js';
import {GenericSDKAdapter} from './clients/GenericSDKAdapter.js';

export class ApiClientFactory {
	create(config: Configuration): IApiClient {
		// Feature flag: Use SDK adapters by default (useSDKAdapters = true)
		if (config.useSDKAdapters) {
			return this.createSDKAdapter(config);
		} else {
			console.warn(
				'⚠️  Using legacy HTTP client. SDK adapters are recommended for better reliability.',
			);
			return this.createLegacyClient(config);
		}
	}

	/**
	 * Create client using official SDKs (recommended)
	 */
	private createSDKAdapter(config: Configuration): IApiClient {
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

	/**
	 * Create client using legacy HTTP implementation (deprecated)
	 * @deprecated Use SDK adapters instead. Will be removed in v3.0
	 */
	private createLegacyClient(config: Configuration): IApiClient {
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
