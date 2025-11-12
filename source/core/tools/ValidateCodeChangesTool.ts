/**
 * Validate Code Changes Tool
 * Validates TypeScript code for errors after changes
 */

import {Tool} from './base/Tool.js';
import {
	ToolDefinition,
	ToolExecutionResult,
} from '../domain/interfaces/IToolExecutor.js';
import {TypeScriptSymbolAnalyzer} from '../../infrastructure/typescript/TypeScriptSymbolAnalyzer.js';
import * as ts from 'typescript';

interface ValidateCodeChangesArgs {
	files?: string[]; // Optional: specific files to validate
}

export class ValidateCodeChangesTool extends Tool {
	constructor(
		private projectRoot: string,
		private analyzer: TypeScriptSymbolAnalyzer,
	) {
		super(
			'validate_code_changes',
			'Validate TypeScript code for errors and warnings',
		);
	}

	getDefinition(): ToolDefinition {
		return {
			name: 'validate_code_changes',
			description:
				'Validate TypeScript code for errors and warnings. Checks syntax errors, type errors, and other issues. Should be run after making code changes to ensure nothing is broken.',
			inputSchema: {
				type: 'object',
				properties: {
					files: {
						type: 'array',
						items: {type: 'string'},
						description:
							'Optional: specific files to validate. If not provided, validates entire project.',
					},
				},
			},
		};
	}

	validateParameters(parameters: Record<string, any>): boolean {
		return true; // Basic validation
	}

	async execute(args: ValidateCodeChangesArgs): Promise<ToolExecutionResult> {
		try {
			// Invalidate cache to force re-analysis
			this.analyzer.invalidateAll();

			// Get all diagnostics from TypeScript program
			const program = (this.analyzer as any).program as ts.Program;
			const allDiagnostics = ts.getPreEmitDiagnostics(program);

			// Filter by files if specified
			let diagnostics = allDiagnostics;
			if (args.files && args.files.length > 0) {
				diagnostics = allDiagnostics.filter(diag => {
					if (!diag.file) return false;
					return args.files!.some(file => diag.file!.fileName.includes(file));
				});
			}

			// Categorize diagnostics
			const errors = diagnostics.filter(
				d => d.category === ts.DiagnosticCategory.Error,
			);
			const warnings = diagnostics.filter(
				d => d.category === ts.DiagnosticCategory.Warning,
			);

			// Format diagnostics
			const formattedErrors = errors.map(d => this.formatDiagnostic(d));
			const formattedWarnings = warnings.map(d => this.formatDiagnostic(d));

			const isValid = errors.length === 0;

			return {
				success: true,
				output: isValid
					? `✅ Code validation passed! ${warnings.length} warning(s), 0 errors.`
					: `❌ Code validation failed! ${errors.length} error(s), ${warnings.length} warning(s).`,
				metadata: {
					valid: isValid,
					errorCount: errors.length,
					warningCount: warnings.length,
					errors: formattedErrors,
					warnings: formattedWarnings,
				},
			};
		} catch (error) {
			return {
				success: false,
				output: `Error validating code: ${error instanceof Error ? error.message : String(error)}`,
			};
		}
	}

	private formatDiagnostic(diagnostic: ts.Diagnostic): any {
		if (!diagnostic.file) {
			return {
				message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
			};
		}

		const {line, character} = diagnostic.file.getLineAndCharacterOfPosition(
			diagnostic.start!,
		);
		return {
			file: diagnostic.file.fileName,
			line: line + 1,
			column: character + 1,
			message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
			code: diagnostic.code,
		};
	}
}
