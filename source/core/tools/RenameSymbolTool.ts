/**
 * Rename Symbol Tool
 * Renames symbols (classes, functions, methods, variables) across the entire codebase
 * Uses TypeScript Language Service for safe refactoring
 */

import {Tool} from './base/Tool';
import {
	ToolDefinition,
	ToolExecutionResult,
} from '../domain/interfaces/IToolExecutor';
import {TypeScriptSymbolAnalyzer} from '../../infrastructure/typescript/TypeScriptSymbolAnalyzer';

export interface RenameSymbolOptions {
	namePath: string; // Symbol to rename (e.g., "ClassName/methodName")
	filePath: string; // File containing the symbol
	newName: string; // New name for the symbol
}

export class RenameSymbolTool extends Tool {
	private analyzer?: TypeScriptSymbolAnalyzer;

	constructor(private projectRoot: string) {
		super('rename_symbol', 'Rename symbols across the codebase using language server refactoring');
	}

	getDefinition(): ToolDefinition {
		return {
			name: 'rename_symbol',
			description: 'Rename a symbol (class, function, method, variable) throughout the entire codebase safely. Uses TypeScript Language Service for accurate refactoring.',
			inputSchema: {
				type: 'object',
				properties: {
					namePath: {
						type: 'string',
						description: 'Symbol name path to rename (e.g., "UserService" or "UserService/createUser" for methods)',
					},
					filePath: {
						type: 'string',
						description: 'Relative path to file containing the symbol',
					},
					newName: {
						type: 'string',
						description: 'New name for the symbol',
					},
				},
				required: ['namePath', 'filePath', 'newName'],
			},
		};
	}

	validateParameters(parameters: Record<string, any>): boolean {
		return (
			typeof parameters.namePath === 'string' &&
			typeof parameters.filePath === 'string' &&
			typeof parameters.newName === 'string'
		);
	}

	private getAnalyzer(): TypeScriptSymbolAnalyzer {
		if (!this.analyzer) {
			this.analyzer = new TypeScriptSymbolAnalyzer(this.projectRoot);
		}
		return this.analyzer;
	}

	async execute(parameters: Record<string, any>): Promise<ToolExecutionResult> {
		const {namePath, filePath, newName} = parameters as RenameSymbolOptions;

		if (!namePath || !filePath || !newName) {
			return this.createErrorResult(
				'Missing required parameters: namePath, filePath, and newName are required',
			);
		}

		// Validate new name
		if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(newName)) {
			return this.createErrorResult(
				`Invalid new name: "${newName}". Must be a valid identifier.`,
			);
		}

		try {
			const analyzer = this.getAnalyzer();

			// Find the symbol to rename
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

			// Get rename locations
			const renameLocations = analyzer.renameSymbol(
				namePath,
				filePath,
				newName,
			);

			if (!renameLocations || renameLocations.length === 0) {
				return this.createErrorResult(
					`Could not find rename locations for symbol: "${namePath}"`,
				);
			}

			// Format output
			const output = this.formatRenameResult(
				symbol.name,
				newName,
				renameLocations,
			);

			return this.createSuccessResult(output, {
				symbol: symbol.name,
				newName,
				filesAffected: renameLocations.length,
				changes: renameLocations,
			});
		} catch (error: any) {
			return this.createErrorResult(`Failed to rename symbol: ${error.message}`);
		}
	}

	private formatRenameResult(
		oldName: string,
		newName: string,
		changes: any[],
	): string {
		const lines: string[] = [];

		lines.push(`✨ Renamed "${oldName}" → "${newName}"`);
		lines.push(`\n📝 ${changes.length} location(s) updated:\n`);

		// Group by file
		const fileGroups = new Map<string, any[]>();
		for (const change of changes) {
			const file = change.fileName;
			if (!fileGroups.has(file)) {
				fileGroups.set(file, []);
			}
			fileGroups.get(file)!.push(change);
		}

		for (const [file, locations] of fileGroups) {
			lines.push(`📄 ${file}: ${locations.length} change(s)`);
			for (const loc of locations) {
				const lineNum = loc.textSpan.line + 1;
				lines.push(`   Line ${lineNum}: ${loc.contextSnippet || ''}`);
			}
			lines.push('');
		}

		return lines.join('\n');
	}
}
