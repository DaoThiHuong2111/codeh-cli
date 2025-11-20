/**
 * Configuration Domain Model
 * Represents application configuration
 */

import {Provider, ProviderInfo} from '../valueObjects/Provider';

export class Configuration {
	constructor(
		public readonly provider: Provider,
		public readonly model: string,
		public readonly apiKey?: string,
		public readonly baseUrl?: string,
		public readonly maxTokens: number = 4096,
		public readonly temperature: number = 0.7,
	) {}

	static create(data: {
		provider: string;
		model: string;
		apiKey?: string;
		baseUrl?: string;
		maxTokens?: number;
		temperature?: number;
	}): Configuration {
		const providerInfo = ProviderInfo.fromString(data.provider);

		if (!data.model || data.model.trim() === '') {
			throw new Error('Model is required');
		}

		return new Configuration(
			providerInfo.name,
			data.model,
			data.apiKey,
			data.baseUrl,
			data.maxTokens,
			data.temperature,
		);
	}

	getProviderInfo(): ProviderInfo {
		return ProviderInfo.PROVIDERS[this.provider];
	}

	requiresApiKey(): boolean {
		return this.getProviderInfo().requiresApiKey;
	}

	supportsStreaming(): boolean {
		return this.getProviderInfo().supportsStreaming;
	}

	isValid(): boolean {
		if (!this.model || this.model.trim() === '') {
			return false;
		}

		if (this.requiresApiKey() && !this.apiKey) {
			return false;
		}

		if (this.maxTokens <= 0 || this.maxTokens > 1000000) {
			return false;
		}

		if (this.temperature < 0 || this.temperature > 2) {
			return false;
		}

		return true;
	}

	getValidationErrors(): string[] {
		const errors: string[] = [];

		if (!this.model || this.model.trim() === '') {
			errors.push('Model is required');
		}

		if (this.requiresApiKey() && !this.apiKey) {
			errors.push(`API key is required for ${this.provider}`);
		}

		if (this.maxTokens <= 0) {
			errors.push('Max tokens must be greater than 0');
		}

		if (this.maxTokens > 1000000) {
			errors.push('Max tokens must be less than 1,000,000');
		}

		if (this.temperature < 0 || this.temperature > 2) {
			errors.push('Temperature must be between 0 and 2');
		}

		return errors;
	}

	toJSON(): object {
		return {
			provider: this.provider,
			model: this.model,
			baseUrl: this.baseUrl,
			maxTokens: this.maxTokens,
			temperature: this.temperature,
		};
	}
}
