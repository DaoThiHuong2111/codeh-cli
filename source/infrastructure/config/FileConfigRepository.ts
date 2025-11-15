/**
 * File-based Config Repository
 * Reads/writes configuration from ~/.codeh/configs.json
 */

import {
	IConfigRepository,
	ConfigData,
} from '../../core/domain/interfaces/IConfigRepository';
import {readFileSync, writeFileSync, existsSync, mkdirSync} from 'fs';
import {homedir} from 'os';
import {join, dirname} from 'path';
import {getLogger} from '../logging/Logger.js';

const logger = getLogger();

interface FileConfigData {
	custom_models?: Array<{
		provider: string;
		model: string;
		base_url?: string;
		api_key?: string;
		max_tokens?: number;
		temperature?: number;
	}>;
	[key: string]: any;
}

export class FileConfigRepository implements IConfigRepository {
	private configFile: string;
	private config: FileConfigData;

	constructor(configPath?: string) {
		logger.info('FileConfigRepository', 'constructor', 'Initializing File Config Repository', {
			config_path: configPath || 'default',
		});

		this.configFile = configPath || join(homedir(), '.codeh', 'configs.json');
		this.config = this.loadConfig();

		logger.debug('FileConfigRepository', 'constructor', 'File Config Repository initialized', {
			config_file: this.configFile,
			models_count: this.config.custom_models?.length || 0,
		});
	}

	private loadConfig(): FileConfigData {
		const start = Date.now();
		logger.info('FileConfigRepository', 'loadConfig', 'Loading configuration from file', {
			config_file: this.configFile,
		});

		try {
			const configDir = dirname(this.configFile);
			if (!existsSync(configDir)) {
				logger.debug('FileConfigRepository', 'loadConfig', 'Creating config directory', {
					directory: configDir,
				});
				mkdirSync(configDir, {recursive: true});
			}

			if (existsSync(this.configFile)) {
				const fileContent = readFileSync(this.configFile, 'utf8');
				const config = JSON.parse(fileContent);

				const duration = Date.now() - start;
				logger.info('FileConfigRepository', 'loadConfig', 'Configuration loaded successfully', {
					duration_ms: duration,
					models_count: config.custom_models?.length || 0,
				});

				return config;
			} else {
				logger.info('FileConfigRepository', 'loadConfig', 'Config file not found, using defaults');
				// Don't create empty config file - return empty structure
				return {custom_models: []};
			}
		} catch (error: any) {
			const duration = Date.now() - start;
			logger.error('FileConfigRepository', 'loadConfig', 'Error loading config, using defaults', {
				duration_ms: duration,
				error: error.message,
				stack: error.stack,
			});
			return {custom_models: []};
		}
	}

	private saveConfig(config: FileConfigData): void {
		const start = Date.now();
		logger.debug('FileConfigRepository', 'saveConfig', 'Saving configuration to file', {
			config_file: this.configFile,
			models_count: config.custom_models?.length || 0,
		});

		try {
			writeFileSync(this.configFile, JSON.stringify(config, null, 2));

			const duration = Date.now() - start;
			logger.info('FileConfigRepository', 'saveConfig', 'Configuration saved successfully', {
				duration_ms: duration,
			});
		} catch (error: any) {
			const duration = Date.now() - start;
			logger.error('FileConfigRepository', 'saveConfig', 'Error saving config', {
				duration_ms: duration,
				error: error.message,
				stack: error.stack,
			});
		}
	}

	async get(key: string): Promise<string | undefined> {
		logger.debug('FileConfigRepository', 'get', 'Getting config value', {
			key,
		});

		const keys = key.split('.');
		let value: any = this.config;

		for (const k of keys) {
			if (value && typeof value === 'object' && k in value) {
				value = value[k];
			} else {
				logger.debug('FileConfigRepository', 'get', 'Key not found', {
					key,
				});
				return undefined;
			}
		}

		const result = value !== undefined ? String(value) : undefined;
		logger.debug('FileConfigRepository', 'get', 'Config value retrieved', {
			key,
			found: result !== undefined,
		});

		return result;
	}

	async set(key: string, value: string): Promise<void> {
		logger.debug('FileConfigRepository', 'set', 'Setting config value', {
			key,
		});

		const keys = key.split('.');
		const lastKey = keys.pop()!;
		let target: any = this.config;

		for (const k of keys) {
			if (!(k in target) || typeof target[k] !== 'object') {
				target[k] = {};
			}
			target = target[k];
		}

		target[lastKey] = value;
		this.saveConfig(this.config);

		logger.debug('FileConfigRepository', 'set', 'Config value set', {
			key,
		});
	}

