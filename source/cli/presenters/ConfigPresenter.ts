/**
 * Config Presenter
 * Handles business logic for Config screen
 */

import {ConfigLoader} from '../../infrastructure/config/ConfigLoader';
import {Configuration} from '../../core/domain/models/Configuration';
import {Provider} from '../../core/domain/valueObjects/Provider';
import {ConfigViewModel} from './types';
import {getLogger} from '../../infrastructure/logging/Logger.js';

const logger = getLogger();

export class ConfigPresenter {
	private loader: ConfigLoader;

	constructor() {
		logger.info('ConfigPresenter', 'constructor', 'Initializing Config presenter');
		this.loader = new ConfigLoader();
		logger.debug('ConfigPresenter', 'constructor', 'Config presenter initialized');
	}

	/**
	 * Get current configuration
	 */
	async getConfiguration(): Promise<ConfigViewModel> {
		const start = Date.now();
		logger.info('ConfigPresenter', 'getConfiguration', 'Getting configuration');

		try {
			const config = await this.loader.load();

			if (!config) {
				const duration = Date.now() - start;
				logger.warn('ConfigPresenter', 'getConfiguration', 'No configuration found', {
					duration_ms: duration,
				});

				return {
					provider: '',
					model: '',
					isValid: false,
					errors: ['No configuration found'],
				};
			}

			const viewModel: ConfigViewModel = {
				provider: config.provider,
				model: config.model,
				baseUrl: config.baseUrl,
				isValid: config.isValid(),
				errors: config.getValidationErrors(),
			};

			const duration = Date.now() - start;
			logger.info('ConfigPresenter', 'getConfiguration', 'Configuration retrieved', {
				duration_ms: duration,
				provider: viewModel.provider,
				model: viewModel.model,
				is_valid: viewModel.isValid,
				error_count: viewModel.errors.length,
			});

			return viewModel;
		} catch (error: any) {
			const duration = Date.now() - start;
			logger.error('ConfigPresenter', 'getConfiguration', 'Failed to get configuration', {
				duration_ms: duration,
				error: error.message,
			});

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
	}): Promise<{success: boolean; error?: string}> {
		const start = Date.now();
		logger.info('ConfigPresenter', 'saveConfiguration', 'Saving configuration', {
			provider: data.provider,
			model: data.model,
			has_api_key: !!data.apiKey,
			has_base_url: !!data.baseUrl,
			max_tokens: data.maxTokens,
		});

		try {
			const config = Configuration.create(data);

			if (!config.isValid()) {
				const errors = config.getValidationErrors();
				const duration = Date.now() - start;
				logger.warn('ConfigPresenter', 'saveConfiguration', 'Configuration validation failed', {
					duration_ms: duration,
					errors: errors,
				});

				return {
					success: false,
					error: errors.join(', '),
				};
			}

			await this.loader.save(config);

			const duration = Date.now() - start;
			logger.info('ConfigPresenter', 'saveConfiguration', 'Configuration saved successfully', {
				duration_ms: duration,
				provider: data.provider,
				model: data.model,
			});

			return {success: true};
		} catch (error: any) {
			const duration = Date.now() - start;
			logger.error('ConfigPresenter', 'saveConfiguration', 'Failed to save configuration', {
				duration_ms: duration,
				error: error.message,
			});

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
		const start = Date.now();
		logger.info('ConfigPresenter', 'validateConfiguration', 'Validating configuration');

		try {
			const result = await this.loader.validate();

			const duration = Date.now() - start;
			logger.info('ConfigPresenter', 'validateConfiguration', 'Configuration validated', {
				duration_ms: duration,
				is_valid: result.valid,
				error_count: result.errors.length,
			});

			return result;
		} catch (error) {
			const duration = Date.now() - start;
			logger.error('ConfigPresenter', 'validateConfiguration', 'Validation failed', {
				duration_ms: duration,
				error: error instanceof Error ? error.message : String(error),
			});
			throw error;
		}
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
		const start = Date.now();
		logger.info('ConfigPresenter', 'getStatus', 'Getting configuration status');

		try {
			const status = await this.loader.getStatus();

			const duration = Date.now() - start;
			logger.info('ConfigPresenter', 'getStatus', 'Configuration status retrieved', {
				duration_ms: duration,
				has_env_config: status.hasEnvConfig,
				has_file_config: status.hasFileConfig,
				provider: status.provider,
				model: status.model,
			});

			return status;
		} catch (error) {
			const duration = Date.now() - start;
			logger.error('ConfigPresenter', 'getStatus', 'Failed to get status', {
				duration_ms: duration,
				error: error instanceof Error ? error.message : String(error),
			});
			throw error;
		}
	}

	/**
	 * Get available providers
	 */
	getProviders() {
		logger.debug('ConfigPresenter', 'getProviders', 'Getting available providers');

		const providers = [
			{value: Provider.ANTHROPIC, label: 'Anthropic (Claude)'},
			{value: Provider.OPENAI, label: 'OpenAI (GPT)'},
			{value: Provider.OLLAMA, label: 'Ollama (Local)'},
			{value: Provider.GENERIC, label: 'Generic API'},
		];

		logger.debug('ConfigPresenter', 'getProviders', 'Providers retrieved', {
			provider_count: providers.length,
		});

		return providers;
	}
}
