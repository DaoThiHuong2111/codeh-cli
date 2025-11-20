/**
 * Symbol Analyzer Interface
 *
 * Interface for analyzing TypeScript symbols and code structure.
 * This allows Core layer to depend on abstraction instead of concrete implementation.
 *
 * @interface ISymbolAnalyzer
 */

import {Symbol} from '../models/Symbol.js';
import {Reference} from '../models/Reference.js';

/**
 * Type information for a symbol
 */
export interface TypeInfo {
	typeString: string;
	kind: string;
	isOptional: boolean;
	isAsync: boolean;
	documentation?: string;
	signature?: string;
}

/**
 * Options for finding symbols
 */
export interface FindSymbolOptions {
	filePath?: string;
	includeBody?: boolean;
	depth?: number;
	substringMatching?: boolean;
}

/**
 * Symbol analyzer interface
 *
 * Provides methods for analyzing TypeScript code structure and symbols.
 */
export interface ISymbolAnalyzer {
	/**
	 * Find symbols by name pattern
	 *
	 * @param name - Symbol name or pattern
	 * @param options - Search options
	 * @returns Array of matching symbols
	 */
	findSymbol(name: string, options?: FindSymbolOptions): Symbol[];

	/**
	 * Find all references to a symbol
	 *
	 * @param symbolName - Name of the symbol
	 * @param filePath - File containing the symbol
	 * @returns Array of references
	 */
	findReferences(symbolName: string, filePath: string): Reference[];

	/**
	 * Get type information for a symbol
	 *
	 * @param filePath - File containing the symbol
	 * @param symbolName - Name of the symbol
	 * @param line - Optional line number
	 * @returns Type information or null if not found
	 */
	getTypeInformation(
		filePath: string,
		symbolName: string,
		line?: number,
	): TypeInfo | null;

	/**
	 * Get overview of symbols in a file
	 *
	 * @param filePath - Path to the file
	 * @returns Array of top-level symbols
	 */
	getSymbolsOverview(filePath: string): Symbol[];

	/**
	 * Invalidate all caches
	 *
	 * Forces re-analysis on next request.
	 */
	invalidateAll(): void;

	/**
	 * Rename a symbol throughout the codebase
	 *
	 * @param namePath - Symbol name path
	 * @param filePath - File containing the symbol
	 * @param newName - New symbol name
	 * @returns Array of rename locations
	 */
	renameSymbol(
		namePath: string,
		filePath: string,
		newName: string,
	): Array<{fileName: string; textSpan: any; contextSnippet?: string}>;

	/**
	 * Get symbol hierarchy for a file
	 *
	 * @param filePath - Path to the file
	 * @returns Array of symbols in hierarchical structure
	 */
	getSymbolHierarchy(filePath: string): Symbol[];

	/**
	 * Get diagnostics (errors/warnings) for the project or specific files
	 * 
	 * @param files - Optional list of files to check
	 * @returns Array of diagnostics
	 */
	getDiagnostics(files?: string[]): any[];
}
