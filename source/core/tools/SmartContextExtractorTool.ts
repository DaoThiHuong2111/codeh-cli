/**
 * Smart Context Extractor Tool
 * Intelligently extracts relevant context for understanding a symbol
 * Includes definition, callers, dependencies, and related types
 */

import {Tool} from './base/Tool.js';
import {
	ToolDefinition,
	ToolExecutionResult,
} from '../domain/interfaces/IToolExecutor.js';
import {ISymbolAnalyzer} from '../domain/interfaces/ISymbolAnalyzer.js';

interface SmartContextExtractorArgs {
	filePath: string;
	symbolName: string;
	includeCallers?: boolean;
	includeDependencies?: boolean;
	includeTypes?: boolean;
	maxDepth?: number;
}

export class SmartContextExtractorTool extends Tool {
	constructor(
		private projectRoot: string,
		private analyzer: ISymbolAnalyzer,
	) {
		super(
			'smart_context_extractor',
			'Intelligently extract all relevant context needed to understand a symbol (function, class, etc',
		);
	}

	getDefinition(): ToolDefinition {
		return {
			name: 'smart_context_extractor',
			description:
				'Intelligently extract all relevant context needed to understand a symbol (function, class, etc.). Automatically includes definition, callers, dependencies, and related types. Optimizes context to be sufficient but not excessive.',
			inputSchema: {
				type: 'object',
				properties: {
					filePath: {
						type: 'string',
						description: 'Path to file containing the symbol',
					},
					symbolName: {
						type: 'string',
						description: 'Name of the symbol to extract context for',
					},
					includeCallers: {
						type: 'boolean',
						description:
							'Include functions that call this symbol (default: true)',
					},
					includeDependencies: {
						type: 'boolean',
						description: 'Include symbols this depends on (default: true)',
					},
					includeTypes: {
						type: 'boolean',
						description:
							'Include type definitions used by this symbol (default: true)',
					},
					maxDepth: {
						type: 'number',
						description: 'Maximum depth to traverse dependencies (default: 2)',
					},
				},
				required: ['filePath', 'symbolName'],
			},
		};
	}

	validateParameters(parameters: Record<string, any>): boolean {
		return true; // Basic validation
	}

	async execute(args: SmartContextExtractorArgs): Promise<ToolExecutionResult> {
		try {
			const {
				filePath,
				symbolName,
				includeCallers = true,
				includeDependencies = true,
				includeTypes = true,
				maxDepth = 2,
			} = args;

			// 1. Get symbol definition
			const symbols = this.analyzer.findSymbol(symbolName, {
				filePath,
				includeBody: true,
				depth: 1,
			});

			if (symbols.length === 0) {
				return {
					success: false,
					output: `Symbol "${symbolName}" not found in ${filePath}`,
				};
			}

			const targetSymbol = symbols[0];

			// 2. Get callers (references)
			const callers = includeCallers
				? this.analyzer.findReferences(symbolName, filePath)
				: [];

			// 3. Get type information
			const typeInfo = includeTypes
				? this.analyzer.getTypeInformation(filePath, symbolName)
				: null;

			// 4. Build context object
			const context = {
				definition: {
					name: targetSymbol.name,
					kind: targetSymbol.kind,
					file: targetSymbol.location.relativePath,
					line: targetSymbol.location.startLine,
					body: targetSymbol.body,
				},
				callers: callers.slice(0, 10).map(ref => ({
					// Limit to 10 callers
					symbol: ref.symbol.name,
					file: ref.symbol.location.relativePath,
					line: ref.line,
					context: ref.contentAroundReference,
				})),
				typeInfo: typeInfo
					? {
							type: typeInfo.typeString,
							isOptional: typeInfo.isOptional,
							isAsync: typeInfo.isAsync,
							signature: typeInfo.signature,
						}
					: null,
				children: targetSymbol.children?.map(child => ({
					name: child.name,
					kind: child.kind,
				})),
			};

			return {
				success: true,
				output: `Extracted smart context for "${symbolName}" (${callers.length} caller(s))`,
				metadata: {
					...context,
					stats: {
						callerCount: callers.length,
						childrenCount: targetSymbol.children?.length || 0,
						hasTypeInfo: typeInfo !== null,
					},
				},
			};
		} catch (error) {
			return {
				success: false,
				output: `Error extracting context: ${error instanceof Error ? error.message : String(error)}`,
			};
		}
	}
}
