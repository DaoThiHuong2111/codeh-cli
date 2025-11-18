/**
 * Docker Shell Executor
 * Executes shell commands inside running Docker container
 *
 * This executor assumes container is already running (managed by SandboxModeManager).
 * It simply executes commands using 'docker exec' into the running container.
 *
 * @module infrastructure/process
 * @extends {ShellExecutor}
 */

import {
	ShellExecutor,
	CommandResult,
	CommandOptions,
} from './ShellExecutor.js';
import {DockerfileManager} from './DockerfileManager.js';

/**
 * Docker Shell Executor
 * Executes commands in running Docker container via 'docker exec'
 */
export class DockerShellExecutor extends ShellExecutor {
	constructor(
		private dockerfileManager: DockerfileManager,
		private getContainerId: () => string | null,
	) {
		super();
	}

	/**
	 * Execute command inside Docker container
	 */
	async execute(
		command: string,
		options: CommandOptions = {},
	): Promise<CommandResult> {
		const containerId = this.getContainerId();

		if (!containerId) {
			return {
				stdout: '',
				stderr:
					'Docker container not running. Please enable sandbox mode first.',
				exitCode: 1,
				success: false,
				duration: 0,
			};
		}

		// Execute command in container using DockerfileManager
		const result = await this.dockerfileManager.executeInContainer(
			containerId,
			command,
			{cwd: options.cwd},
		);

		return result;
	}

	/**
	 * Execute command synchronously (not supported in Docker mode)
	 */
	executeSync(command: string, options: CommandOptions = {}): CommandResult {
		throw new Error(
			'Synchronous execution is not supported in Docker sandbox mode. Use async execute() instead.',
		);
	}
}
