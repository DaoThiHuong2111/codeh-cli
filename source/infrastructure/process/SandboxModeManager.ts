/**
 * Sandbox Mode Manager
 * Manages Docker-based sandbox mode state across the application
 *
 * New approach:
 * - Sandbox = Docker container isolation (not whitelist validation)
 * - Requires Dockerfile in project directory
 * - Manages container lifecycle (build, start, stop, cleanup)
 */

import {
	ISandboxModeManager,
	SandboxMode,
	SandboxModeChangeListener,
} from '../../core/domain/interfaces/ISandboxModeManager.js';
import {DockerfileManager} from './DockerfileManager.js';

/**
 * Sandbox Mode Manager with Docker container support
 *
 * @implements {ISandboxModeManager}
 */
export class SandboxModeManager implements ISandboxModeManager {
	private mode: SandboxMode = SandboxMode.DISABLED;
	private listeners: SandboxModeChangeListener[] = [];
	private dockerfileManager: DockerfileManager;

	private sandboxAvailable: boolean = false;
	private currentWorkingDir: string = process.cwd();
	private containerId: string | null = null;
	private imageTag: string | null = null;

	constructor(dockerfileManager?: DockerfileManager) {
		this.dockerfileManager = dockerfileManager || new DockerfileManager();
	}

	/**
	 * Check if sandbox is available (Dockerfile exists)
	 */
	async checkAvailability(cwd?: string): Promise<boolean> {
		const workDir = cwd || this.currentWorkingDir;
		this.currentWorkingDir = workDir;

		const hasDockerfile = this.dockerfileManager.hasDockerfile(workDir);

		const dockerAvailable = await this.dockerfileManager.isDockerAvailable();

		this.sandboxAvailable = hasDockerfile && dockerAvailable;

		if (!dockerAvailable && hasDockerfile) {
			console.warn(
				'Dockerfile found but Docker is not installed or not running',
			);
		}

		return this.sandboxAvailable;
	}

	/**
	 * Check if sandbox is available (synchronous, uses cached value)
	 */
	isSandboxAvailable(): boolean {
		return this.sandboxAvailable;
	}

	/**
	 * Get current sandbox mode
	 */
	getMode(): SandboxMode {
		return this.mode;
	}

	/**
	 * Check if sandbox is enabled
	 */
	isEnabled(): boolean {
		return this.mode === SandboxMode.ENABLED;
	}

	/**
	 * Enable sandbox mode with Docker container
	 * Builds image and starts container
	 */
	async enable(): Promise<{success: boolean; error?: string}> {
		if (!this.sandboxAvailable) {
			return {
				success: false,
				error: 'Dockerfile not found in current directory',
			};
		}

		if (this.mode === SandboxMode.ENABLED) {
			return {success: true};
		}

		console.log('Enabling Docker sandbox mode...');

		const buildResult = await this.dockerfileManager.buildImage(
			this.currentWorkingDir,
		);
		if (!buildResult.success) {
			return {
				success: false,
				error: `Failed to build Docker image: ${buildResult.error}`,
			};
		}

		this.imageTag = buildResult.imageTag;

		const startResult = await this.dockerfileManager.startContainer(
			this.imageTag,
			this.currentWorkingDir,
		);
		if (!startResult.success) {
			return {
				success: false,
				error: `Failed to start container: ${startResult.error}`,
			};
		}

		this.containerId = startResult.containerId!;

		const oldMode = this.mode;
		this.mode = SandboxMode.ENABLED;

		console.log('Docker sandbox mode ENABLED - Commands run in isolated container');

		this.notifyListeners(this.mode, oldMode);

		return {success: true};
	}

	/**
	 * Disable sandbox mode
	 * Stops and removes container
	 */
	async disable(): Promise<{success: boolean; error?: string}> {
		if (this.mode === SandboxMode.DISABLED) {
			return {success: true};
		}

		console.log('Disabling Docker sandbox mode...');

		const cleaned = await this.dockerfileManager.cleanup(
			this.currentWorkingDir,
		);

		const oldMode = this.mode;
		this.mode = SandboxMode.DISABLED;
		this.containerId = null;
		this.imageTag = null;

		console.log('Docker sandbox mode DISABLED - Commands run on host');

		this.notifyListeners(this.mode, oldMode);

		return {success: cleaned};
	}

	/**
	 * Toggle sandbox mode
	 */
	async toggle(): Promise<{success: boolean; mode: SandboxMode; error?: string}> {
		if (this.isEnabled()) {
			const result = await this.disable();
			return {
				success: result.success,
				mode: this.mode,
				error: result.error,
			};
		} else {
			const result = await this.enable();
			return {
				success: result.success,
				mode: this.mode,
				error: result.error,
			};
		}
	}

	/**
	 * Get container ID (if running)
	 */
	getContainerId(): string | null {
		return this.containerId;
	}

	/**
	 * Get image tag
	 */
	getImageTag(): string | null {
		return this.imageTag;
	}

	/**
	 * Get current working directory
	 */
	getCurrentWorkingDir(): string {
		return this.currentWorkingDir;
	}

	/**
	 * Add listener for mode changes
	 */
	addListener(listener: SandboxModeChangeListener): void {
		this.listeners.push(listener);
	}

	/**
	 * Remove listener
	 */
	removeListener(listener: SandboxModeChangeListener): void {
		this.listeners = this.listeners.filter(l => l !== listener);
	}

	/**
	 * Notify all listeners of mode change
	 */
	private notifyListeners(newMode: SandboxMode, oldMode: SandboxMode): void {
		for (const listener of this.listeners) {
			try {
				listener.onModeChanged(newMode, oldMode);
			} catch (error) {
				console.error('Error notifying sandbox mode listener:', error);
			}
		}
	}

	/**
	 * Get mode description
	 */
	getModeDescription(): string {
		if (!this.sandboxAvailable) {
			return 'Sandbox unavailable - No Dockerfile found';
		}

		if (this.isEnabled()) {
			return 'Sandbox ENABLED - Commands run in Docker container';
		}

		return 'Sandbox DISABLED - Commands run on host system';
	}

	/**
	 * Cleanup on app exit
	 */
	async cleanup(): Promise<void> {
		if (this.isEnabled()) {
			await this.disable();
		}
	}
}

/**
 * Global sandbox mode manager instance
 */
export const globalSandboxModeManager = new SandboxModeManager();

export {SandboxMode} from '../../core/domain/interfaces/ISandboxModeManager.js';
export type {SandboxModeChangeListener} from '../../core/domain/interfaces/ISandboxModeManager.js';
