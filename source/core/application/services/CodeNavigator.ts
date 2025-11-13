/**
 * Code Navigator Service
 * Provides semantic code navigation using LSP via Serena
 */

import {SerenaMCPAdapter} from '../../../infrastructure/integrations/mcp/SerenaMCPAdapter';
import {Symbol, SymbolKind} from '../../domain/models/Symbol';
import {Reference} from '../../domain/models/Reference';

export interface NavigationOptions {
	includeBody?: boolean;
	depth?: number;
	substringMatching?: boolean;
}

export interface SearchOptions {
	relativePath?: string;
	includeKinds?: SymbolKind[];
	excludeKinds?: SymbolKind[];
}

/**
 * Code Navigator - Semantic code navigation service
 */
export class CodeNavigator {
	constructor(private serenaAdapter: SerenaMCPAdapter) {}

	/**
	 * Ensure connection to Serena
	 */
	private async ensureConnection(): Promise<void> {
		if (!this.serenaAdapter.isConnected()) {
			await this.serenaAdapter.connect();
		}
	}

	/**
	 * Get overview of symbols in a file
	 * @param filePath - Relative path to file
	 * @returns Array of top-level symbols
	 */
	async getSymbolsOverview(filePath: string): Promise<Symbol[]> {
		await this.ensureConnection();

		const symbolsData = await this.serenaAdapter.getSymbolsOverview(filePath);
		return symbolsData.map(data => Symbol.fromAPIResponse(data));
	}

	/**
	 * Find symbol by name or name pattern
	 * @param namePattern - Symbol name or path (e.g., "MyClass" or "MyClass/myMethod")
	 * @param options - Search and navigation options
	 * @returns Array of matching symbols
	 */
	async findSymbol(
		namePattern: string,
		options: NavigationOptions & SearchOptions = {},
	): Promise<Symbol[]> {
		await this.ensureConnection();

		const symbolsData = await this.serenaAdapter.findSymbol(namePattern, {
			relativePath: options.relativePath,
			includeBody: options.includeBody || false,
			depth: options.depth || 0,
			includeKinds: options.includeKinds?.map(k => k as number),
			excludeKinds: options.excludeKinds?.map(k => k as number),
			substringMatching: options.substringMatching || false,
		});

		return symbolsData.map(data => Symbol.fromAPIResponse(data));
	}

	/**
	 * Find all references to a symbol
	 * @param symbol - Symbol to find references for
	 * @returns Array of references
	 */
	async findReferences(symbol: Symbol): Promise<Reference[]> {
		await this.ensureConnection();

		const referencesData = await this.serenaAdapter.findReferencingSymbols(
			symbol.namePath,
			symbol.location.relativePath,
		);

		return referencesData.map(data => Reference.fromAPIResponse(data));
	}

	/**
	 * Find references by name path and file
	 * @param namePath - Symbol name path
	 * @param filePath - Relative file path
	 * @returns Array of references
	 */
	async findReferencesByPath(
		namePath: string,
		filePath: string,
	): Promise<Reference[]> {
		await this.ensureConnection();

		const referencesData = await this.serenaAdapter.findReferencingSymbols(
			namePath,
			filePath,
		);

		return referencesData.map(data => Reference.fromAPIResponse(data));
	}

	/**
	 * Find classes in a file or directory
	 * @param relativePath - Path to search in
	 * @param options - Navigation options
	 */
	async findClasses(
		relativePath?: string,
		options: NavigationOptions = {},
	): Promise<Symbol[]> {
		return this.findSymbol('', {
			...options,
			relativePath,
			includeKinds: [SymbolKind.Class],
			substringMatching: true,
		});
	}

	/**
	 * Find functions in a file or directory
	 * @param relativePath - Path to search in
	 * @param options - Navigation options
	 */
	async findFunctions(
		relativePath?: string,
		options: NavigationOptions = {},
	): Promise<Symbol[]> {
		return this.findSymbol('', {
			...options,
			relativePath,
			includeKinds: [SymbolKind.Function],
			substringMatching: true,
		});
	}

