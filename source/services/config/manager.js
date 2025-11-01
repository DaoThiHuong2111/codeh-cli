import {envManager} from './env.js';
import {writeFileSync, readFileSync, existsSync, mkdirSync} from 'fs';
import {homedir} from 'os';
import {join, dirname} from 'path';

class ConfigManager {
	constructor() {
		this.configFile = join(homedir(), '.codeh', 'configs.json');
		this.defaultConfig = {
			custom_models: [],
		};

		this.loadConfig();
	}

	// Load config từ file
	loadConfig() {
		try {
			// Create .codeh directory if it doesn't exist
			const configDir = dirname(this.configFile);
			if (!existsSync(configDir)) {
				mkdirSync(configDir, {recursive: true});
			}

			if (existsSync(this.configFile)) {
				const fileContent = readFileSync(this.configFile, 'utf8');
				this.config = {
					...this.defaultConfig,
					...JSON.parse(fileContent),
				};
			} else {
				this.config = {...this.defaultConfig};
				this.saveConfig();
			}
		} catch (error) {
			console.warn('Error loading config, using defaults:', error.message);
			this.config = {...this.defaultConfig};
		}
	}

	// Save config ra file
	saveConfig() {
		try {
			writeFileSync(this.configFile, JSON.stringify(this.config, null, 2));
		} catch (error) {
			console.error('Error saving config:', error.message);
		}
	}

	// Get config value
	get(key, defaultValue = null) {
		const keys = key.split('.');
		let value = this.config;

		for (const k of keys) {
			if (value && typeof value === 'object' && k in value) {
				value = value[k];
			} else {
				return defaultValue;
			}
		}

		return value;
	}

	// Set config value
	set(key, value) {
		const keys = key.split('.');
		const lastKey = keys.pop();
		let target = this.config;

		for (const k of keys) {
			if (!(k in target) || typeof target[k] !== 'object') {
				target[k] = {};
			}

			target = target[k];
		}

		target[lastKey] = value;
		this.saveConfig();
	}

	// Get toàn bộ config
	getAll() {
		return {...this.config};
	}

	// Set multiple config values
	setMultiple(updates) {
		for (const [key, value] of Object.entries(updates)) {
			this.set(key, value);
		}
	}

	// Reset config về default
	reset() {
		this.config = {...this.defaultConfig};
		this.saveConfig();
	}

	// Get env variable (wrapper around envManager)
	getEnv(key, defaultValue = null) {
		return envManager.get(key, defaultValue);
	}

	// Set env variable (wrapper around envManager)
	setEnv(key, value) {
		envManager.set(key, value);
	}

	// Get tất cả env variables
	getAllEnv() {
		return envManager.all;
	}

	// Validate configuration
	validate() {
		const issues = [];

		// Get values from file or env
		const customModels = this.getCustomModels();
		const firstModel = customModels[0];

		// Check required unified environment variables
		const requiredVars = ['CODEH_PROVIDER', 'CODEH_MODEL', 'CODEH_BASE_URL'];
		for (const varName of requiredVars) {
			const envVal = envManager.get(varName);
			const fileVal = firstModel
				? firstModel[varName.replace('CODEH_', '').toLowerCase()]
				: null;
			if (!envVal && !fileVal) {
				issues.push(`Missing required configuration: ${varName}`);
			}
		}

		// Check API key for providers that require it
		const provider =
			envManager.get('CODEH_PROVIDER') ||
			(firstModel ? firstModel.provider : null);
		const apiKey =
			envManager.get('CODEH_API_KEY') ||
			(firstModel ? firstModel.api_key : null);
		if (!apiKey && provider !== 'ollama') {
			issues.push(`API key missing for ${provider} provider`);
		}

		// Validate custom models format
		for (let i = 0; i < customModels.length; i++) {
			const model = customModels[i];
			if (!model.provider || !model.model) {
				issues.push(
					`Custom model at index ${i} missing required fields (provider, model)`,
				);
			}
		}

		return {
			valid: issues.length === 0,
			issues,
		};
	}

	// Export config
	export() {
		return {
			config: this.config,
			env: envManager.all,
			exportTime: new Date().toISOString(),
			version: '1.0.0',
		};
	}

	// Import config
	import(exportedConfig) {
		try {
			if (exportedConfig.config) {
				this.config = {
					...this.defaultConfig,
					...exportedConfig.config,
				};
				this.saveConfig();
			}

			if (exportedConfig.env) {
				for (const [key, value] of Object.entries(exportedConfig.env)) {
					envManager.set(key, value);
				}
			}

			return true;
		} catch (error) {
			console.error('Error importing config:', error.message);
			return false;
		}
	}

	// Get config file path
	getConfigPath() {
		return this.configFile;
	}

	// Check if config file exists
	configExists() {
		return existsSync(this.configFile);
	}

	// Get configuration summary
	getSummary() {
		const validation = this.validate();
		const customModels = this.getCustomModels();
		const firstModel = customModels[0];

		// Get values from env or file
		const provider =
			envManager.get('CODEH_PROVIDER') ||
			(firstModel ? firstModel.provider : '');
		const model =
			envManager.get('CODEH_MODEL') || (firstModel ? firstModel.model : '');
		const apiKey =
			envManager.get('CODEH_API_KEY') || (firstModel ? firstModel.api_key : '');

		return {
			models: {
				customModels,
				count: customModels.length,
			},
			ai: {
				provider,
				model,
				hasApiKey: !!apiKey,
			},
			validation: {
				isValid: validation.valid,
				issues: validation.issues,
			},
			configFile: {
				exists: this.configExists(),
				path: this.getConfigPath(),
			},
		};
	}

	// Get custom models from config
	getCustomModels() {
		return this.get('custom_models', []);
	}

	// Add a new custom model
	addCustomModel(modelConfig) {
		const models = this.getCustomModels();
		models.push(modelConfig);
		this.set('custom_models', models);
	}

	// Update existing custom model
	updateCustomModel(index, modelConfig) {
		const models = this.getCustomModels();
		if (index >= 0 && index < models.length) {
			models[index] = modelConfig;
			this.set('custom_models', models);
		}
	}

	// Remove custom model
	removeCustomModel(index) {
		const models = this.getCustomModels();
		if (index >= 0 && index < models.length) {
			models.splice(index, 1);
			this.set('custom_models', models);
		}
	}

	// Check if any custom model exists
	hasCustomModels() {
		return this.getCustomModels().length > 0;
	}
}

export const configManager = new ConfigManager();
export default configManager;
