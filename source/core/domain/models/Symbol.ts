/**
 * Symbol Model
 * Represents a code symbol from LSP (class, function, method, variable, etc.)
 */

/**
 * LSP Symbol Kinds
 * Based on Language Server Protocol specification
 */
export enum SymbolKind {
	File = 1,
	Module = 2,
	Namespace = 3,
	Package = 4,
	Class = 5,
	Method = 6,
	Property = 7,
	Field = 8,
	Constructor = 9,
	Enum = 10,
	Interface = 11,
	Function = 12,
	Variable = 13,
	Constant = 14,
	String = 15,
	Number = 16,
	Boolean = 17,
	Array = 18,
	Object = 19,
	Key = 20,
	Null = 21,
	EnumMember = 22,
	Struct = 23,
	Event = 24,
	Operator = 25,
	TypeParameter = 26,
}

/**
 * Symbol location in source code
 */
export interface SymbolLocation {
	relativePath: string;
	startLine: number;
	endLine: number;
	startColumn?: number;
	endColumn?: number;
}

/**
 * Code Symbol
 */
export class Symbol {
	constructor(
		public name: string,
		public namePath: string, // Path in symbol tree: "ClassName/methodName"
		public kind: SymbolKind,
		public location: SymbolLocation,
		public body?: string, // Source code of the symbol
		public children?: Symbol[], // Child symbols (e.g., methods in a class)
		public documentation?: string,
	) {}

	/**
	 * Get human-readable kind name
	 */
	getKindName(): string {
		return SymbolKind[this.kind];
	}

	/**
	 * Check if symbol is a container (can have children)
	 */
	isContainer(): boolean {
		return [
			SymbolKind.Class,
			SymbolKind.Module,
			SymbolKind.Namespace,
			SymbolKind.Interface,
			SymbolKind.Enum,
			SymbolKind.Struct,
		].includes(this.kind);
	}

	/**
	 * Check if symbol is callable
	 */
	isCallable(): boolean {
		return [
			SymbolKind.Function,
			SymbolKind.Method,
			SymbolKind.Constructor,
		].includes(this.kind);
	}

	/**
	 * Get symbol signature (for display)
	 */
	getSignature(): string {
		if (!this.body) {
			return this.name;
		}

		// Extract first line (usually the signature)
		const firstLine = this.body.split('\n')[0];
		return firstLine?.trim() || this.name;
	}

	/**
	 * Find child by name
	 */
	findChild(name: string): Symbol | undefined {
		return this.children?.find(child => child.name === name);
	}

	/**
	 * Get all descendants
	 */
	getAllDescendants(): Symbol[] {
		const descendants: Symbol[] = [];

		if (this.children) {
			for (const child of this.children) {
				descendants.push(child);
				descendants.push(...child.getAllDescendants());
			}
		}

		return descendants;
	}

	/**
	 * Convert to plain object
	 */
	toJSON(): any {
		return {
			name: this.name,
			namePath: this.namePath,
			kind: this.kind,
			kindName: this.getKindName(),
			location: this.location,
			body: this.body,
			children: this.children?.map(c => c.toJSON()),
			documentation: this.documentation,
		};
	}

	/**
	 * Create from API response
	 */
	static fromAPIResponse(data: any): Symbol {
		return new Symbol(
			data.name || data.namePath.split('/').pop(),
			data.namePath,
			data.kind,
			{
				relativePath: data.relativePath,
				startLine: data.bodyLocation.startLine,
				endLine: data.bodyLocation.endLine,
			},
			data.body,
			data.children?.map((c: any) => Symbol.fromAPIResponse(c)),
			data.documentation,
		);
	}
}
