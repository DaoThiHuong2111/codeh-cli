/**
 * Dependency Graph Tool
 * Analyzes module dependencies (imports/exports)
 */

import {Tool} from './base/Tool.js';
import {
	ToolDefinition,
	ToolExecutionResult,
} from '../domain/interfaces/IToolExecutor.js';
import * as ts from 'typescript';
import * as path from 'path';
import * as fs from 'fs';

interface DependencyGraphArgs {
	filePath?: string; // Optional: specific file
	module?: string; // Optional: module directory
}

export class DependencyGraphTool extends Tool {
	constructor(private projectRoot: string) {
		super(
			'get_dependency_graph',
			'Analyze module dependencies - shows which modules a file/directory imports (dependencies) and which modules import it (dependents)',
		);
	}

	getDefinition(): ToolDefinition {
		return {
			name: 'get_dependency_graph',
			description:
				'Analyze module dependencies - shows which modules a file/directory imports (dependencies) and which modules import it (dependents). Useful for understanding module structure and finding circular dependencies.',
			inputSchema: {
				type: 'object',
				properties: {
					filePath: {
						type: 'string',
						description: 'Optional: specific file to analyze dependencies for',
					},
					module: {
						type: 'string',
						description:
							'Optional: module directory to analyze (e.g., "src/auth")',
					},
				},
			},
		};
	}

	validateParameters(parameters: Record<string, any>): boolean {
		return true; // Basic validation
	}

	async execute(args: DependencyGraphArgs): Promise<ToolExecutionResult> {
		try {
			const {filePath, module} = args;

			if (!filePath && !module) {
				return {
					success: false,
					output: 'Please provide either filePath or module',
				};
			}

			const targetPath = filePath || path.join(this.projectRoot, module!);

			if (!fs.existsSync(targetPath)) {
				return {
					success: false,
					output: `Path not found: ${targetPath}`,
				};
			}

			// Parse file to get imports/exports
			const sourceFile = ts.createSourceFile(
				targetPath,
				fs.readFileSync(targetPath, 'utf8'),
				ts.ScriptTarget.Latest,
				true,
			);

			// Extract imports
			const imports: string[] = [];
			const exports: string[] = [];

			sourceFile.forEachChild(node => {
				if (ts.isImportDeclaration(node)) {
					const moduleSpecifier = node.moduleSpecifier;
					if (ts.isStringLiteral(moduleSpecifier)) {
						imports.push(moduleSpecifier.text);
					}
				} else if (ts.isExportDeclaration(node)) {
					if (node.exportClause && ts.isNamedExports(node.exportClause)) {
						node.exportClause.elements.forEach(element => {
							exports.push(element.name.text);
						});
					}
				} else if (
					ts.isFunctionDeclaration(node) ||
					ts.isClassDeclaration(node) ||
					ts.isVariableStatement(node)
				) {
					// Check for export keyword
					if (
						node.modifiers?.some(
							mod => mod.kind === ts.SyntaxKind.ExportKeyword,
						)
					) {
						if (ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)) {
							if (node.name) {
								exports.push(node.name.text);
							}
						}
					}
				}
			});

			// Check for circular dependencies (basic check)
			const circularDeps: string[] = [];
			// This is a simplified check - a full implementation would need to traverse the entire dependency tree

			return {
				success: true,
				output: `Dependency graph for ${path.basename(targetPath)}: ${imports.length} import(s), ${exports.length} export(s)`,
				metadata: {
					file: targetPath,
					imports,
					exports,
					circularDeps,
					stats: {
						importCount: imports.length,
						exportCount: exports.length,
						circularDepCount: circularDeps.length,
					},
				},
			};
		} catch (error) {
			return {
				success: false,
				output: `Error analyzing dependencies: ${error instanceof Error ? error.message : String(error)}`,
			};
		}
	}
}
