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

