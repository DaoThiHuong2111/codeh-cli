/**
 * Shell Tool
 * Executes shell commands
 */

import {Tool} from './base/Tool';
import {
	ToolDefinition,
	ToolExecutionResult,
} from '../domain/interfaces/IToolExecutor';

export class ShellTool extends Tool {
	constructor(private executor: any) {
		// Executor will be injected (ShellExecutor from infrastructure)
		super('shell', 'Execute shell commands');
	}

	getDefinition(): ToolDefinition {
		return {
			name: 'shell',
			description: 'Execute shell commands in the current directory',
			parameters: [
				{
					name: 'command',
					type: 'string',
					description: 'The shell command to execute',
					required: true,
				},
				{
					name: 'cwd',
					type: 'string',
					description: 'Working directory (optional)',
					required: false,
				},
			],
		};
	}

	validateParameters(parameters: Record<string, any>): boolean {
		return (
			typeof parameters.command === 'string' && parameters.command.length > 0
		);
	}

	async execute(parameters: Record<string, any>): Promise<ToolExecutionResult> {
		const {command, cwd} = parameters;

		try {
			const result = await this.executor.execute(command, {cwd});

			if (result.success) {
				return this.createSuccessResult(result.stdout, {
					exitCode: result.exitCode,
					duration: result.duration,
				});
			} else {
				return this.createErrorResult(result.stderr, result.stdout, {
					exitCode: result.exitCode,
					duration: result.duration,
				});
			}
		} catch (error: any) {
			return this.createErrorResult(error.message);
		}
	}
}
