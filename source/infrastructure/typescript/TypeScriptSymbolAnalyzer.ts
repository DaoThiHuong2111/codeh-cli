/**
 * TypeScript Symbol Analyzer
 * Analyzes TypeScript code using the TypeScript Compiler API
 * Provides symbol finding, references, and navigation capabilities
 */

import * as ts from 'typescript';
import * as path from 'path';
import * as fs from 'fs';
import {Symbol, SymbolKind, SymbolLocation} from '../../core/domain/models/Symbol.js';
import {Reference} from '../../core/domain/models/Reference.js';
import {ResultCache} from '../cache/ResultCache.js';

/**
 * Maps TypeScript syntax kind to LSP Symbol Kind
 */
function mapTsKindToSymbolKind(kind: ts.SyntaxKind): SymbolKind {
	switch (kind) {
		case ts.SyntaxKind.ClassDeclaration:
		case ts.SyntaxKind.ClassExpression:
			return SymbolKind.Class;
		case ts.SyntaxKind.InterfaceDeclaration:
			return SymbolKind.Interface;
		case ts.SyntaxKind.EnumDeclaration:
			return SymbolKind.Enum;
		case ts.SyntaxKind.FunctionDeclaration:
		case ts.SyntaxKind.FunctionExpression:
		case ts.SyntaxKind.ArrowFunction:
			return SymbolKind.Function;
		case ts.SyntaxKind.MethodDeclaration:
			return SymbolKind.Method;
		case ts.SyntaxKind.Constructor:
			return SymbolKind.Constructor;
		case ts.SyntaxKind.PropertyDeclaration:
		case ts.SyntaxKind.PropertySignature:
			return SymbolKind.Property;
		case ts.SyntaxKind.VariableDeclaration:
			return SymbolKind.Variable;
		case ts.SyntaxKind.Parameter:
			return SymbolKind.Variable;
		case ts.SyntaxKind.TypeAliasDeclaration:
			return SymbolKind.TypeParameter;
		case ts.SyntaxKind.ModuleDeclaration:
			return SymbolKind.Module;
		case ts.SyntaxKind.EnumMember:
			return SymbolKind.EnumMember;
		default:
			return SymbolKind.Variable;
	}
}

/**
 * TypeScript Symbol Analyzer
 * Uses TypeScript Compiler API for semantic code analysis
 */
export class TypeScriptSymbolAnalyzer {
	private program: ts.Program;
	private checker: ts.TypeChecker;
	private projectRoot: string;
	private languageService: ts.LanguageService;
	private files: Map<string, string> = new Map();
	private fileVersions: Map<string, number> = new Map();
	private configPath: string;
	private parsedConfig: ts.ParsedCommandLine;
	private resultCache: ResultCache;

	constructor(projectRoot: string, tsConfigPath?: string) {
		this.projectRoot = projectRoot;

		// Find tsconfig.json
		this.configPath =
			tsConfigPath || this.findTsConfig() || path.join(projectRoot, 'tsconfig.json');

		// Parse tsconfig
		const configFile = ts.readConfigFile(this.configPath, ts.sys.readFile);
		this.parsedConfig = ts.parseJsonConfigFileContent(
			configFile.config,
			ts.sys,
			path.dirname(this.configPath),
		);

		// Create program
		this.program = ts.createProgram({
			rootNames: this.parsedConfig.fileNames,
			options: this.parsedConfig.options,
		});

		this.checker = this.program.getTypeChecker();

		// Create Language Service for advanced features like findReferences
		const servicesHost: ts.LanguageServiceHost = {
			getScriptFileNames: () => this.parsedConfig.fileNames,
			getScriptVersion: (fileName: string) => {
				return (this.fileVersions.get(fileName) || 0).toString();
			},
			getScriptSnapshot: (fileName: string) => {
				if (!fs.existsSync(fileName)) {
					return undefined;
				}
				const text = fs.readFileSync(fileName, 'utf8');
				this.files.set(fileName, text);
				return ts.ScriptSnapshot.fromString(text);
			},
			getCurrentDirectory: () => this.projectRoot,
			getCompilationSettings: () => this.parsedConfig.options,
			getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
			fileExists: ts.sys.fileExists,
			readFile: ts.sys.readFile,
			readDirectory: ts.sys.readDirectory,
		};

		this.languageService = ts.createLanguageService(
			servicesHost,
			ts.createDocumentRegistry(),
		);

		// Initialize result cache (default: 500 entries)
		this.resultCache = new ResultCache(500);
	}

