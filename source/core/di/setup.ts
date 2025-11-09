/**
 * DI Container Setup
 * Configures all application dependencies
 */

import {Container} from './Container';

// Layer 3 - Infrastructure
import {ApiClientFactory} from '../../infrastructure/api/ApiClientFactory';
import {ConfigLoader} from '../../infrastructure/config/ConfigLoader';
import {FileHistoryRepository} from '../../infrastructure/history/FileHistoryRepository';
import {FileOperations} from '../../infrastructure/filesystem/FileOperations';
import {ShellExecutor} from '../../infrastructure/process/ShellExecutor';
import {CommandValidator} from '../../infrastructure/process/CommandValidator';

// Layer 2 - Core
import {CodehClient} from '../application/CodehClient';
import {CodehChat} from '../application/CodehChat';
import {InputClassifier} from '../application/services/InputClassifier';
import {OutputFormatter} from '../application/services/OutputFormatter';
import {ToolRegistry} from '../tools/base/ToolRegistry';
import {ShellTool} from '../tools/Shell';
import {FileOpsTool} from '../tools/FileOps';
import {IApiClient} from '../domain/interfaces/IApiClient';
import {IHistoryRepository} from '../domain/interfaces/IHistoryRepository';
import {Configuration} from '../domain/models/Configuration';

export async function setupContainer(): Promise<Container> {
	const container = new Container();

	// ==================================================
	// LAYER 3: Infrastructure
	// ==================================================

	// Config
	container.register('ConfigLoader', () => new ConfigLoader(), true);
	container.register('ApiClientFactory', () => new ApiClientFactory(), true);

	// History
	container.register(
		'HistoryRepository',
		() => new FileHistoryRepository(),
		true,
	);

	// File Operations
	container.register('FileOperations', () => new FileOperations(), true);

	// Shell Executor
	container.register('ShellExecutor', () => new ShellExecutor(), true);
	container.register('CommandValidator', () => new CommandValidator(), true);

	// ==================================================
	// LAYER 2: Core / Application
	// ==================================================

	// Services
	container.register('InputClassifier', () => new InputClassifier(), true);
	container.register('OutputFormatter', () => new OutputFormatter(), true);

	// Tool Registry
	container.register(
		'ToolRegistry',
		() => {
			const registry = new ToolRegistry();
			const shellExecutor = container.resolve<ShellExecutor>('ShellExecutor');
			const fileOps = container.resolve<FileOperations>('FileOperations');

			// Register tools
			registry.register(new ShellTool(shellExecutor));
			registry.register(new FileOpsTool(fileOps));

			return registry;
		},
		true,
	);

	// Orchestrators (CodehChat only - CodehClient is lazy loaded)
	container.register(
		'CodehChat',
		async () => {
			const historyRepo = (await container.resolve(
				'HistoryRepository',
			)) as IHistoryRepository;
			return new CodehChat(historyRepo);
		},
		true,
	);

	return container;
}

/**
 * Factory function to create CodehClient on-demand
 * This allows the app to start without requiring API configuration
 * Throws error if no configuration exists
 */
export async function createCodehClient(
	container: Container,
): Promise<CodehClient> {
	const configLoader = container.resolve<ConfigLoader>('ConfigLoader');
	const factory = container.resolve<ApiClientFactory>('ApiClientFactory');
	const historyRepo = (await container.resolve(
		'HistoryRepository',
	)) as IHistoryRepository;

	const config = await configLoader.mergeConfigs();
	if (!config) {
		throw new Error(
			'No configuration found. Please run "codeh config" to set up your API configuration.',
		);
	}

	const configuration = Configuration.create(config);
	const apiClient = factory.create(configuration);

	return new CodehClient(apiClient, historyRepo);
}

/**
 * Create a new container instance
 */
export function createContainer(): Container {
	return new Container();
}
