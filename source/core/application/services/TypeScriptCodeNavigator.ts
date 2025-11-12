/**
 * TypeScript Code Navigator Service
 * Provides semantic code navigation for TypeScript using TS Compiler API
 */

import {TypeScriptSymbolAnalyzer} from '../../../infrastructure/typescript/TypeScriptSymbolAnalyzer.js';
import {Symbol, SymbolKind} from '../../domain/models/Symbol.js';
import {Reference} from '../../domain/models/Reference.js';

export interface NavigationOptions {
	includeBody?: boolean;
	depth?: number;
	substringMatching?: boolean;
}

export interface SearchOptions {
	filePath?: string;
	includeKinds?: SymbolKind[];
	excludeKinds?: SymbolKind[];
}

/**
 * TypeScript Code Navigator - Semantic code navigation service
 * Uses TypeScript Compiler API directly for maximum performance
 */
export class TypeScriptCodeNavigator {
	private analyzer: TypeScriptSymbolAnalyzer;

	constructor(projectRoot: string, tsConfigPath?: string) {
		this.analyzer = new TypeScriptSymbolAnalyzer(projectRoot, tsConfigPath);
	}

	/**
	 * Get overview of symbols in a file
	 * @param filePath - Relative path to file
	 * @returns Array of top-level symbols
	 */
	async getSymbolsOverview(filePath: string): Promise<Symbol[]> {
		return this.analyzer.getSymbolsOverview(filePath);
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
		return this.analyzer.findSymbol(namePattern, {
			filePath: options.filePath,
			includeBody: options.includeBody || false,
			depth: options.depth || 0,
			substringMatching: options.substringMatching || false,
		});
	}

	/**
	 * Find all references to a symbol
	 * @param symbol - Symbol to find references for
	 * @returns Array of references
	 */
	async findReferences(symbol: Symbol): Promise<Reference[]> {
		return this.analyzer.findReferences(
			symbol.namePath,
			symbol.location.relativePath,
		);
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
		return this.analyzer.findReferences(namePath, filePath);
	}

	/**
	 * Find classes in a file
	 * @param filePath - Path to search in
	 * @param options - Navigation options
	 */
	async findClasses(
		filePath?: string,
		options: NavigationOptions = {},
	): Promise<Symbol[]> {
		const symbols = await this.findSymbol('', {
			...options,
			filePath,
			substringMatching: true,
		});

		return symbols.filter(s => s.kind === SymbolKind.Class);
	}

	/**
	 * Find functions in a file
	 * @param filePath - Path to search in
	 * @param options - Navigation options
	 */
	async findFunctions(
		filePath?: string,
		options: NavigationOptions = {},
	): Promise<Symbol[]> {
		const symbols = await this.findSymbol('', {
			...options,
			filePath,
			substringMatching: true,
		});

		return symbols.filter(s => s.kind === SymbolKind.Function);
	}

	/**
	 * Find methods in a class
	 * @param className - Name of the class
	 * @param filePath - File containing the class
	 * @param options - Navigation options
	 */
	async findMethodsInClass(
		className: string,
		filePath?: string,
		options: NavigationOptions = {},
	): Promise<Symbol[]> {
		const classes = await this.findSymbol(className, {
			...options,
			filePath,
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
	 * @param filePath - File path
	 */
	async getDefinition(
		namePattern: string,
		filePath?: string,
	): Promise<Symbol | undefined> {
		const symbols = await this.findSymbol(namePattern, {
			filePath,
			includeBody: true,
			depth: 0,
		});

		return symbols[0];
	}

	/**
	 * Get symbol hierarchy for a file
	 * Returns symbols organized in a tree structure
	 */
	async getSymbolHierarchy(filePath: string): Promise<Symbol[]> {
		return this.analyzer.getSymbolHierarchy(filePath);
	}
}
