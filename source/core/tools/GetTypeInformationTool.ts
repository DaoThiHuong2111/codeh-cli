/**
 * Get Type Information Tool
 * Retrieves type information for symbols (variables, functions, etc.)
 */

import {Tool} from './base/Tool.js';
import {
	ToolDefinition,
	ToolExecutionResult,
} from '../domain/interfaces/IToolExecutor.js';
import {ISymbolAnalyzer} from '../domain/interfaces/ISymbolAnalyzer.js';
import {
	GetTypeInfoArgsSchema,
	type GetTypeInfoArgs,
	validateAndParse,
} from './schemas/ToolSchemas.js';

export class GetTypeInformationTool extends Tool {
	constructor(
		private projectRoot: string,
		private analyzer: ISymbolAnalyzer,
	) {
		super(
			'get_type_information',
			'Get type information for a symbol (variable, function, parameter, etc',
		);
	}

	getDefinition(): ToolDefinition {
		return {
			name: 'get_type_information',
			description:
				'Get type information for a symbol (variable, function, parameter, etc.). Returns the TypeScript type, documentation, and related metadata.',
			inputSchema: {
				type: 'object',
				properties: {
					filePath: {
						type: 'string',
						description: 'Path to the file containing the symbol',
					},
					symbolName: {
						type: 'string',
						description: 'Name of the symbol to get type information for',
					},
					line: {
						type: 'number',
						description:
							'Optional: specific line number where symbol is located',
					},
				},
				required: ['filePath', 'symbolName'],
			},
		};
	}

	validateParameters(parameters: unknown): parameters is GetTypeInfoArgs {
		const result = validateAndParse(GetTypeInfoArgsSchema, parameters);
		if (!result.success) {
			console.error('Validation failed:', result.error);
			return false;
		}

		return true;
	}

	async execute(args: GetTypeInfoArgs): Promise<ToolExecutionResult> {
		try {
			const {filePath, symbolName, line} = args;

			// Get type information using TypeScript Compiler API
			const typeInfo = this.analyzer.getTypeInformation(
				filePath,
				symbolName,
				line,
			);

			if (!typeInfo) {
				return {
					success: false,
					output: `Type information not found for symbol "${symbolName}" in ${filePath}`,
				};
			}

			return {
				success: true,
				output: `Found type information for "${symbolName}"`,
				metadata: {
					typeString: typeInfo.typeString,
					kind: typeInfo.kind,
					isOptional: typeInfo.isOptional,
					isAsync: typeInfo.isAsync,
					documentation: typeInfo.documentation,
					signature: typeInfo.signature,
				},
			};
		} catch (error) {
			return {
				success: false,
				output: `Error getting type information: ${error instanceof Error ? error.message : String(error)}`,
			};
		}
	}
}
