/**
 * Model Info Value Object
 * Represents AI model metadata
 */

export class ModelInfo {
  constructor(
    public readonly name: string,
    public readonly contextWindow: number,
    public readonly maxOutputTokens: number,
    public readonly supportsTools: boolean,
    public readonly supportsVision: boolean,
    public readonly costPer1kTokens?: { input: number; output: number }
  ) {}

  canHandleContext(tokens: number): boolean {
    return tokens <= this.contextWindow;
  }

  canHandleOutput(tokens: number): boolean {
    return tokens <= this.maxOutputTokens;
  }
}

export class ModelRegistry {
  private static models: Record<string, ModelInfo> = {
    // Anthropic models
    'claude-3-5-sonnet-20241022': new ModelInfo(
      'claude-3-5-sonnet-20241022',
      200000,
      8192,
      true,
      true,
      { input: 3, output: 15 }
    ),
    'claude-3-opus-20240229': new ModelInfo(
      'claude-3-opus-20240229',
      200000,
      4096,
      true,
      true,
      { input: 15, output: 75 }
    ),

    // OpenAI models
    'gpt-4o': new ModelInfo(
      'gpt-4o',
      128000,
      16384,
      true,
      true,
      { input: 2.5, output: 10 }
    ),
    'gpt-4o-mini': new ModelInfo(
      'gpt-4o-mini',
      128000,
      16384,
      true,
      true,
      { input: 0.15, output: 0.6 }
    ),
    'gpt-4-turbo': new ModelInfo(
      'gpt-4-turbo',
      128000,
      4096,
      true,
      true,
      { input: 10, output: 30 }
    ),

    // Ollama models (approximate values)
    'llama3.1': new ModelInfo('llama3.1', 128000, 4096, false, false),
    'llama3': new ModelInfo('llama3', 8192, 2048, false, false),
    'mistral': new ModelInfo('mistral', 32000, 8192, false, false),
  };

  static get(modelName: string): ModelInfo | undefined {
    return this.models[modelName];
  }

  static register(modelName: string, info: ModelInfo): void {
    this.models[modelName] = info;
  }

  static getAll(): Record<string, ModelInfo> {
    return { ...this.models };
  }
}
