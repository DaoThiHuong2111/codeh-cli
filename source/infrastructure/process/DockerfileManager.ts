/**
 * Dockerfile Manager
 * Manages Docker container lifecycle for sandbox execution
 *
 * Responsibilities:
 * - Check Dockerfile existence
 * - Build Docker image from Dockerfile
 * - Start long-running container
 * - Execute commands in container
 * - Stop and cleanup container
 *
 * @module infrastructure/process
 */

import {existsSync} from 'fs';
import {join} from 'path';
import {ShellExecutor} from './ShellExecutor.js';
import {createHash} from 'crypto';

export interface DockerContainerInfo {
	containerId: string;
	imageId: string;
	status: 'running' | 'stopped' | 'not_found';
}

/**
 * Dockerfile Manager
 * Handles Docker container lifecycle for sandbox mode
 */
export class DockerfileManager {
	private shellExecutor: ShellExecutor;
	private containerCache: Map<string, string> = new Map(); // projectPath → containerId
	private imageCache: Map<string, string> = new Map(); // projectHash → imageId

	constructor() {
		this.shellExecutor = new ShellExecutor();
	}

	/**
	 * Check if Dockerfile exists in directory
	 */
	hasDockerfile(cwd: string): boolean {
		const dockerfilePath = join(cwd, 'Dockerfile');
		return existsSync(dockerfilePath);
	}

	/**
	 * Check if Docker is installed and available
	 */
	async isDockerAvailable(): Promise<boolean> {
		try {
			const result = await this.shellExecutor.execute('docker --version');
			return result.success;
		} catch (error) {
			return false;
		}
	}

	/**
	 * Generate unique container name for project
	 */
	private getContainerName(cwd: string): string {
		const hash = createHash('md5').update(cwd).digest('hex').substring(0, 8);
		return `codeh-sandbox-${hash}`;
	}

	/**
	 * Generate image tag from Dockerfile content hash
	 */
	private async getImageTag(cwd: string): Promise<string> {
		const dockerfilePath = join(cwd, 'Dockerfile');
		const {readFileSync} = await import('fs');
		const content = readFileSync(dockerfilePath, 'utf-8');
		const hash = createHash('md5').update(content).digest('hex').substring(0, 8);
		return `codeh-sandbox:${hash}`;
	}

	/**
	 * Check if image exists
	 */
	private async imageExists(imageTag: string): Promise<boolean> {
		const result = await this.shellExecutor.execute(
			`docker images -q ${imageTag}`,
		);
		return result.success && result.stdout.trim().length > 0;
	}

	/**
	 * Build Docker image from Dockerfile
	 */
	async buildImage(cwd: string): Promise<{success: boolean; imageTag: string; error?: string}> {
		if (!this.hasDockerfile(cwd)) {
			return {
				success: false,
				imageTag: '',
				error: 'Dockerfile not found',
			};
		}

		const imageTag = await this.getImageTag(cwd);

		// Check if image already exists
		if (await this.imageExists(imageTag)) {
			console.log(`📦 Docker image ${imageTag} already exists, skipping build`);
			return {success: true, imageTag};
		}

		console.log(`📦 Building Docker image from Dockerfile...`);

		const result = await this.shellExecutor.execute(
			`docker build -t ${imageTag} .`,
			{cwd},
		);

		if (result.success) {
			console.log(`✅ Docker image built successfully: ${imageTag}`);
			this.imageCache.set(cwd, imageTag);
			return {success: true, imageTag};
		} else {
			console.error(`❌ Failed to build Docker image:\n${result.stderr}`);
			return {
				success: false,
				imageTag: '',
				error: result.stderr,
			};
		}
	}

