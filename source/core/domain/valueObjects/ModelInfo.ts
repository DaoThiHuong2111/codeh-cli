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
		public readonly costPer1kTokens?: {input: number; output: number},
	) {}

	canHandleContext(tokens: number): boolean {
		return tokens <= this.contextWindow;
	}

	canHandleOutput(tokens: number): boolean {
		return tokens <= this.maxOutputTokens;
	}
}

export class ModelRegistry {
	private static models: Record<string, ModelInfo> = {};
	// No hardcoded models - all models come from user configuration

	static get(modelName: string): ModelInfo | undefined {
		return this.models[modelName];
	}

	static register(modelName: string, info: ModelInfo): void {
		this.models[modelName] = info;
	}

	static getAll(): Record<string, ModelInfo> {
		return {...this.models};
	}
}
