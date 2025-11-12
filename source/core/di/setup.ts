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
import {SimplePermissionHandler} from '../../infrastructure/permissions/SimplePermissionHandler';
import {PermissionModeManager} from '../../infrastructure/permissions/PermissionModeManager';
import {HybridPermissionHandler} from '../../infrastructure/permissions/HybridPermissionHandler';

// Layer 2 - Core
import {CodehClient} from '../application/CodehClient';
import {CodehChat} from '../application/CodehChat';
import {InputClassifier} from '../application/services/InputClassifier';
import {OutputFormatter} from '../application/services/OutputFormatter';
import {WorkflowManager} from '../application/services/WorkflowManager';
import {ToolRegistry} from '../tools/base/ToolRegistry';
import {ShellTool} from '../tools/Shell';
import {FileOpsTool} from '../tools/FileOps';
import {SymbolSearchTool} from '../tools/SymbolSearchTool';
import {FindReferencesTool} from '../tools/FindReferencesTool';
import {GetSymbolsOverviewTool} from '../tools/GetSymbolsOverviewTool';
import {RenameSymbolTool} from '../tools/RenameSymbolTool';
import {ReplaceSymbolBodyTool} from '../tools/ReplaceSymbolBodyTool';
import {InsertBeforeSymbolTool} from '../tools/InsertBeforeSymbolTool';
import {InsertAfterSymbolTool} from '../tools/InsertAfterSymbolTool';
import {ReplaceRegexTool} from '../tools/ReplaceRegexTool';
import {FindFileTool} from '../tools/FindFileTool';
import {SearchForPatternTool} from '../tools/SearchForPatternTool';
import {
	CreatePlanTool,
	AddTodoTool,
	UpdateTodoStatusTool,
	RemoveTodoTool,
	GetCurrentPlanTool,
} from '../tools/WorkflowTools';
import {GetTypeInformationTool} from '../tools/GetTypeInformationTool';
import {GetCallHierarchyTool} from '../tools/GetCallHierarchyTool';
import {FindImplementationsTool} from '../tools/FindImplementationsTool';
import {ValidateCodeChangesTool} from '../tools/ValidateCodeChangesTool';
import {SmartContextExtractorTool} from '../tools/SmartContextExtractorTool';
import {DependencyGraphTool} from '../tools/DependencyGraphTool';
import {TypeScriptSymbolAnalyzer} from '../../infrastructure/typescript/TypeScriptSymbolAnalyzer';
import {IApiClient} from '../domain/interfaces/IApiClient';
import {IHistoryRepository} from '../domain/interfaces/IHistoryRepository';
import {IToolPermissionHandler} from '../domain/interfaces/IToolPermissionHandler';
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

	// Permission Mode Manager (singleton shared across app)
	container.register(
		'PermissionModeManager',
		() => new PermissionModeManager(),
		true,
	);

	// Permission Handler (hybrid - switches between MVP and Interactive)
	container.register(
		'PermissionHandler',
		() => {
			const modeManager = container.resolve<PermissionModeManager>(
				'PermissionModeManager',
			);
			return new HybridPermissionHandler(modeManager);
		},
		true,
	);

	// ==================================================
	// LAYER 2: Core / Application
	// ==================================================

	// Services
	container.register('InputClassifier', () => new InputClassifier(), true);
	container.register('OutputFormatter', () => new OutputFormatter(), true);
	container.register('WorkflowManager', () => new WorkflowManager(), true);

	// Tool Registry
	container.register(
		'ToolRegistry',
		() => {
			const registry = new ToolRegistry();
			const shellExecutor = container.resolve<ShellExecutor>('ShellExecutor');
			const fileOps = container.resolve<FileOperations>('FileOperations');
			const workflowManager =
				container.resolve<WorkflowManager>('WorkflowManager');

			// Register basic tools
			registry.register(new ShellTool(shellExecutor));
			registry.register(new FileOpsTool(fileOps));

			// Register TypeScript symbol tools
			// Get project root from environment or use current working directory
			const projectRoot = process.env.CODEH_PROJECT_ROOT || process.cwd();

			// Symbol analysis tools
			registry.register(new SymbolSearchTool(projectRoot));
			registry.register(new FindReferencesTool(projectRoot));
			registry.register(new GetSymbolsOverviewTool(projectRoot));

			// Refactoring & editing tools
			registry.register(new RenameSymbolTool(projectRoot));
			registry.register(new ReplaceSymbolBodyTool(projectRoot));
			registry.register(new InsertBeforeSymbolTool(projectRoot));
			registry.register(new InsertAfterSymbolTool(projectRoot));

			// File operations tools
			registry.register(new ReplaceRegexTool(projectRoot));
			registry.register(new FindFileTool(projectRoot));
			registry.register(new SearchForPatternTool(projectRoot));

			// Advanced code intelligence tools (require TypeScript analyzer)
			const analyzer = new TypeScriptSymbolAnalyzer(projectRoot);
			registry.register(new GetTypeInformationTool(projectRoot, analyzer));
			registry.register(new GetCallHierarchyTool(projectRoot, analyzer));
			registry.register(new FindImplementationsTool(projectRoot, analyzer));
			registry.register(new ValidateCodeChangesTool(projectRoot, analyzer));
			registry.register(new SmartContextExtractorTool(projectRoot, analyzer));
			registry.register(new DependencyGraphTool(projectRoot));

			// Workflow management tools (AI plan/todo management)
			registry.register(new CreatePlanTool(workflowManager));
			registry.register(new AddTodoTool(workflowManager));
			registry.register(new UpdateTodoStatusTool(workflowManager));
			registry.register(new RemoveTodoTool(workflowManager));
			registry.register(new GetCurrentPlanTool(workflowManager));

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
	const toolRegistry = container.resolve<ToolRegistry>('ToolRegistry');
	const permissionHandler =
		container.resolve<IToolPermissionHandler>('PermissionHandler');

	const config = await configLoader.mergeConfigs();
	if (!config) {
		throw new Error(
			'No configuration found. Please run "codeh config" to set up your API configuration.',
		);
	}

	const configuration = Configuration.create(config);
	const apiClient = factory.create(configuration);

	return new CodehClient(
		apiClient,
		historyRepo,
		toolRegistry,
		permissionHandler,
	);
}

/**
 * Create a new container instance
 */
export function createContainer(): Container {
	return new Container();
}
