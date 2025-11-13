/**
 * Find Implementations Tool
 * Finds all implementations of an interface or abstract class
 */

import {Tool} from './base/Tool.js';
import {
	ToolDefinition,
	ToolExecutionResult,
} from '../domain/interfaces/IToolExecutor.js';
import {ISymbolAnalyzer} from '../domain/interfaces/ISymbolAnalyzer.js';

interface FindImplementationsArgs {
	filePath: string;
	interfaceName: string;
}

export class FindImplementationsTool extends Tool {
	constructor(
		private projectRoot: string,
		private analyzer: ISymbolAnalyzer,
	) {
		super(
			'find_implementations',
			'Find all classes that implement a specific interface or extend an abstract class',
		);
	}

	getDefinition(): ToolDefinition {
		return {
			name: 'find_implementations',
			description:
				'Find all classes that implement a specific interface or extend an abstract class. Useful for understanding polymorphism and finding concrete implementations.',
			inputSchema: {
				type: 'object',
				properties: {
					filePath: {
						type: 'string',
						description: 'Path to file containing the interface/abstract class',
					},
					interfaceName: {
						type: 'string',
						description: 'Name of the interface or abstract class',
					},
				},
				required: ['filePath', 'interfaceName'],
			},
		};
	}

	validateParameters(parameters: Record<string, any>): boolean {
		return true; // Basic validation
	}

	async execute(args: FindImplementationsArgs): Promise<ToolExecutionResult> {
		try {
			const {filePath, interfaceName} = args;

			// Find references to the interface (classes that implement it will reference it)
			const references = this.analyzer.findReferences(interfaceName, filePath);

			// Filter for implementations (class declarations that reference the interface)
			const implementations = references.filter(ref => {
				const symbolName = ref.symbol.name;
				const context = ref.contentAroundReference.toLowerCase();
				return (
					context.includes('class') &&
					(context.includes('implements') || context.includes('extends'))
				);
			});

			return {
				success: true,
				output: `Found ${implementations.length} implementation(s) of "${interfaceName}"`,
				metadata: {
					interfaceName,
					count: implementations.length,
					implementations: implementations.map(impl => ({
						className: impl.symbol.name,
						file: impl.symbol.location.relativePath,
						line: impl.line,
						snippet: impl.contentAroundReference,
					})),
				},
			};
		} catch (error) {
			return {
				success: false,
				output: `Error finding implementations: ${error instanceof Error ? error.message : String(error)}`,
			};
		}
	}
}
