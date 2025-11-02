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
    public readonly defaultModel: string,
    public readonly requiresApiKey: boolean,
    public readonly supportsStreaming: boolean
  ) {}

  static readonly PROVIDERS: Record<Provider, ProviderInfo> = {
    [Provider.ANTHROPIC]: new ProviderInfo(
      Provider.ANTHROPIC,
      'Anthropic (Claude)',
      'claude-3-5-sonnet-20241022',
      true,
      true
    ),
    [Provider.OPENAI]: new ProviderInfo(
      Provider.OPENAI,
      'OpenAI (GPT)',
      'gpt-4o',
      true,
      true
    ),
    [Provider.OLLAMA]: new ProviderInfo(
      Provider.OLLAMA,
      'Ollama (Local)',
      'llama3.1',
      false,
      true
    ),
    [Provider.GENERIC]: new ProviderInfo(
      Provider.GENERIC,
      'Generic API',
      'default',
      true,
      true
    ),
  };

  static fromString(value: string): ProviderInfo {
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
