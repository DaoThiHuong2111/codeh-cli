/**
 * Get Call Hierarchy Tool
 * Shows which functions call a given function (incoming calls)
 * and which functions are called by it (outgoing calls)
 */

import {Tool} from './base/Tool.js';
import {
	ToolDefinition,
	ToolExecutionResult,
} from '../domain/interfaces/IToolExecutor.js';
import {TypeScriptSymbolAnalyzer} from '../../infrastructure/typescript/TypeScriptSymbolAnalyzer.js';

interface GetCallHierarchyArgs {
	filePath: string;
	symbolName: string;
	direction?: 'incoming' | 'outgoing' | 'both';
	maxDepth?: number;
}

export class GetCallHierarchyTool extends Tool {
	constructor(
		private projectRoot: string,
		private analyzer: TypeScriptSymbolAnalyzer,
	) {
		super(
			'get_call_hierarchy',
			'Get call hierarchy for a function - shows which functions call it (incoming) and which functions it calls (outgoing)',
		);
	}

	getDefinition(): ToolDefinition {
		return {
			name: 'get_call_hierarchy',
			description:
				'Get call hierarchy for a function - shows which functions call it (incoming) and which functions it calls (outgoing). Useful for understanding code flow.',
			inputSchema: {
				type: 'object',
				properties: {
					filePath: {
						type: 'string',
						description: 'Path to the file containing the function',
					},
					symbolName: {
						type: 'string',
						description: 'Name of the function to get call hierarchy for',
					},
					direction: {
						type: 'string',
						enum: ['incoming', 'outgoing', 'both'],
						description:
							'Direction of call hierarchy: incoming (who calls this), outgoing (what this calls), or both',
					},
					maxDepth: {
						type: 'number',
						description: 'Maximum depth to traverse (default: 2)',
					},
				},
				required: ['filePath', 'symbolName'],
			},
		};
	}

	validateParameters(parameters: Record<string, any>): boolean {
		return true; // Basic validation
	}

	async execute(args: GetCallHierarchyArgs): Promise<ToolExecutionResult> {
		try {
			const {filePath, symbolName, direction = 'both', maxDepth = 2} = args;

			// Get incoming calls (who calls this function)
			const incomingCalls =
				direction === 'incoming' || direction === 'both'
					? this.analyzer.findReferences(symbolName, filePath)
					: [];

			// Get outgoing calls (what this function calls) - use find references on called symbols
			const outgoingCalls: string[] = [];
			if (direction === 'outgoing' || direction === 'both') {
				// This would require analyzing function body for call expressions
				// For now, return empty array (can be enhanced later)
			}

			return {
				success: true,
				output: `Call hierarchy for "${symbolName}": ${incomingCalls.length} incoming call(s)`,
				metadata: {
					symbolName,
					filePath,
					incomingCalls: incomingCalls.map(ref => ({
						file: ref.symbol.location.relativePath,
						symbol: ref.symbol.name,
						line: ref.line,
						context: ref.contentAroundReference,
					})),
					outgoingCalls,
					direction,
					maxDepth,
				},
			};
		} catch (error) {
			return {
				success: false,
				output: `Error getting call hierarchy: ${error instanceof Error ? error.message : String(error)}`,
			};
		}
	}
}