	/**
	 * Find tsconfig.json in project
	 */
	private findTsConfig(): string | null {
		let currentDir = this.projectRoot;
		while (currentDir !== path.parse(currentDir).root) {
			const tsConfigPath = path.join(currentDir, 'tsconfig.json');
			if (fs.existsSync(tsConfigPath)) {
				return tsConfigPath;
			}

			currentDir = path.dirname(currentDir);
		}

		return null;
	}

	/**
	 * Invalidate cache for specific file
	 * Call this when a file changes to force reanalysis
	 */
	invalidateFile(filePath: string): void {
		const absolutePath = path.isAbsolute(filePath)
			? filePath
			: path.join(this.projectRoot, filePath);

		// Increment version to invalidate Language Service cache
		const currentVersion = this.fileVersions.get(absolutePath) || 0;
		this.fileVersions.set(absolutePath, currentVersion + 1);

		// Remove from files cache
		this.files.delete(absolutePath);

		// Invalidate result cache for this file
		this.resultCache.invalidateFile(absolutePath);
	}

	/**
	 * Invalidate all caches and reload program
	 * Call this when project structure changes
	 */
	invalidateAll(): void {
		// Clear all caches
		this.files.clear();
		this.fileVersions.clear();

		// Recreate program
		this.program = ts.createProgram({
			rootNames: this.parsedConfig.fileNames,
			options: this.parsedConfig.options,
		});

		this.checker = this.program.getTypeChecker();

		// Clear all result caches
		this.resultCache.clearAll();
	}

	/**
	 * Get source file from absolute path
	 */
	private getSourceFile(filePath: string): ts.SourceFile | undefined {
		const absolutePath = path.isAbsolute(filePath)
			? filePath
			: path.join(this.projectRoot, filePath);

		return this.program.getSourceFile(absolutePath);
	}

	/**
	 * Get relative path from absolute path
	 */
	private getRelativePath(absolutePath: string): string {
		return path.relative(this.projectRoot, absolutePath);
	}

	/**
	 * Get symbol location from node
	 */
	private getSymbolLocation(
		node: ts.Node,
		sourceFile: ts.SourceFile,
	): SymbolLocation {
		const start = sourceFile.getLineAndCharacterOfPosition(node.getStart());
		const end = sourceFile.getLineAndCharacterOfPosition(node.getEnd());

		return {
			relativePath: this.getRelativePath(sourceFile.fileName),
			startLine: start.line + 1, // Convert to 1-based
			endLine: end.line + 1,
			startColumn: start.character,
			endColumn: end.character,
		};
	}

	/**
	 * Get symbol name from node
	 */
	private getSymbolName(node: ts.Node): string {
		if (ts.isIdentifier(node)) {
			return node.text;
		}

		if ('name' in node && (node as any).name && ts.isIdentifier((node as any).name)) {
			return ((node as any).name as ts.Identifier).text;
		}

		return 'anonymous';
	}

	/**
	 * Get node body as string
	 */
	private getNodeBody(node: ts.Node, sourceFile: ts.SourceFile): string {
		return node.getText(sourceFile);
	}

	/**
	 * Build name path for a node
	 */
	private getNamePath(node: ts.Node, sourceFile: ts.SourceFile): string {
		const parts: string[] = [];
		let current: ts.Node | undefined = node;

		while (current) {
			const name = this.getSymbolName(current);
			if (name && name !== 'anonymous') {
				parts.unshift(name);
			}

			current = current.parent;

			// Stop at file level
			if (!current || ts.isSourceFile(current)) {
				break;
			}
		}

		return parts.join('/');
	}

	/**
	 * Convert TS node to Symbol model
	 */
	private nodeToSymbol(
		node: ts.Node,
		sourceFile: ts.SourceFile,
		includeBody: boolean = false,
		includeChildren: boolean = false,
	): Symbol {
		const name = this.getSymbolName(node);
		const namePath = this.getNamePath(node, sourceFile);
		const kind = mapTsKindToSymbolKind(node.kind);
		const location = this.getSymbolLocation(node, sourceFile);
		const body = includeBody ? this.getNodeBody(node, sourceFile) : undefined;

		const symbol = new Symbol(name, namePath, kind, location, body);

		// Add children if requested
		if (includeChildren) {
			symbol.children = this.getChildSymbols(node, sourceFile, includeBody);
		}

		return symbol;
	}

