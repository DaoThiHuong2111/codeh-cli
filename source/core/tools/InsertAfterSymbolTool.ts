/**
 * Insert After Symbol Tool
 * Inserts content after a symbol (useful for adding methods, properties, etc.)
 */

import * as fs from 'fs';
import * as path from 'path';
import {Tool} from './base/Tool';
import {
	ToolDefinition,
	ToolExecutionResult,
} from '../domain/interfaces/IToolExecutor';
import {TypeScriptSymbolAnalyzer} from '../../infrastructure/typescript/TypeScriptSymbolAnalyzer';

export interface InsertAfterSymbolOptions {
	namePath: string;
	filePath: string;
	content: string;
}

export class InsertAfterSymbolTool extends Tool {
	private analyzer?: TypeScriptSymbolAnalyzer;

	constructor(private projectRoot: string) {
		super(
			'insert_after_symbol',
			'Insert content after a symbol (methods, properties, etc.)',
		);
	}

	getDefinition(): ToolDefinition {
		return {
			name: 'insert_after_symbol',
			description:
				'Insert content after the end of a symbol. Useful for adding new methods to a class, or adding new functions after existing ones.',
			inputSchema: {
				type: 'object',
				properties: {
					namePath: {
						type: 'string',
						description: 'Symbol name path to insert after',
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

	private getAnalyzer(): TypeScriptSymbolAnalyzer {
		if (!this.analyzer) {
			this.analyzer = new TypeScriptSymbolAnalyzer(this.projectRoot);
		}
		return this.analyzer;
	}

	async execute(parameters: Record<string, any>): Promise<ToolExecutionResult> {
		const {namePath, filePath, content} = parameters as InsertAfterSymbolOptions;

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

			// Insert after symbol (after endLine)
			const insertLine = symbol.location.endLine; // After end line

			const before = lines.slice(0, insertLine).join('\n');
			const after = lines.slice(insertLine).join('\n');

			// Add content with proper line breaks
			const newContent = [before, content, after].filter(Boolean).join('\n');

			// Write back
			fs.writeFileSync(absolutePath, newContent, 'utf8');

			const output = [
				`✨ Inserted content after "${symbol.name}"`,
				`📄 File: ${filePath}`,
				`📍 Inserted at line ${symbol.location.endLine + 1}`,
				`\n📝 Inserted content:`,
				content.split('\n').slice(0, 5).join('\n'),
				content.split('\n').length > 5 ? '   ...' : '',
			]
				.filter(Boolean)
				.join('\n');

			return this.createSuccessResult(output, {
				symbol: symbol.name,
				file: filePath,
				insertedAtLine: symbol.location.endLine + 1,
			});
		} catch (error: any) {
			return this.createErrorResult(
				`Failed to insert after symbol: ${error.message}`,
			);
		}
	}
}
