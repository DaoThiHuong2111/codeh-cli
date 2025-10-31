import {envManager} from '../services/envManager.js';
import {configManager} from '../services/configManager.js';

/**
 * Check configuration status according to config.md flow logic
 * 1. Check environment variables first
 * 2. Check file config if env not found
 * 3. Redirect to config screens if neither found
 * 4. Prioritize env if both found
 * 5. Redirect to home screen if configured
 */
export function checkConfiguration() {
	// Step 1: Check environment variables first
	const envConfig = {
		provider: envManager.get('CODEH_PROVIDER'),
		model: envManager.get('CODEH_MODEL'),
		baseUrl: envManager.get('CODEH_BASE_URL'),
		apiKey: envManager.get('CODEH_API_KEY'),
		maxToken: envManager.get('CODEH_MAX_TOKEN'),
	};

	// Check if all required environment variables are present
	// Note: API key can be null for some providers (like local ollama)
	const hasCompleteEnvConfig =
		envConfig.provider &&
		envConfig.model &&
		envConfig.baseUrl;

	// Step 2: Check file config if env not complete
	let fileConfig = null;
	if (!hasCompleteEnvConfig) {
		const customModels = configManager.getCustomModels();
		if (customModels.length > 0) {
			// Use first custom model as fallback
			fileConfig = customModels[0];
		}
	}

	// Step 3: Determine if configuration is complete
	const hasCompleteConfig = Boolean(hasCompleteEnvConfig || fileConfig);

	// Step 4: Return configuration status and preferred config
	return {
		isConfigured: hasCompleteConfig,
		hasEnvConfig: Boolean(hasCompleteEnvConfig),
		hasFileConfig: Boolean(!!fileConfig),
		preferEnvConfig: Boolean(hasCompleteEnvConfig), // Step 4: prioritize env if both found
		envConfig: hasCompleteEnvConfig ? envConfig : null,
		fileConfig: fileConfig,
		activeConfig: hasCompleteEnvConfig ? envConfig : fileConfig,
	};
}

/**
 * Get active configuration (env优先 if both exist)
 */
export function getActiveConfiguration() {
	const checkResult = checkConfiguration();
	return checkResult.activeConfig;
}

/**
 * Save configuration to file
 */
export function saveConfiguration(config) {
	configManager.addCustomModel(config);
	return true;
}