	/**
	 * Get child symbols of a node
	 */
	private getChildSymbols(
		node: ts.Node,
		sourceFile: ts.SourceFile,
		includeBody: boolean = false,
	): Symbol[] {
		const children: Symbol[] = [];

		node.forEachChild(child => {
			if (this.isSymbolNode(child)) {
				children.push(this.nodeToSymbol(child, sourceFile, includeBody, false));
			}
		});

		return children;
	}

	/**
	 * Check if node is a symbol we care about
	 */
	private isSymbolNode(node: ts.Node): boolean {
		return (
			ts.isClassDeclaration(node) ||
			ts.isInterfaceDeclaration(node) ||
			ts.isFunctionDeclaration(node) ||
			ts.isMethodDeclaration(node) ||
			ts.isPropertyDeclaration(node) ||
			ts.isEnumDeclaration(node) ||
			ts.isVariableStatement(node) ||
			ts.isTypeAliasDeclaration(node) ||
			ts.isModuleDeclaration(node)
		);
	}

	/**
	 * Get symbols overview for a file
	 * Returns top-level symbols
	 */
	getSymbolsOverview(filePath: string): Symbol[] {
		const sourceFile = this.getSourceFile(filePath);
		if (!sourceFile) {
			throw new Error(`File not found: ${filePath}`);
		}

		const symbols: Symbol[] = [];

		sourceFile.forEachChild(node => {
			if (this.isSymbolNode(node)) {
				symbols.push(this.nodeToSymbol(node, sourceFile, false, false));
			}
		});

		return symbols;
	}

	/**
	 * Find symbols by name pattern
	 */
	findSymbol(
		namePattern: string,
		options: {
			filePath?: string;
			includeBody?: boolean;
			depth?: number;
			substringMatching?: boolean;
		} = {},
	): Symbol[] {
		const results: Symbol[] = [];
		const {filePath, includeBody = false, depth = 0, substringMatching = false} = options;

		// Get source files to search
		const sourceFiles = filePath
			? [this.getSourceFile(filePath)].filter((f): f is ts.SourceFile => f !== undefined)
			: this.program.getSourceFiles().filter(sf => !sf.isDeclarationFile);

		// Parse name pattern (e.g., "ClassName/methodName")
		const parts = namePattern.split('/').filter(p => p.length > 0);
		const targetName = parts[parts.length - 1] || '';
		const parentPath = parts.slice(0, -1);

		for (const sourceFile of sourceFiles) {
			this.visitNode(sourceFile, (node, currentPath) => {
				const nodeName = this.getSymbolName(node);

				// Check if name matches
				const nameMatches = substringMatching
					? nodeName.toLowerCase().includes(targetName.toLowerCase())
					: nodeName === targetName || targetName === '';

				if (!nameMatches) {
					return;
				}

				// Check if parent path matches
				if (parentPath.length > 0) {
					const pathParts = currentPath.split('/');
					const nodeParentPath = pathParts.slice(0, -1);

					// Check if parent path matches (suffix matching)
					let matches = true;
					for (let i = 0; i < parentPath.length; i++) {
						const expectedPart = parentPath[parentPath.length - 1 - i];
						const actualPart = nodeParentPath[nodeParentPath.length - 1 - i];

						if (actualPart !== expectedPart) {
							matches = false;
							break;
						}
					}

					if (!matches) {
						return;
					}
				}

				// Create symbol
				const symbol = this.nodeToSymbol(
					node,
					sourceFile,
					includeBody,
					depth > 0,
				);

				results.push(symbol);
			});
		}

		return results;
	}

	/**
	 * Visit nodes recursively
	 */
	private visitNode(
		node: ts.Node,
		callback: (node: ts.Node, namePath: string) => void,
		currentPath: string = '',
	): void {
		if (this.isSymbolNode(node)) {
			const name = this.getSymbolName(node);
			const newPath = currentPath ? `${currentPath}/${name}` : name;
			callback(node, newPath);

			// Visit children
			node.forEachChild(child => {
				this.visitNode(child, callback, newPath);
			});
		} else {
			// Continue visiting
			node.forEachChild(child => {
				this.visitNode(child, callback, currentPath);
			});
		}
	}

