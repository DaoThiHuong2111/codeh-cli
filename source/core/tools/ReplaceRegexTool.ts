/**
 * Replace Regex Tool
 * Find and replace using regular expressions
 */

import * as fs from 'fs';
import * as path from 'path';
import {Tool} from './base/Tool';
import {
	ToolDefinition,
	ToolExecutionResult,
} from '../domain/interfaces/IToolExecutor';

export interface ReplaceRegexOptions {
	filePath: string;
	pattern: string; // Regex pattern
	replacement: string; // Replacement string (can use $1, $2 for groups)
	flags?: string; // Regex flags (g, i, m, etc.)
}

export class ReplaceRegexTool extends Tool {
	constructor(private projectRoot: string) {
		super('replace_regex', 'Find and replace using regular expressions');
	}

	getDefinition(): ToolDefinition {
		return {
			name: 'replace_regex',
			description:
				'Replace content matching a regular expression pattern. Supports capture groups ($1, $2, etc.) in replacement string.',
			inputSchema: {
				type: 'object',
				properties: {
					filePath: {
						type: 'string',
						description: 'Relative path to file',
					},
					pattern: {
						type: 'string',
						description: 'Regular expression pattern to match',
					},
					replacement: {
						type: 'string',
						description:
							'Replacement string (can use $1, $2, etc. for capture groups)',
					},
					flags: {
						type: 'string',
						description:
							'Regex flags (default: "g" for global). Examples: "gi" for global+case-insensitive, "gm" for global+multiline',
						default: 'g',
					},
				},
				required: ['filePath', 'pattern', 'replacement'],
			},
		};
	}

	validateParameters(parameters: Record<string, any>): boolean {
		return (
			typeof parameters.filePath === 'string' &&
			typeof parameters.pattern === 'string' &&
			parameters.replacement !== undefined
		);
	}

	async execute(parameters: Record<string, any>): Promise<ToolExecutionResult> {
		const {filePath, pattern, replacement, flags = 'g'} =
			parameters as ReplaceRegexOptions;

		if (!filePath || !pattern || replacement === undefined) {
			return this.createErrorResult(
				'Missing required parameters: filePath, pattern, and replacement are required',
			);
		}

		try {
			// Read the file
			const absolutePath = path.isAbsolute(filePath)
				? filePath
				: path.join(this.projectRoot, filePath);

			if (!fs.existsSync(absolutePath)) {
				return this.createErrorResult(`File not found: ${filePath}`);
			}

			const fileContent = fs.readFileSync(absolutePath, 'utf8');

			// Create regex
			let regex: RegExp;
			try {
				regex = new RegExp(pattern, flags);
			} catch (error: any) {
				return this.createErrorResult(`Invalid regex pattern: ${error.message}`);
			}

			// Find matches first
			const matches = Array.from(fileContent.matchAll(regex));
			if (matches.length === 0) {
				return this.createSuccessResult(`No matches found for pattern: ${pattern}`, {
					file: filePath,
					matchesFound: 0,
				});
			}

			// Perform replacement
			const newContent = fileContent.replace(regex, replacement);

			// Write back
			fs.writeFileSync(absolutePath, newContent, 'utf8');

			// Show preview of changes
			const output = [
				`✨ Replaced ${matches.length} match(es)`,
				`📄 File: ${filePath}`,
				`🔍 Pattern: ${pattern}`,
				`✏️  Replacement: ${replacement}`,
				`\n📝 Sample changes:`,
				...matches.slice(0, 3).map((match, i) => {
					const preview = match[0].substring(0, 50);
					const replacedPreview = match[0]
						.replace(regex, replacement)
						.substring(0, 50);
					return `   ${i + 1}. "${preview}" → "${replacedPreview}"`;
				}),
				matches.length > 3 ? `   ... and ${matches.length - 3} more` : '',
			]
				.filter(Boolean)
				.join('\n');

			return this.createSuccessResult(output, {
				file: filePath,
				matchesReplaced: matches.length,
				pattern,
				replacement,
			});
		} catch (error: any) {
			return this.createErrorResult(`Failed to replace: ${error.message}`);
		}
	}
}