	/**
	 * Start long-running container from image
	 */
	async startContainer(
		imageTag: string,
		cwd: string,
	): Promise<{success: boolean; containerId?: string; error?: string}> {
		const containerName = this.getContainerName(cwd);

		// Check if container already exists
		const existingContainer = await this.getContainerStatus(containerName);
		if (existingContainer.status === 'running') {
			console.log(`📦 Container ${containerName} already running`);
			return {success: true, containerId: existingContainer.containerId};
		}

		// Remove old stopped container if exists
		if (existingContainer.status === 'stopped') {
			await this.removeContainer(existingContainer.containerId);
		}

		console.log(`🚀 Starting Docker container...`);

		// Start container in detached mode with workspace mounted
		const command = [
			'docker run -d',
			`--name ${containerName}`,
			`-v "${cwd}:/workspace"`,
			'-w /workspace',
			imageTag,
			'sleep infinity', // Keep container running
		].join(' ');

		const result = await this.shellExecutor.execute(command);

		if (result.success) {
			const containerId = result.stdout.trim();
			console.log(`✅ Container started: ${containerId.substring(0, 12)}`);
			this.containerCache.set(cwd, containerId);
			return {success: true, containerId};
		} else {
			console.error(`❌ Failed to start container:\n${result.stderr}`);
			return {
				success: false,
				error: result.stderr,
			};
		}
	}

	/**
	 * Get container status
	 */
	async getContainerStatus(
		containerNameOrId: string,
	): Promise<DockerContainerInfo> {
		const result = await this.shellExecutor.execute(
			`docker ps -a --filter name=${containerNameOrId} --format "{{.ID}} {{.Status}}"`,
		);

		if (!result.success || !result.stdout.trim()) {
			return {
				containerId: '',
				imageId: '',
				status: 'not_found',
			};
		}

		const [containerId, ...statusParts] = result.stdout.trim().split(' ');
		const statusStr = statusParts.join(' ');
		const status = statusStr.toLowerCase().includes('up')
			? 'running'
			: 'stopped';

		return {
			containerId,
			imageId: '',
			status,
		};
	}

	/**
	 * Stop container
	 */
	async stopContainer(containerNameOrId: string): Promise<boolean> {
		console.log(`🛑 Stopping container...`);
		const result = await this.shellExecutor.execute(
			`docker stop ${containerNameOrId}`,
		);
		return result.success;
	}

	/**
	 * Remove container
	 */
	async removeContainer(containerNameOrId: string): Promise<boolean> {
		console.log(`🗑️  Removing container...`);
		const result = await this.shellExecutor.execute(
			`docker rm -f ${containerNameOrId}`,
		);
		return result.success;
	}

	/**
	 * Execute command in running container
	 */
	async executeInContainer(
		containerNameOrId: string,
		command: string,
		options?: {cwd?: string},
	): Promise<{stdout: string; stderr: string; exitCode: number; success: boolean; duration: number}> {
		// Build docker exec command
		const workDir = options?.cwd ? `-w ${options.cwd}` : '';
		const dockerCommand = `docker exec ${workDir} ${containerNameOrId} sh -c "${command.replace(/"/g, '\\"')}"`;

		const result = await this.shellExecutor.execute(dockerCommand);
		return result;
	}

	/**
	 * Cleanup - stop and remove container
	 */
	async cleanup(cwd: string): Promise<boolean> {
		const containerName = this.getContainerName(cwd);
		const status = await this.getContainerStatus(containerName);

		if (status.status === 'not_found') {
			return true;
		}

		console.log(`🧹 Cleaning up sandbox container...`);

		// Stop if running
		if (status.status === 'running') {
			await this.stopContainer(containerName);
		}

		// Remove container
		const removed = await this.removeContainer(containerName);

		// Clear cache
		this.containerCache.delete(cwd);

		if (removed) {
			console.log(`✅ Sandbox container cleaned up`);
		}

		return removed;
	}

	/**
	 * Get cached container ID for project
	 */
	getCachedContainerId(cwd: string): string | undefined {
		return this.containerCache.get(cwd);
	}

	/**
	 * Get cached image tag for project
	 */
	getCachedImageTag(cwd: string): string | undefined {
		return this.imageCache.get(cwd);
	}
}