	async getAll(): Promise<ConfigData | null> {
		logger.debug('FileConfigRepository', 'getAll', 'Getting all configuration');

		const firstModel = this.config.custom_models?.[0];

		if (!firstModel) {
			logger.debug('FileConfigRepository', 'getAll', 'No configuration found');
			return null; // No configuration exists - should trigger Config screen
		}

		const config: ConfigData = {
			provider: firstModel.provider as any,
			model: firstModel.model || '',
			baseUrl: firstModel.base_url,
			apiKey: firstModel.api_key,
			maxTokens: firstModel.max_tokens || 4096,
			temperature: firstModel.temperature || 0.7,
		};

		logger.debug('FileConfigRepository', 'getAll', 'Configuration retrieved', {
			provider: config.provider,
			model: config.model,
		});

		return config;
	}

	async exists(): Promise<boolean> {
		logger.debug('FileConfigRepository', 'exists', 'Checking if configuration exists');

		// File must exist AND have at least one model configured
		const exists =
			existsSync(this.configFile) &&
			this.config.custom_models !== undefined &&
			this.config.custom_models.length > 0;

		logger.debug('FileConfigRepository', 'exists', 'Configuration existence checked', {
			exists,
			file_exists: existsSync(this.configFile),
			models_count: this.config.custom_models?.length || 0,
		});

		return exists;
	}

	async delete(key: string): Promise<void> {
		logger.debug('FileConfigRepository', 'delete', 'Deleting config key', {
			key,
		});

		const keys = key.split('.');
		const lastKey = keys.pop()!;
		let target: any = this.config;

		for (const k of keys) {
			if (!(k in target)) {
				logger.debug('FileConfigRepository', 'delete', 'Key path not found', {
					key,
				});
				return; // Key path doesn't exist
			}
			target = target[k];
		}

		delete target[lastKey];
		this.saveConfig(this.config);

		logger.debug('FileConfigRepository', 'delete', 'Config key deleted', {
			key,
		});
	}

	async clear(): Promise<void> {
		logger.info('FileConfigRepository', 'clear', 'Clearing all configuration', {
			models_to_clear: this.config.custom_models?.length || 0,
		});

		this.config = {custom_models: []};
		this.saveConfig(this.config);

		logger.info('FileConfigRepository', 'clear', 'Configuration cleared');
	}

	// Additional methods specific to file config
	async getCustomModels(): Promise<ConfigData[]> {
		logger.debug('FileConfigRepository', 'getCustomModels', 'Getting custom models', {
			models_count: this.config.custom_models?.length || 0,
		});

		const models = this.config.custom_models || [];
		const result = models.map(m => ({
			provider: m.provider as any,
			model: m.model || '',
			baseUrl: m.base_url,
			apiKey: m.api_key,
			maxTokens: m.max_tokens || 4096,
			temperature: m.temperature || 0.7,
		}));

		logger.debug('FileConfigRepository', 'getCustomModels', 'Custom models retrieved', {
			returned_count: result.length,
		});

		return result;
	}

	async addCustomModel(model: ConfigData): Promise<void> {
		logger.info('FileConfigRepository', 'addCustomModel', 'Adding custom model', {
			provider: model.provider,
			model: model.model,
		});

		if (!this.config.custom_models) {
			this.config.custom_models = [];
		}

		this.config.custom_models.push({
			provider: model.provider,
			model: model.model,
			base_url: model.baseUrl,
			api_key: model.apiKey,
			max_tokens: model.maxTokens,
			temperature: model.temperature,
		});

		this.saveConfig(this.config);

		logger.info('FileConfigRepository', 'addCustomModel', 'Custom model added', {
			total_models: this.config.custom_models.length,
		});
	}

	async removeCustomModel(index: number): Promise<void> {
		logger.info('FileConfigRepository', 'removeCustomModel', 'Removing custom model', {
			index,
			models_count: this.config.custom_models?.length || 0,
		});

		if (this.config.custom_models && this.config.custom_models[index]) {
			const removed = this.config.custom_models[index];
			this.config.custom_models.splice(index, 1);
			this.saveConfig(this.config);

			logger.info('FileConfigRepository', 'removeCustomModel', 'Custom model removed', {
				removed_provider: removed.provider,
				removed_model: removed.model,
				remaining_models: this.config.custom_models.length,
			});
		} else {
			logger.warn('FileConfigRepository', 'removeCustomModel', 'Model index not found', {
				index,
			});
		}
	}

	async setMultiple(updates: Record<string, string>): Promise<void> {
		logger.debug('FileConfigRepository', 'setMultiple', 'Setting multiple config values', {
			updates_count: Object.keys(updates).length,
		});

		for (const [key, value] of Object.entries(updates)) {
			await this.set(key, value);
		}

		logger.debug('FileConfigRepository', 'setMultiple', 'Multiple config values set', {
			updates_count: Object.keys(updates).length,
		});
	}

	getConfigPath(): string {
		logger.debug('FileConfigRepository', 'getConfigPath', 'Getting config path', {
			config_file: this.configFile,
		});
		return this.configFile;
	}
}
