/**
 * Reference Model
 * Represents a reference to a symbol in the codebase
 */

import {Symbol} from './Symbol.js';

/**
 * Reference to a symbol
 */
export class Reference {
	constructor(
		public symbol: Symbol, // Symbol that contains the reference
		public line: number, // Line number of the reference
		public contentAroundReference: string, // Code snippet around the reference
		public referencedSymbol?: Symbol, // The symbol being referenced
	) {}

	/**
	 * Get file path
	 */
	getFilePath(): string {
		return this.symbol.location.relativePath;
	}

	/**
	 * Get context lines
	 */
	getContextLines(): string[] {
		return this.contentAroundReference.split('\n');
	}

	/**
	 * Get the line that contains the reference (highlighted)
	 */
	getHighlightedLine(): string | undefined {
		const lines = this.getContextLines();
		// Find the line closest to the reference line
		const contextLineCount = lines.length;
		const middleIndex = Math.floor(contextLineCount / 2);
		return lines[middleIndex];
	}

	/**
	 * Convert to plain object
	 */
	toJSON(): any {
		return {
			symbol: this.symbol.toJSON(),
			line: this.line,
			contentAroundReference: this.contentAroundReference,
			referencedSymbol: this.referencedSymbol?.toJSON(),
		};
	}

	/**
	 * Create from API response
	 */
	static fromAPIResponse(data: any): Reference {
		return new Reference(
			Symbol.fromAPIResponse(data.symbol),
			data.line,
			data.contentAroundReference,
			data.referencedSymbol
				? Symbol.fromAPIResponse(data.referencedSymbol)
				: undefined,
		);
	}
}