	/**
	 * Find references to a symbol
	 */
	findReferences(namePath: string, filePath: string): Reference[] {
		// Check cache first
		const cached = this.resultCache.getReferences(namePath, filePath);
		if (cached) {
			return cached;
		}

		const sourceFile = this.getSourceFile(filePath);
		if (!sourceFile) {
			throw new Error(`File not found: ${filePath}`);
		}

		// Find the symbol node
		const symbolNodes = this.findSymbol(namePath, {filePath, includeBody: false});
		if (symbolNodes.length === 0) {
			return [];
		}

		const symbolNode = symbolNodes[0];
		const references: Reference[] = [];

		// Use TypeScript's findReferences API via LanguageService
		const absolutePath = path.isAbsolute(filePath)
			? filePath
			: path.join(this.projectRoot, filePath);

		// Get exact position of symbol from source file
		const symbolPosition = sourceFile.getPositionOfLineAndCharacter(
			symbolNode.location.startLine - 1,
			symbolNode.location.startColumn ?? 0,
		);

		const referencedSymbols = this.languageService.findReferences(
			absolutePath,
			symbolPosition,
		);

		if (referencedSymbols) {
			for (const refSymbol of referencedSymbols) {
				for (const ref of refSymbol.references) {
					const refSourceFile = this.program.getSourceFile(ref.fileName);
					if (!refSourceFile) continue;

					const lineAndChar = refSourceFile.getLineAndCharacterOfPosition(
						ref.textSpan.start,
					);

					// Get context around reference
					const contextLines = this.getContextLines(
						refSourceFile,
						lineAndChar.line,
						2,
					);

					// Find containing symbol
					const containingNode = this.findContainingSymbol(
						refSourceFile,
						ref.textSpan.start,
					);

					if (containingNode) {
						const containingSymbol = this.nodeToSymbol(
							containingNode,
							refSourceFile,
							false,
						);

						references.push(
							new Reference(
								containingSymbol,
								lineAndChar.line + 1,
								contextLines,
								symbolNode,
							),
						);
					}
				}
			}
		}

		// Store in cache
		this.resultCache.setReferences(namePath, filePath, references);

		return references;
	}

	/**
	 * Get context lines around a position
	 */
	private getContextLines(
		sourceFile: ts.SourceFile,
		line: number,
		contextSize: number,
	): string {
		const lines = sourceFile.text.split('\n');
		const startLine = Math.max(0, line - contextSize);
		const endLine = Math.min(lines.length - 1, line + contextSize);

		return lines.slice(startLine, endLine + 1).join('\n');
	}

	/**
	 * Find containing symbol node for a position
	 */
	private findContainingSymbol(
		sourceFile: ts.SourceFile,
		position: number,
	): ts.Node | undefined {
		let result: ts.Node | undefined;

		const visit = (node: ts.Node) => {
			if (
				this.isSymbolNode(node) &&
				node.getStart() <= position &&
				node.getEnd() >= position
			) {
				result = node;
			}

			ts.forEachChild(node, visit);
		};

		visit(sourceFile);
		return result;
	}

	/**
	 * Get symbol hierarchy for a file
	 */
	getSymbolHierarchy(filePath: string): Symbol[] {
		// Check cache first
		const cached = this.resultCache.getHierarchy(filePath);
		if (cached) {
			return cached;
		}

		// Compute hierarchy
		const hierarchy = this.findSymbol('', {filePath, depth: 1, substringMatching: true});

		// Store in cache
		this.resultCache.setHierarchy(filePath, hierarchy);

		return hierarchy;
	}

	/**
	 * Rename a symbol across the codebase
	 * Returns locations that need to be renamed
	 */
	renameSymbol(
		namePath: string,
		filePath: string,
		newName: string,
	): Array<{fileName: string; textSpan: any; contextSnippet?: string}> {
		const sourceFile = this.getSourceFile(filePath);
		if (!sourceFile) {
			throw new Error(`File not found: ${filePath}`);
		}

		// Find the symbol
		const symbols = this.findSymbol(namePath, {filePath, includeBody: false});
		if (symbols.length === 0) {
			throw new Error(`Symbol not found: ${namePath}`);
		}

		const symbol = symbols[0];

		// Get absolute path
		const absolutePath = path.isAbsolute(filePath)
			? filePath
			: path.join(this.projectRoot, filePath);

		// Get exact position
		const symbolPosition = sourceFile.getPositionOfLineAndCharacter(
			symbol.location.startLine - 1,
			symbol.location.startColumn ?? 0,
		);

		// Find rename locations using Language Service
		const renameLocations = this.languageService.findRenameLocations(
			absolutePath,
			symbolPosition,
			false, // findInStrings
			false, // findInComments
		);

		if (!renameLocations) {
			return [];
		}

		// Map to our format with context
		const results: Array<{
			fileName: string;
			textSpan: any;
			contextSnippet?: string;
		}> = [];

		for (const loc of renameLocations) {
			const locSourceFile = this.program.getSourceFile(loc.fileName);
			if (!locSourceFile) continue;

			const lineAndChar = locSourceFile.getLineAndCharacterOfPosition(
				loc.textSpan.start,
			);

			// Get context line
			const lines = locSourceFile.text.split('\n');
			const contextSnippet = lines[lineAndChar.line]?.trim() || '';

			results.push({
				fileName: path.relative(this.projectRoot, loc.fileName),
				textSpan: {
					start: loc.textSpan.start,
					length: loc.textSpan.length,
					line: lineAndChar.line,
					character: lineAndChar.character,
				},
				contextSnippet,
			});
		}

		return results;
	}

