class EnvManager {
	constructor() {
		// New unified environment variables according to config.md
		this.unifiedVars = [
			'CODEH_MODEL',
			'CODEH_BASE_URL',
			'CODEH_API_KEY',
			'CODEH_PROVIDER',
			'CODEH_MAX_TOKEN',
		];

		// Legacy variables for backward compatibility
		this.legacyVars = [
			'ANTHROPIC_BASE_URL',
			'ANTHROPIC_API_KEY',
			'OPENAI_API_KEY',
			'OPENAI_BASE_URL',
			'OPENAI_MODEL',
			'OLLAMA_BASE_URL',
			'OLLAMA_MODEL',
			'OLLAMA_API_KEY',
			'MAX_TOKENS',
			'TIMEOUT',
			'LOG_LEVEL',
		];

		this.allVars = [...this.unifiedVars, ...this.legacyVars];
	}

	get(key, defaultValue = null) {
		return process.env[key] || defaultValue;
	}

	get all() {
		const envVars = {};
		this.allVars.forEach(key => {
			envVars[key] = this.get(key);
		});
		return envVars;
	}

	set(key, value) {
		process.env[key] = value;
	}

	validate() {
		const missing = [];
		// Only validate unified variables
		this.unifiedVars.forEach(key => {
			if (!this.get(key)) {
				missing.push(key);
			}
		});
		return missing;
	}

	get modelConfig() {
		// Strict: only use environment variables, no defaults, no auto-detection
		const provider = this.get('CODEH_PROVIDER');
		const model = this.get('CODEH_MODEL');
		const baseUrl = this.get('CODEH_BASE_URL');
		const apiKey = this.get('CODEH_API_KEY');
		const maxTokens = parseInt(this.get('CODEH_MAX_TOKEN')) || 0;
		const timeout = parseInt(this.get('TIMEOUT')) || 30000;

		return {
			provider,
			model,
			apiKey,
			baseUrl,
			maxTokens,
			timeout,
		};
	}

	// Helper method to get legacy base URL
	getLegacyBaseUrl(provider) {
		switch (provider) {
			case 'anthropic':
				return this.get('ANTHROPIC_BASE_URL');
			case 'openai':
				return this.get('OPENAI_BASE_URL');
			default:
				return this.get('OLLAMA_BASE_URL');
		}
	}

	// Helper method to get legacy API key
	getLegacyApiKey(provider) {
		switch (provider) {
			case 'anthropic':
				return this.get('ANTHROPIC_API_KEY');
			case 'openai':
				return this.get('OPENAI_API_KEY');
			default:
				return this.get('OLLAMA_API_KEY');
		}
	}

	get logLevel() {
		return this.get('LOG_LEVEL', 'info').toLowerCase();
	}

	isDevelopment() {
		return this.get('NODE_ENV') === 'development';
	}
}

export const envManager = new EnvManager();
export default envManager;
