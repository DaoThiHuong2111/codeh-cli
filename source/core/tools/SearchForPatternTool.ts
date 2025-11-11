/**
 * Search For Pattern Tool
 * Search for regex patterns in code files (like grep)
 */

import * as fs from 'fs';
import * as path from 'path';
import {Tool} from './base/Tool';
import {
	ToolDefinition,
	ToolExecutionResult,
} from '../domain/interfaces/IToolExecutor';

export interface SearchForPatternOptions {
	pattern: string; // Regex pattern to search
	directory?: string; // Optional: search in specific directory
	filePattern?: string; // Optional: filter files (e.g., "*.ts")
	maxResults?: number; // Limit number of results
	contextLines?: number; // Lines of context around match
}

export class SearchForPatternTool extends Tool {
	constructor(private projectRoot: string) {
		super('search_for_pattern', 'Search for patterns in code files');
	}

	getDefinition(): ToolDefinition {
		return {
			name: 'search_for_pattern',
			description:
				'Search for regex patterns in code files (like grep). Returns matching lines with context and file locations.',
			inputSchema: {
				type: 'object',
				properties: {
					pattern: {
						type: 'string',
						description: 'Regular expression pattern to search for',
					},
					directory: {
						type: 'string',
						description:
							'Optional: relative path to directory to search in. Defaults to project root.',
					},
					filePattern: {
						type: 'string',
						description:
							'Optional: filter files by pattern (e.g., "*.ts", "*.js"). Defaults to all files.',
					},
					maxResults: {
						type: 'number',
						description: 'Maximum number of matches to return (default: 50)',
						default: 50,
					},
					contextLines: {
						type: 'number',
						description: 'Number of context lines to show around each match (default: 2)',
						default: 2,
					},
				},
				required: ['pattern'],
			},
		};
	}

	async execute(parameters: Record<string, any>): Promise<ToolExecutionResult> {
		const {
			pattern,
			directory = '.',
			filePattern,
			maxResults = 50,
			contextLines = 2,
		} = parameters as SearchForPatternOptions;

		if (!pattern) {
			return this.createErrorResult('Missing required parameter: pattern');
		}

		try {
			const searchDir = path.join(this.projectRoot, directory);

			if (!fs.existsSync(searchDir)) {
				return this.createErrorResult(`Directory not found: ${directory}`);
			}

			// Create search regex
			let searchRegex: RegExp;
			try {
				searchRegex = new RegExp(pattern, 'g');
			} catch (error: any) {
				return this.createErrorResult(`Invalid regex pattern: ${error.message}`);
			}

			// Optional file pattern filter
			const fileRegex = filePattern ? this.globToRegex(filePattern) : null;

			// Search for matches
			const matches = this.searchInFiles(
				searchDir,
				searchRegex,
				fileRegex,
				maxResults,
				contextLines,
			);

			if (matches.length === 0) {
				return this.createSuccessResult(
					`No matches found for pattern: ${pattern}`,
					{
						pattern,
						directory,
						found: 0,
					},
				);
			}

			// Format output
			const output = [
				`🔍 Found ${matches.length} match(es) for pattern: "${pattern}"`,
				'',
				...matches.map(match => {
					return [
						`📄 ${match.file}:${match.line}`,
						`   ${match.context}`,
						'',
					].join('\n');
				}),
				matches.length >= maxResults
					? `⚠️  Limit reached (${maxResults}). Use maxResults parameter to see more.`
					: '',
			]
				.filter(Boolean)
				.join('\n');

			return this.createSuccessResult(output, {
				pattern,
				directory,
				found: matches.length,
				matches: matches.map(m => ({
					file: m.file,
					line: m.line,
					matchText: m.matchText,
				})),
			});
		} catch (error: any) {
			return this.createErrorResult(`Failed to search: ${error.message}`);
		}
	}

	private searchInFiles(
		dir: string,
		pattern: RegExp,
		fileFilter: RegExp | null,
		maxResults: number,
		contextLines: number,
		results: Array<{
			file: string;
			line: number;
			matchText: string;
			context: string;
		}> = [],
	): Array<{file: string; line: number; matchText: string; context: string}> {
		if (results.length >= maxResults) {
			return results;
		}

		try {
			const entries = fs.readdirSync(dir, {withFileTypes: true});

			for (const entry of entries) {
				if (results.length >= maxResults) break;

				const fullPath = path.join(dir, entry.name);

				if (this.shouldSkip(entry.name)) {
					continue;
				}

				if (entry.isDirectory()) {
					this.searchInFiles(
						fullPath,
						pattern,
						fileFilter,
						maxResults,
						contextLines,
						results,
					);
				} else {
					// Check file filter
					if (fileFilter && !fileFilter.test(entry.name)) {
						continue;
					}

					// Search in file
					this.searchInFile(fullPath, pattern, contextLines, results, maxResults);
				}
			}

			return results;
		} catch (error) {
			return results;
		}
	}

	private searchInFile(
		filePath: string,
		pattern: RegExp,
		contextLines: number,
		results: Array<any>,
		maxResults: number,
	): void {
		try {
			const content = fs.readFileSync(filePath, 'utf8');
			const lines = content.split('\n');
			const relativePath = path.relative(this.projectRoot, filePath);

			lines.forEach((line, index) => {
				if (results.length >= maxResults) return;

				// Reset regex lastIndex for global regex
				pattern.lastIndex = 0;

				if (pattern.test(line)) {
					// Get context
					const startLine = Math.max(0, index - contextLines);
					const endLine = Math.min(lines.length - 1, index + contextLines);
					const contextSnippet = lines
						.slice(startLine, endLine + 1)
						.map((l, i) => {
							const lineNum = startLine + i + 1;
							const prefix = lineNum === index + 1 ? '→' : ' ';
							return `${prefix} ${lineNum}: ${l}`;
						})
						.join('\n   ');

					results.push({
						file: relativePath,
						line: index + 1,
						matchText: line.trim(),
						context: contextSnippet,
					});
				}
			});
		} catch (error) {
			// Skip files that can't be read
		}
	}

	private globToRegex(pattern: string): RegExp {
		let regexStr = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');
		regexStr = regexStr.replace(/\*/g, '.*').replace(/\?/g, '.');
		return new RegExp(`^${regexStr}$`);
	}

	private shouldSkip(name: string): boolean {
		const skipDirs = [
			'node_modules',
			'.git',
			'dist',
			'build',
			'.next',
			'coverage',
			'.cache',
		];
		return skipDirs.includes(name) || name.startsWith('.');
	}
}
