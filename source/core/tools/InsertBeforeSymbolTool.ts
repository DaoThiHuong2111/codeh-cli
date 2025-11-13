/**
 * Insert Before Symbol Tool
 * Inserts content before a symbol (useful for imports, decorators, annotations)
 */

import * as fs from 'fs';
import * as path from 'path';
import {Tool} from './base/Tool';
import {
	ToolDefinition,
	ToolExecutionResult,
} from '../domain/interfaces/IToolExecutor';
import {ISymbolAnalyzer} from '../domain/interfaces/ISymbolAnalyzer';
import {TypeScriptSymbolAnalyzer} from '../../infrastructure/typescript/TypeScriptSymbolAnalyzer';

export interface InsertBeforeSymbolOptions {
	namePath: string;
	filePath: string;
	content: string;
}

export class InsertBeforeSymbolTool extends Tool {
	private analyzer?: ISymbolAnalyzer;

	constructor(private projectRoot: string) {
		super(
			'insert_before_symbol',
			'Insert content before a symbol (imports, decorators, etc.)',
		);
	}

	getDefinition(): ToolDefinition {
		return {
			name: 'insert_before_symbol',
			description:
				'Insert content before the beginning of a symbol. Useful for adding imports before the first symbol, or adding decorators/annotations before classes/methods.',
			inputSchema: {
				type: 'object',
				properties: {
					namePath: {
						type: 'string',
						description: 'Symbol name path to insert before',
					},
					filePath: {
						type: 'string',
						description: 'Relative path to file',
					},
					content: {
						type: 'string',
						description: 'Content to insert',
					},
				},
				required: ['namePath', 'filePath', 'content'],
			},
		};
	}

	validateParameters(parameters: Record<string, any>): boolean {
		return (
			typeof parameters.namePath === 'string' &&
			typeof parameters.filePath === 'string' &&
			typeof parameters.content === 'string'
		);
	}

	private getAnalyzer(): ISymbolAnalyzer {
		if (!this.analyzer) {
			this.analyzer = new TypeScriptSymbolAnalyzer(this.projectRoot);
		}
		return this.analyzer;
	}

	async execute(parameters: Record<string, any>): Promise<ToolExecutionResult> {
		const {namePath, filePath, content} =
			parameters as InsertBeforeSymbolOptions;

		if (!namePath || !filePath || content === undefined) {
			return this.createErrorResult(
				'Missing required parameters: namePath, filePath, and content are required',
			);
		}

		try {
			const analyzer = this.getAnalyzer();

			// Find the symbol
			const symbols = analyzer.findSymbol(namePath, {
				filePath,
				includeBody: false,
			});

			if (symbols.length === 0) {
				return this.createErrorResult(
					`Symbol not found: "${namePath}" in file "${filePath}"`,
				);
			}

			const symbol = symbols[0];

			// Read the file
			const absolutePath = path.isAbsolute(filePath)
				? filePath
				: path.join(this.projectRoot, filePath);

			const fileContent = fs.readFileSync(absolutePath, 'utf8');
			const lines = fileContent.split('\n');

			// Insert before symbol (before startLine)
			const insertLine = symbol.location.startLine - 1; // 0-indexed

			const before = lines.slice(0, insertLine).join('\n');
			const after = lines.slice(insertLine).join('\n');

			// Add content with proper line breaks
			const newContent = [before, content, after].filter(Boolean).join('\n');

			// Write back
			fs.writeFileSync(absolutePath, newContent, 'utf8');

			const output = [
				`✨ Inserted content before "${symbol.name}"`,
				`📄 File: ${filePath}`,
				`📍 Inserted at line ${symbol.location.startLine}`,
				`\n📝 Inserted content:`,
				content.split('\n').slice(0, 5).join('\n'),
				content.split('\n').length > 5 ? '   ...' : '',
			]
				.filter(Boolean)
				.join('\n');

			return this.createSuccessResult(output, {
				symbol: symbol.name,
				file: filePath,
				insertedAtLine: symbol.location.startLine,
			});
		} catch (error: any) {
			return this.createErrorResult(
				`Failed to insert before symbol: ${error.message}`,
			);
		}
	}
}
