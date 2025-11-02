/**
 * Configuration Validator
 * Validates configuration inputs for the Config wizard
 */

export interface ValidationResult {
	isValid: boolean;
	error?: string;
}

export class ConfigValidator {
	/**
	 * Validates a URL string
	 * @param url - The URL string to validate
	 * @returns ValidationResult with isValid and optional error message
	 */
	static validateUrl(url: string): ValidationResult {
		// Empty URL is valid (optional field)
		if (!url || !url.trim()) {
			return { isValid: true };
		}

		try {
			const parsedUrl = new URL(url.trim());

			// Check if it's http or https protocol
			if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
				return {
					isValid: false,
					error: 'Base URL must use HTTP or HTTPS protocol',
				};
			}

			return { isValid: true };
		} catch (err) {
			return {
				isValid: false,
				error: 'Invalid URL format. Example: https://api.example.com',
			};
		}
	}

	/**
	 * Validates model name
	 * @param model - The model name to validate
	 * @returns ValidationResult with isValid and optional error message
	 */
	static validateModel(model: string): ValidationResult {
		if (!model || !model.trim()) {
			return {
				isValid: false,
				error: 'Model is required',
			};
		}

		return { isValid: true };
	}

	/**
	 * Validates API key
	 * @param apiKey - The API key to validate
	 * @param provider - The provider name
	 * @returns ValidationResult with isValid and optional error message
	 */
	static validateApiKey(apiKey: string, provider: string): ValidationResult {
		// Ollama doesn't require API key
		if (provider === 'ollama') {
			return { isValid: true };
		}

		if (!apiKey || !apiKey.trim()) {
			return {
				isValid: false,
				error: 'API key is required',
			};
		}

		return { isValid: true };
	}

	/**
	 * Validates max tokens
	 * @param maxTokens - The max tokens string to validate
	 * @returns ValidationResult with isValid and optional error message
	 */
	static validateMaxTokens(maxTokens: string): ValidationResult {
		if (!maxTokens || !maxTokens.trim()) {
			return {
				isValid: false,
				error: 'Max tokens is required',
			};
		}

		const maxTokensNum = parseInt(maxTokens.trim());

		if (isNaN(maxTokensNum) || maxTokensNum <= 0) {
			return {
				isValid: false,
				error: 'Max tokens must be a positive number',
			};
		}

		if (maxTokensNum > 1000000) {
			return {
				isValid: false,
				error: 'Max tokens cannot exceed 1,000,000',
			};
		}

		return { isValid: true };
	}
}