	/**
	 * Get cache performance statistics
	 * Useful for monitoring cache effectiveness
	 */
	getCacheStats() {
		return this.resultCache.getStats();
	}

	/**
	 * Clear result cache statistics
	 */
	resetCacheStats() {
		this.resultCache.resetStats();
	}

	/**
	 * Get type information for a symbol
	 */
	getTypeInformation(
		filePath: string,
		symbolName: string,
		line?: number,
	): TypeInformation | null {
		const sourceFile = this.getSourceFile(filePath);
		if (!sourceFile) {
			return null;
		}

		// Find symbol at specific line or by name
		let targetNode: ts.Node | undefined;

		if (line !== undefined) {
			// Find symbol at specific line
			const position = sourceFile.getPositionOfLineAndCharacter(line - 1, 0);
			targetNode = this.findNodeAtPosition(sourceFile, position, symbolName);
		} else {
			// Find symbol by name
			const symbols = this.findSymbol(symbolName, {filePath, includeBody: false});
			if (symbols.length === 0) {
				return null;
			}

			// Get node from first symbol
			const symbol = symbols[0];
			const symbolPosition = sourceFile.getPositionOfLineAndCharacter(
				symbol.location.startLine - 1,
				symbol.location.startColumn ?? 0,
			);
			targetNode = this.findNodeAtPosition(sourceFile, symbolPosition, symbolName);
		}

		if (!targetNode) {
			return null;
		}

		// Get type from TypeChecker
		const type = this.checker.getTypeAtLocation(targetNode);
		const typeString = this.checker.typeToString(type);

		// Get symbol info
		const tsSymbol = this.checker.getSymbolAtLocation(targetNode);
		const documentation = tsSymbol
			? ts.displayPartsToString(tsSymbol.getDocumentationComment(this.checker))
			: '';

		// Check if async
		const isAsync = !!(targetNode as any).modifiers?.some(
			(mod: any) => mod.kind === ts.SyntaxKind.AsyncKeyword,
		);

		// Check if optional
		const isOptional = !!(targetNode as any).questionToken;

		// Get signature for functions
		let signature: string | undefined;
		if (
			ts.isFunctionDeclaration(targetNode) ||
			ts.isMethodDeclaration(targetNode) ||
			ts.isArrowFunction(targetNode)
		) {
			const sig = this.checker.getSignatureFromDeclaration(targetNode as any);
			if (sig) {
				signature = this.checker.signatureToString(sig);
			}
		}

		return {
			typeString,
			kind: ts.SyntaxKind[targetNode.kind],
			isOptional,
			isAsync,
			documentation,
			signature,
		};
	}

	/**
	 * Find node at specific position with matching name
	 */
	private findNodeAtPosition(
		sourceFile: ts.SourceFile,
		position: number,
		symbolName: string,
	): ts.Node | undefined {
		let result: ts.Node | undefined;

		const visit = (node: ts.Node) => {
			if (node.getStart() <= position && node.getEnd() >= position) {
				// Check if this node has the matching name
				if (
					(ts.isVariableDeclaration(node) ||
						ts.isFunctionDeclaration(node) ||
						ts.isMethodDeclaration(node) ||
						ts.isPropertyDeclaration(node) ||
						ts.isParameter(node)) &&
					node.name &&
					ts.isIdentifier(node.name) &&
					node.name.text === symbolName
				) {
					result = node;
					return;
				}

				ts.forEachChild(node, visit);
			}
		};

		visit(sourceFile);
		return result;
	}
}

/**
 * Type information for a symbol
 */
export interface TypeInformation {
	typeString: string; // e.g., "string", "Promise<number>", "User | null"
	kind: string; // e.g., "VariableDeclaration", "FunctionDeclaration"
	isOptional: boolean;
	isAsync: boolean;
	documentation: string;
	signature?: string; // For functions: full signature
}
