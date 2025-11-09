/**
 * Provider Value Object
 * Represents AI API providers
 */

export enum Provider {
	ANTHROPIC = 'anthropic',
	OPENAI = 'openai',
	OLLAMA = 'ollama',
	GENERIC = 'generic-chat-completion-api',
}

export class ProviderInfo {
	constructor(
		public readonly name: Provider,
		public readonly displayName: string,
		public readonly requiresApiKey: boolean,
		public readonly supportsStreaming: boolean,
	) {}

	static readonly PROVIDERS: Record<Provider, ProviderInfo> = {
		[Provider.ANTHROPIC]: new ProviderInfo(
			Provider.ANTHROPIC,
			'Anthropic (Claude)',
			true,
			true,
		),
		[Provider.OPENAI]: new ProviderInfo(
			Provider.OPENAI,
			'OpenAI (GPT)',
			true,
			true,
		),
		[Provider.OLLAMA]: new ProviderInfo(
			Provider.OLLAMA,
			'Ollama (Local)',
			false,
			true,
		),
		[Provider.GENERIC]: new ProviderInfo(
			Provider.GENERIC,
			'Generic API',
			true,
			true,
		),
	};

	static fromString(value: string): ProviderInfo {
		if (!value || value.trim() === '') {
			throw new Error('Provider cannot be empty');
		}

		const provider = value as Provider;
		if (!this.PROVIDERS[provider]) {
			throw new Error(`Unknown provider: ${value}`);
		}
		return this.PROVIDERS[provider];
	}

	static isValid(value: string): boolean {
		return Object.values(Provider).includes(value as Provider);
	}
}
