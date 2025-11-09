/**
 * Input Type Value Object
 * Represents different types of user input
 */

export enum InputType {
	COMMAND = 'command',
	CODE = 'code',
	URL = 'url',
	FILE = 'file',
	TEXT = 'text',
}

export class InputClassification {
	constructor(
		public readonly type: InputType,
		public readonly confidence: number,
		public readonly metadata?: Record<string, any>,
	) {}

	isCommand(): boolean {
		return this.type === InputType.COMMAND;
	}

	isCode(): boolean {
		return this.type === InputType.CODE;
	}

	isUrl(): boolean {
		return this.type === InputType.URL;
	}

	isFile(): boolean {
		return this.type === InputType.FILE;
	}

	isText(): boolean {
		return this.type === InputType.TEXT;
	}

	isHighConfidence(): boolean {
		return this.confidence >= 0.8;
	}
}
