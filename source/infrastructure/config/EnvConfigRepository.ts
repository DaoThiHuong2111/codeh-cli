/**
 * Environment Variable Config Repository
 * Reads configuration from environment variables
 * Only supports CODEH_* prefixed variables
 */

import {
	IConfigRepository,
	ConfigData,
} from '../../core/domain/interfaces/IConfigRepository';
import {isLoggingEnabled, getEnvInt, getEnvFloat} from './EnvUtils';
import {getLogger} from '../logging/Logger.js';

const logger = getLogger();

export class EnvConfigRepository implements IConfigRepository {
	private readonly envVars = [
		'CODEH_MODEL',
		'CODEH_BASE_URL',
		'CODEH_API_KEY',
		'CODEH_PROVIDER',
		'CODEH_MAX_TOKEN',
		'CODEH_TEMPERATURE',
		'CODEH_LOGGING',
	];

	async get(key: string): Promise<string | undefined> {
		logger.debug('EnvConfigRepository', 'get', 'Getting env value', {
			key,
		});

		const value = process.env[key];

		logger.debug('EnvConfigRepository', 'get', 'Env value retrieved', {
			key,
			found: value !== undefined,
		});

		return value;
	}

	async set(key: string, value: string): Promise<void> {
		logger.debug('EnvConfigRepository', 'set', 'Setting env value', {
			key,
		});

		process.env[key] = value;

		logger.debug('EnvConfigRepository', 'set', 'Env value set', {
			key,
		});
	}

	async getAll(): Promise<ConfigData | null> {
		logger.info('EnvConfigRepository', 'getAll', 'Getting all env configuration');

		const provider = await this.get('CODEH_PROVIDER');
		const model = await this.get('CODEH_MODEL');
		const baseUrl = await this.get('CODEH_BASE_URL');
		const apiKey = await this.get('CODEH_API_KEY');
		const maxTokens = await this.getMaxTokens();
		const temperature = await this.getTemperature();

		// If no provider is set, consider env config as not existing
		if (!provider) {
			logger.info('EnvConfigRepository', 'getAll', 'No provider set, returning null');
			return null;
		}

		const config = {
			provider: provider as any,
			model: model || '',
			baseUrl,
			apiKey,
			maxTokens,
			temperature,
		};

		logger.info('EnvConfigRepository', 'getAll', 'Env configuration retrieved', {
			provider: config.provider,
			model: config.model,
			has_base_url: !!config.baseUrl,
			has_api_key: !!config.apiKey,
			max_tokens: config.maxTokens,
			temperature: config.temperature,
		});

		return config;
	}

	async exists(): Promise<boolean> {
		logger.debug('EnvConfigRepository', 'exists', 'Checking if env config exists');

		const provider = await this.get('CODEH_PROVIDER');
		const exists = !!provider;

		logger.debug('EnvConfigRepository', 'exists', 'Env config existence checked', {
			exists,
		});

		return exists;
	}

	async delete(key: string): Promise<void> {
		logger.debug('EnvConfigRepository', 'delete', 'Deleting env variable', {
			key,
		});

		delete process.env[key];

		logger.debug('EnvConfigRepository', 'delete', 'Env variable deleted', {
			key,
		});
	}

	async clear(): Promise<void> {
		logger.info('EnvConfigRepository', 'clear', 'Clearing all env variables', {
			vars_to_clear: this.envVars.length,
		});

		this.envVars.forEach(key => {
			delete process.env[key];
		});

		logger.info('EnvConfigRepository', 'clear', 'All env variables cleared');
	}

	// Helper methods
	private async getMaxTokens(): Promise<number> {
		logger.debug('EnvConfigRepository', 'getMaxTokens', 'Getting max tokens from env');

		const maxTokens = getEnvInt('CODEH_MAX_TOKEN', 4096);

		logger.debug('EnvConfigRepository', 'getMaxTokens', 'Max tokens retrieved', {
			max_tokens: maxTokens,
		});

		return maxTokens;
	}

	private async getTemperature(): Promise<number> {
		logger.debug('EnvConfigRepository', 'getTemperature', 'Getting temperature from env');

		const temperature = getEnvFloat('CODEH_TEMPERATURE', 0.7);

		logger.debug('EnvConfigRepository', 'getTemperature', 'Temperature retrieved', {
			temperature,
		});

		return temperature;
	}

	// Validation
	async validate(): Promise<string[]> {
		logger.info('EnvConfigRepository', 'validate', 'Validating env configuration');

		const missing: string[] = [];

		const provider = await this.get('CODEH_PROVIDER');
		if (!provider) {
			missing.push('CODEH_PROVIDER');
			logger.debug('EnvConfigRepository', 'validate', 'Missing CODEH_PROVIDER');
		}

		const model = await this.get('CODEH_MODEL');
		if (!model) {
			missing.push('CODEH_MODEL');
			logger.debug('EnvConfigRepository', 'validate', 'Missing CODEH_MODEL');
		}

		const baseUrl = await this.get('CODEH_BASE_URL');
		if (!baseUrl) {
			missing.push('CODEH_BASE_URL');
			logger.debug('EnvConfigRepository', 'validate', 'Missing CODEH_BASE_URL');
		}

		const apiKey = await this.get('CODEH_API_KEY');
		// Ollama doesn't require API key
		if (!apiKey && provider !== 'ollama') {
			missing.push('CODEH_API_KEY');
			logger.debug('EnvConfigRepository', 'validate', 'Missing CODEH_API_KEY');
		}

		logger.info('EnvConfigRepository', 'validate', 'Validation completed', {
			is_valid: missing.length === 0,
			missing_count: missing.length,
			missing_vars: missing,
		});

		return missing;
	}

	async getAllEnvVars(): Promise<Record<string, string | undefined>> {
		logger.debug('EnvConfigRepository', 'getAllEnvVars', 'Getting all CODEH env vars', {
			vars_count: this.envVars.length,
		});

		const result: Record<string, string | undefined> = {};
		this.envVars.forEach(key => {
			result[key] = process.env[key];
		});

		const setCount = Object.values(result).filter(v => v !== undefined).length;

		logger.debug('EnvConfigRepository', 'getAllEnvVars', 'All env vars retrieved', {
			total_vars: this.envVars.length,
			set_vars: setCount,
		});

		return result;
	}

	/**
	 * Check if logging is enabled
	 * Delegates to shared utility function
	 */
	async getLoggingEnabled(): Promise<boolean> {
		logger.debug('EnvConfigRepository', 'getLoggingEnabled', 'Checking if logging enabled');

		const enabled = isLoggingEnabled();

		logger.debug('EnvConfigRepository', 'getLoggingEnabled', 'Logging status checked', {
			enabled,
		});

		return enabled;
	}
}
