/**
 * Get Symbols Overview Tool
 * Gets an overview of top-level symbols in a TypeScript file
 */

import {Tool} from './base/Tool';
import {ToolDefinition, ToolExecutionResult} from '../domain/interfaces/IToolExecutor';
import {TypeScriptSymbolAnalyzer} from '../../infrastructure/typescript/TypeScriptSymbolAnalyzer';

export class GetSymbolsOverviewTool extends Tool {
	private analyzer?: TypeScriptSymbolAnalyzer;

	constructor(private projectRoot: string) {
		super(
			'get_symbols_overview',
			'Get an overview of top-level symbols (classes, functions, interfaces) in a TypeScript file',
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
					filePath: {
						type: 'string',
						description: 'Relative path to TypeScript file',
					},
				},
				required: ['filePath'],
			},
		};
	}

	async execute(parameters: Record<string, any>): Promise<ToolExecutionResult> {
		try {
			// Validate parameters
			if (!this.validateParameters(parameters)) {
				return this.createErrorResult('Invalid parameters');
			}

			const {filePath} = parameters;

			// Get symbols overview
			const analyzer = this.getAnalyzer();
			const symbols = analyzer.getSymbolsOverview(filePath);

			// Format output
			const output = this.formatOverviewOutput(filePath, symbols);

			return this.createSuccessResult(output, {
				count: symbols.length,
				symbols: symbols.map(s => s.toJSON()),
			});
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			return this.createErrorResult(
				`Failed to get symbols overview: ${message}`,
			);
		}
	}

	validateParameters(parameters: Record<string, any>): boolean {
		return typeof parameters.filePath === 'string';
	}

	/**
	 * Format overview output for display
	 */
	private formatOverviewOutput(filePath: string, symbols: any[]): string {
		const lines: string[] = [`📄 ${filePath}\n`];

		if (symbols.length === 0) {
			lines.push('No symbols found');
			return lines.join('\n');
		}

		lines.push(`Found ${symbols.length} top-level symbol(s):\n`);

		// Group by kind
		const byKind = new Map<string, any[]>();
		for (const symbol of symbols) {
			const kind = symbol.getKindName();
			if (!byKind.has(kind)) {
				byKind.set(kind, []);
			}

			byKind.get(kind)!.push(symbol);
		}

		// Display grouped
		for (const [kind, symbolsOfKind] of byKind) {
			lines.push(`\n${kind}s:`);
			for (const symbol of symbolsOfKind) {
				const signature = symbol.getSignature();
				lines.push(`  • ${symbol.name}`);
				if (signature !== symbol.name) {
					lines.push(`    ${signature}`);
				}

				lines.push(`    @ line ${symbol.location.startLine}`);
			}
		}

		return lines.join('\n');
	}
}
