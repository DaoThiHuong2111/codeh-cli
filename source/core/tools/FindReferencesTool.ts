/**
 * Find References Tool
 * Finds all references to a symbol in TypeScript code
 */

import {Tool} from './base/Tool';
import {ToolDefinition, ToolExecutionResult} from '../domain/interfaces/IToolExecutor';
import {TypeScriptSymbolAnalyzer} from '../../infrastructure/typescript/TypeScriptSymbolAnalyzer';

export class FindReferencesTool extends Tool {
	private analyzer?: TypeScriptSymbolAnalyzer;

	constructor(private projectRoot: string) {
		super(
			'find_references',
			'Find all references to a symbol (who is calling this function/using this class)',
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
					namePath: {
						type: 'string',
						description:
							'Symbol name path (e.g., "MyClass/myMethod")',
					},
					filePath: {
						type: 'string',
						description: 'Relative path to file containing the symbol',
					},
				},
				required: ['namePath', 'filePath'],
			},
		};
	}

	async execute(parameters: Record<string, any>): Promise<ToolExecutionResult> {
		try {
			// Validate parameters
			if (!this.validateParameters(parameters)) {
				return this.createErrorResult('Invalid parameters');
			}

			const {namePath, filePath} = parameters;

			// Find references
			const analyzer = this.getAnalyzer();
			const references = analyzer.findReferences(namePath, filePath);

			// Format output
			const output = this.formatReferencesOutput(references);

			return this.createSuccessResult(output, {
				count: references.length,
				references: references.map(r => r.toJSON()),
			});
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			return this.createErrorResult(`Failed to find references: ${message}`);
		}
	}

	validateParameters(parameters: Record<string, any>): boolean {
		return (
			typeof parameters.namePath === 'string' &&
			typeof parameters.filePath === 'string'
		);
	}

	/**
	 * Format references output for display
	 */
	private formatReferencesOutput(references: any[]): string {
		if (references.length === 0) {
			return 'No references found';
		}

		const lines: string[] = [`Found ${references.length} reference(s):\n`];

		for (const ref of references) {
			lines.push(`📍 ${ref.getFilePath()}:${ref.line}`);
			lines.push(`   In: ${ref.symbol.namePath}`);

			const highlightedLine = ref.getHighlightedLine();
			if (highlightedLine) {
				lines.push(`   Code: ${highlightedLine.trim()}`);
			}

			lines.push('');
		}

		return lines.join('\n');
	}
}