	/**
	 * Find methods in a class
	 * @param className - Name of the class
	 * @param relativePath - File containing the class
	 * @param options - Navigation options
	 */
	async findMethodsInClass(
		className: string,
		relativePath?: string,
		options: NavigationOptions = {},
	): Promise<Symbol[]> {
		const classes = await this.findSymbol(className, {
			...options,
			relativePath,
			includeKinds: [SymbolKind.Class],
			depth: 1, // Include children (methods)
		});

		if (classes.length === 0) {
			return [];
		}

		// Get all methods from all matching classes
		const methods: Symbol[] = [];
		for (const cls of classes) {
			if (cls.children) {
				methods.push(
					...cls.children.filter(
						child =>
							child.kind === SymbolKind.Method ||
							child.kind === SymbolKind.Constructor,
					),
				);
			}
		}

		return methods;
	}

	/**
	 * Get definition of a symbol (with body)
	 * @param namePattern - Symbol name or path
	 * @param relativePath - File path
	 */
	async getDefinition(
		namePattern: string,
		relativePath?: string,
	): Promise<Symbol | undefined> {
		const symbols = await this.findSymbol(namePattern, {
			relativePath,
			includeBody: true,
			depth: 0,
		});

		return symbols[0];
	}

	/**
	 * Search for a pattern in code
	 * @param pattern - Regular expression pattern
	 * @param options - Search options
	 * @returns Map of file paths to matching lines
	 */
	async searchPattern(
		pattern: string,
		options: {
			relativePath?: string;
			contextLines?: number;
			restrictToCodeFiles?: boolean;
			includeGlob?: string;
			excludeGlob?: string;
		} = {},
	): Promise<Map<string, string[]>> {
		await this.ensureConnection();

		const results = await this.serenaAdapter.searchForPattern({
			pattern,
			relativePath: options.relativePath,
			contextLinesBefore: options.contextLines || 2,
			contextLinesAfter: options.contextLines || 2,
			restrictToCodeFiles: options.restrictToCodeFiles !== false,
			includeGlob: options.includeGlob,
			excludeGlob: options.excludeGlob,
		});

		return new Map(Object.entries(results));
	}

	/**
	 * List files in directory
	 * @param relativePath - Directory path
	 * @param recursive - Whether to list recursively
	 */
	async listDirectory(
		relativePath: string = '.',
		recursive: boolean = false,
	): Promise<{directories: string[]; files: string[]}> {
		await this.ensureConnection();

		return this.serenaAdapter.listDir(relativePath, recursive);
	}

	/**
	 * Find files by pattern
	 * @param pattern - File name pattern (with wildcards)
	 * @param relativePath - Directory to search in
	 */
	async findFiles(
		pattern: string,
		relativePath: string = '.',
	): Promise<string[]> {
		await this.ensureConnection();

		return this.serenaAdapter.findFile(pattern, relativePath);
	}

	/**
	 * Get symbol hierarchy for a file
	 * Returns symbols organized in a tree structure
	 */
	async getSymbolHierarchy(filePath: string): Promise<Symbol[]> {
		const symbols = await this.getSymbolsOverview(filePath);

		// Build hierarchy by recursively fetching children
		for (const symbol of symbols) {
			if (symbol.isContainer()) {
				const withChildren = await this.findSymbol(symbol.namePath, {
					relativePath: filePath,
					depth: 1,
				});

				if (withChildren.length > 0 && withChildren[0]?.children) {
					symbol.children = withChildren[0].children;
				}
			}
		}

		return symbols;
	}

	/**
	 * Disconnect from Serena
	 */
	async disconnect(): Promise<void> {
		if (this.serenaAdapter.isConnected()) {
			await this.serenaAdapter.disconnect();
		}
	}
}
