/**
 * Config Presenter
 * Handles business logic for Config screen
 */

import { ConfigLoader } from '../../infrastructure/config/ConfigLoader';
import { Configuration } from '../../core/domain/models/Configuration';
import { Provider } from '../../core/domain/valueObjects/Provider';
import { ConfigViewModel } from './types';

export class ConfigPresenter {
	private loader: ConfigLoader;

	constructor() {
		this.loader = new ConfigLoader();
	}

	/**
	 * Get current configuration
	 */
	async getConfiguration(): Promise<ConfigViewModel> {
		try {
			const config = await this.loader.load();

			if (!config) {
				return {
					provider: '',
					model: '',
					isValid: false,
					errors: ['No configuration found'],
				};
			}

			return {
				provider: config.provider,
				model: config.model,
				baseUrl: config.baseUrl,
				isValid: config.isValid(),
				errors: config.getValidationErrors(),
			};
		} catch (error: any) {
			return {
				provider: '',
				model: '',
				isValid: false,
				errors: [error.message],
			};
		}
	}

	/**
	 * Save configuration
	 */
	async saveConfiguration(data: {
		provider: string;
		model: string;
		apiKey?: string;
		baseUrl?: string;
		maxTokens?: number;
	}): Promise<{ success: boolean; error?: string }> {
		try {
			const config = Configuration.create(data);

			if (!config.isValid()) {
				return {
					success: false,
					error: config.getValidationErrors().join(', '),
				};
			}

			await this.loader.save(config);

			return { success: true };
		} catch (error: any) {
			return {
				success: false,
				error: error.message,
			};
		}
	}

	/**
	 * Validate configuration
	 */
	async validateConfiguration(): Promise<{
		valid: boolean;
		errors: string[];
	}> {
		return await this.loader.validate();
	}

	/**
	 * Get configuration status
	 */
	async getStatus(): Promise<{
		hasEnvConfig: boolean;
		hasFileConfig: boolean;
		provider?: string;
		model?: string;
	}> {
		return await this.loader.getStatus();
	}

	/**
	 * Get available providers
	 */
	getProviders() {
		return [
			{ value: Provider.ANTHROPIC, label: 'Anthropic (Claude)' },
			{ value: Provider.OPENAI, label: 'OpenAI (GPT)' },
			{ value: Provider.OLLAMA, label: 'Ollama (Local)' },
			{ value: Provider.GENERIC, label: 'Generic API' },
		];
	}
}
