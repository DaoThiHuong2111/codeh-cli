import {configManager} from './manager.js';

/**
 * Centralized config getter with fallback logic:
 * 1. Check environment variable
 * 2. Check config file
 * 3. Return error if not found
 */
function getConfigValue(envKey, configKey, defaultValue = null) {
	// Try environment variable first
	const envValue = process.env[envKey];
	if (envValue) {
		return envValue;
	}

	// Try config file
	const fileValue = configManager.get(configKey);
	if (fileValue) {
		return fileValue;
	}

	// Return default or throw error
	if (defaultValue !== null) {
		return defaultValue;
	}

	throw new Error(
		`Configuration not found for ${envKey}. Please configure using config screen.`,
	);
}

/**
 * Get the configured LLM model
 * Fallback: env CODEH_MODEL → config file custom_models[0].model
 */
export function getModel() {
	try {
		return getConfigValue('CODEH_MODEL', 'custom_models.0.model', '');
	} catch (error) {
		return '';
	}
}

/**
 * Get the API key for the current provider
 * Fallback: env CODEH_API_KEY → config file custom_models[0].api_key
 */
export function getApiKey() {
	try {
		return getConfigValue('CODEH_API_KEY', 'custom_models.0.api_key', '');
	} catch (error) {
		return '';
	}
}

/**
 * Get the base URL for the current provider
 * Fallback: env CODEH_BASE_URL → config file custom_models[0].base_url
 */
export function getBaseUrl() {
	try {
		return getConfigValue('CODEH_BASE_URL', 'custom_models.0.base_url', '');
	} catch (error) {
		return '';
	}
}

/**
 * Get the current provider
 * Fallback: env CODEH_PROVIDER → config file custom_models[0].provider
 */
export function getProvider() {
	try {
		return getConfigValue('CODEH_PROVIDER', 'custom_models.0.provider', '');
	} catch (error) {
		return '';
	}
}

/**
 * Get max token limit
 * Fallback: env CODEH_MAX_TOKEN → config file custom_models[0].max_token
 */
export function getMaxToken() {
	try {
		const value = getConfigValue(
			'CODEH_MAX_TOKEN',
			'custom_models.0.max_token',
			'0',
		);
		return parseInt(value, 10) || 0;
	} catch (error) {
		return 0;
	}
}
