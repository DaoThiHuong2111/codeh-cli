/**
 * Shell Tool
 * Executes shell commands with optional Docker sandbox isolation
 */

import {Tool} from './base/Tool';
import {
	ToolDefinition,
	ToolExecutionResult,
} from '../domain/interfaces/IToolExecutor';
import {ISandboxModeManager} from '../domain/interfaces/ISandboxModeManager';

export class ShellTool extends Tool {
	constructor(
		private hostExecutor: any,
		private dockerExecutor: any,
		private sandboxModeManager?: ISandboxModeManager,
	) {
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

		const executor =
			this.sandboxModeManager?.isEnabled() ?? false
				? this.dockerExecutor
				: this.hostExecutor;

		try {
			const result = await executor.execute(command, {cwd});

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
