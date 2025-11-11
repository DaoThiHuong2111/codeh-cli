/**
 * Symbol Search Tool
 * Searches for symbols in TypeScript code using semantic analysis
 */

import {Tool} from './base/Tool';
import {ToolDefinition, ToolExecutionResult} from '../domain/interfaces/IToolExecutor';
import {TypeScriptSymbolAnalyzer} from '../../infrastructure/typescript/TypeScriptSymbolAnalyzer';

export class SymbolSearchTool extends Tool {
	private analyzer?: TypeScriptSymbolAnalyzer;

	constructor(private projectRoot: string) {
		super(
			'symbol_search',
			'Search for symbols (classes, functions, methods) in TypeScript code by name pattern',
		);
	}

	/**
	 * Lazy initialize analyzer
	 */
	private getAnalyzer(): TypeScriptSymbolAnalyzer {
		if (!this.analyzer) {
			this.analyzer = new TypeScriptSymbolAnalyzer(this.projectRoot);
		}

		return this.analyzer;
	}

	getDefinition(): ToolDefinition {
		return {
			name: this.name,
			description: this.description,
			inputSchema: {
				type: 'object',
				properties: {
					namePattern: {
						type: 'string',
						description:
							'Symbol name or path pattern (e.g., "MyClass", "MyClass/myMethod")',
					},
					filePath: {
						type: 'string',
						description:
							'Optional: Relative path to file or directory to search in',
					},
					includeBody: {
						type: 'boolean',
						description: 'Include symbol body (source code)',
						default: false,
					},
					depth: {
						type: 'number',
						description: 'Include children symbols (0=no children, 1=direct children)',
						default: 0,
					},
					substringMatching: {
						type: 'boolean',
						description: 'Use substring matching instead of exact match',
						default: false,
					},
				},
				required: ['namePattern'],
			},
		};
	}

	async execute(parameters: Record<string, any>): Promise<ToolExecutionResult> {
		try {
			// Validate parameters
			if (!this.validateParameters(parameters)) {
				return this.createErrorResult('Invalid parameters');
			}

			const {namePattern, filePath, includeBody, depth, substringMatching} =
				parameters;

			// Search for symbols
			const analyzer = this.getAnalyzer();
			const symbols = analyzer.findSymbol(namePattern, {
				filePath,
				includeBody: includeBody || false,
				depth: depth || 0,
				substringMatching: substringMatching || false,
			});

			// Format output
			const output = this.formatSymbolsOutput(symbols);

			return this.createSuccessResult(output, {
				count: symbols.length,
				symbols: symbols.map(s => s.toJSON()),
			});
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			return this.createErrorResult(`Failed to search symbols: ${message}`);
		}
	}

	validateParameters(parameters: Record<string, any>): boolean {
		return typeof parameters.namePattern === 'string';
	}

	/**
	 * Format symbols output for display
	 */
	private formatSymbolsOutput(symbols: any[]): string {
		if (symbols.length === 0) {
			return 'No symbols found';
		}

		const lines: string[] = [`Found ${symbols.length} symbol(s):\n`];

		for (const symbol of symbols) {
			lines.push(`📍 ${symbol.namePath}`);
			lines.push(`   Kind: ${symbol.getKindName()}`);
			lines.push(
				`   Location: ${symbol.location.relativePath}:${symbol.location.startLine}`,
			);

			if (symbol.body) {
				const preview =
					symbol.body.length > 100
						? symbol.body.substring(0, 100) + '...'
						: symbol.body;
				lines.push(`   Preview: ${preview}`);
			}

			if (symbol.children && symbol.children.length > 0) {
				lines.push(`   Children: ${symbol.children.length}`);
			}

			lines.push('');
		}

		return lines.join('\n');
	}
}
