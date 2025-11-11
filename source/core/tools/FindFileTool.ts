/**
 * Find File Tool
 * Find files by name pattern in project
 */

import * as fs from 'fs';
import * as path from 'path';
import {Tool} from './base/Tool';
import {
	ToolDefinition,
	ToolExecutionResult,
} from '../domain/interfaces/IToolExecutor';

export interface FindFileOptions {
	pattern: string; // File name pattern (supports wildcards)
	directory?: string; // Optional: search in specific directory
	maxResults?: number; // Limit number of results
}

export class FindFileTool extends Tool {
	constructor(private projectRoot: string) {
		super('find_file', 'Find files by name pattern');
	}

	getDefinition(): ToolDefinition {
		return {
			name: 'find_file',
			description:
				'Find files matching a name pattern. Supports wildcards (* and ?). Example: "*.ts" finds all TypeScript files.',
			inputSchema: {
				type: 'object',
				properties: {
					pattern: {
						type: 'string',
						description:
							'File name pattern (supports * and ?). Examples: "*.ts", "User*.ts", "test?.js"',
					},
					directory: {
						type: 'string',
						description:
							'Optional: relative path to directory to search in. Defaults to project root.',
					},
					maxResults: {
						type: 'number',
						description: 'Maximum number of results to return (default: 100)',
						default: 100,
					},
				},
				required: ['pattern'],
			},
		};
	}

	async execute(parameters: Record<string, any>): Promise<ToolExecutionResult> {
		const {pattern, directory = '.', maxResults = 100} =
			parameters as FindFileOptions;

		if (!pattern) {
			return this.createErrorResult('Missing required parameter: pattern');
		}

		try {
			const searchDir = path.join(this.projectRoot, directory);

			if (!fs.existsSync(searchDir)) {
				return this.createErrorResult(`Directory not found: ${directory}`);
			}

			// Convert glob pattern to regex
			const regexPattern = this.globToRegex(pattern);

			// Search files
			const matches = this.searchFiles(searchDir, regexPattern, maxResults);

			if (matches.length === 0) {
				return this.createSuccessResult(
					`No files found matching pattern: ${pattern}`,
					{
						pattern,
						directory,
						found: 0,
					},
				);
			}

			// Format output
			const relativePaths = matches.map(file =>
				path.relative(this.projectRoot, file),
			);

			const output = [
				`📁 Found ${matches.length} file(s) matching "${pattern}":`,
				'',
				...relativePaths.map((file, i) => `${i + 1}. ${file}`),
				'',
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
				files: relativePaths,
			});
		} catch (error: any) {
			return this.createErrorResult(`Failed to find files: ${error.message}`);
		}
	}

	private globToRegex(pattern: string): RegExp {
		// Escape special regex characters except * and ?
		let regexStr = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');

		// Convert glob wildcards to regex
		regexStr = regexStr.replace(/\*/g, '.*').replace(/\?/g, '.');

		// Match full filename
		return new RegExp(`^${regexStr}$`);
	}

	private searchFiles(
		dir: string,
		pattern: RegExp,
		maxResults: number,
		results: string[] = [],
	): string[] {
		if (results.length >= maxResults) {
			return results;
		}

		try {
			const entries = fs.readdirSync(dir, {withFileTypes: true});

			for (const entry of entries) {
				if (results.length >= maxResults) break;

				const fullPath = path.join(dir, entry.name);

				// Skip node_modules, .git, dist, etc.
				if (this.shouldSkip(entry.name)) {
					continue;
				}

				if (entry.isDirectory()) {
					this.searchFiles(fullPath, pattern, maxResults, results);
				} else if (pattern.test(entry.name)) {
					results.push(fullPath);
				}
			}

			return results;
		} catch (error) {
			// Ignore permission errors, etc.
			return results;
		}
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
