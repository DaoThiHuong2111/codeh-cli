/**
 * Replace Symbol Body Tool
 * Replaces the body/implementation of a symbol (function, method, class)
 */

import * as fs from 'fs';
import * as path from 'path';
import {Tool} from './base/Tool';
import {
	ToolDefinition,
	ToolExecutionResult,
} from '../domain/interfaces/IToolExecutor';
import {TypeScriptSymbolAnalyzer} from '../../infrastructure/typescript/TypeScriptSymbolAnalyzer';

export interface ReplaceSymbolBodyOptions {
	namePath: string; // Symbol whose body to replace
	filePath: string; // File containing the symbol
	newBody: string; // New body content
}

export class ReplaceSymbolBodyTool extends Tool {
	private analyzer?: TypeScriptSymbolAnalyzer;

	constructor(private projectRoot: string) {
		super(
			'replace_symbol_body',
			'Replace the implementation/body of a function, method, or class',
		);
	}

	getDefinition(): ToolDefinition {
		return {
			name: 'replace_symbol_body',
			description:
				'Replace the complete body/implementation of a symbol (function, method, class). The body includes the signature and implementation but NOT docstrings or imports.',
			inputSchema: {
				type: 'object',
				properties: {
					namePath: {
						type: 'string',
						description:
							'Symbol name path (e.g., "UserService" or "UserService/createUser")',
					},
					filePath: {
						type: 'string',
						description: 'Relative path to file containing the symbol',
					},
					newBody: {
						type: 'string',
						description:
							'New body content (include signature for functions/methods)',
					},
				},
				required: ['namePath', 'filePath', 'newBody'],
			},
		};
	}

	validateParameters(parameters: Record<string, any>): boolean {
		return (
			typeof parameters.namePath === 'string' &&
			typeof parameters.filePath === 'string' &&
			typeof parameters.newBody === 'string'
		);
	}

	private getAnalyzer(): TypeScriptSymbolAnalyzer {
		if (!this.analyzer) {
			this.analyzer = new TypeScriptSymbolAnalyzer(this.projectRoot);
		}
		return this.analyzer;
	}

	async execute(parameters: Record<string, any>): Promise<ToolExecutionResult> {
		const {namePath, filePath, newBody} = parameters as ReplaceSymbolBodyOptions;

		if (!namePath || !filePath || newBody === undefined) {
			return this.createErrorResult(
				'Missing required parameters: namePath, filePath, and newBody are required',
			);
		}

		try {
			const analyzer = this.getAnalyzer();

			// Find the symbol
			const symbols = analyzer.findSymbol(namePath, {
				filePath,
				includeBody: true,
			});

			if (symbols.length === 0) {
				return this.createErrorResult(
					`Symbol not found: "${namePath}" in file "${filePath}"`,
				);
			}

			const symbol = symbols[0];

			if (!symbol.body) {
				return this.createErrorResult(
					`Symbol "${namePath}" has no body to replace`,
				);
			}

			// Read the file
			const absolutePath = path.isAbsolute(filePath)
				? filePath
				: path.join(this.projectRoot, filePath);

			const fileContent = fs.readFileSync(absolutePath, 'utf8');
			const lines = fileContent.split('\n');

			// Calculate body range (from startLine to endLine)
			const startLine = symbol.location.startLine - 1; // 0-indexed
			const endLine = symbol.location.endLine - 1;

			// Replace the body
			const before = lines.slice(0, startLine).join('\n');
			const after = lines.slice(endLine + 1).join('\n');

			// Ensure proper indentation for new body
			const indentation = this.detectIndentation(lines[startLine] || '');
			const indentedBody = this.indentCode(newBody, indentation);

			const newContent = [before, indentedBody, after]
				.filter(Boolean)
				.join('\n');

			// Write back to file
			fs.writeFileSync(absolutePath, newContent, 'utf8');

			const output = [
				`✨ Replaced body of "${symbol.name}"`,
				`📄 File: ${filePath}`,
				`📍 Lines ${symbol.location.startLine}-${symbol.location.endLine} replaced`,
				`\n🔍 Old body preview:`,
				symbol.body.split('\n').slice(0, 3).join('\n'),
				symbol.body.split('\n').length > 3 ? '   ...' : '',
				`\n✨ New body preview:`,
				newBody.split('\n').slice(0, 3).join('\n'),
				newBody.split('\n').length > 3 ? '   ...' : '',
			]
				.filter(Boolean)
				.join('\n');

			return this.createSuccessResult(output, {
				symbol: symbol.name,
				file: filePath,
				linesReplaced: endLine - startLine + 1,
			});
		} catch (error: any) {
			return this.createErrorResult(
				`Failed to replace symbol body: ${error.message}`,
			);
		}
	}

	private detectIndentation(line: string): string {
		const match = line.match(/^(\s+)/);
		return match ? match[1] : '';
	}

	private indentCode(code: string, indentation: string): string {
		const lines = code.split('\n');
		return lines.map(line => (line.trim() ? indentation + line : line)).join('\n');
	}
}
