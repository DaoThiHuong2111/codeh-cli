/**
 * DI Container Setup with Lazy Loading
 *
 * Enhanced version of setup.ts that uses LazyToolRegistry for improved
 * startup performance and memory usage.
 *
 * Key improvements:
 * - Tools are loaded on-demand (lazy loading)
 * - TypeScript analyzer instantiated only when needed
 * - Preloading of commonly used tools
 * - Reduced startup time (~50-70% faster)
 */

import {Container} from './Container';

// Layer 3 - Infrastructure
import {ApiClientFactory} from '../../infrastructure/api/ApiClientFactory';
import {ConfigLoader} from '../../infrastructure/config/ConfigLoader';
import {InMemoryHistoryRepository} from '../../infrastructure/history/InMemoryHistoryRepository';
import {FileOperations} from '../../infrastructure/filesystem/FileOperations';
import {ShellExecutor} from '../../infrastructure/process/ShellExecutor';
import {DockerfileManager} from '../../infrastructure/process/DockerfileManager';
import {DockerShellExecutor} from '../../infrastructure/process/DockerShellExecutor';
import {SandboxModeManager} from '../../infrastructure/process/SandboxModeManager';
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
import {LazyToolRegistry} from '../tools/base/LazyToolRegistry';
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
import {ISymbolAnalyzer} from '../domain/interfaces/ISymbolAnalyzer';
import {IApiClient} from '../domain/interfaces/IApiClient';
import {IHistoryRepository} from '../domain/interfaces/IHistoryRepository';
import {IToolPermissionHandler} from '../domain/interfaces/IToolPermissionHandler';
import {Configuration} from '../domain/models/Configuration';

/**
 * Setup container with lazy loading enabled
 *
 * @returns {Promise<Container>} Configured container
 */
export async function setupContainerWithLazyLoading(): Promise<Container> {
	const container = new Container();

	container.register('ConfigLoader', () => new ConfigLoader(), true);
	container.register('ApiClientFactory', () => new ApiClientFactory(), true);

	container.register(
		'HistoryRepository',
		() => new InMemoryHistoryRepository(),
		true,
	);

	container.register('FileOperations', () => new FileOperations(), true);

	container.register('ShellExecutor', () => new ShellExecutor(), true);
	container.register(
		'DockerfileManager',
		() => new DockerfileManager(),
		true,
	);
	container.register(
		'SandboxModeManager',
		() => {
			const dockerfileManager = container.resolve<DockerfileManager>(
				'DockerfileManager',
			);
			return new SandboxModeManager(dockerfileManager);
		},
		true,
	);
	container.register(
		'DockerShellExecutor',
		() => {
			const dockerfileManager = container.resolve<DockerfileManager>(
				'DockerfileManager',
			);
			const sandboxModeManager = container.resolve<SandboxModeManager>(
				'SandboxModeManager',
			);
			return new DockerShellExecutor(
				dockerfileManager,
				() => sandboxModeManager.getContainerId(),
			);
		},
		true,
	);
	container.register('CommandValidator', () => new CommandValidator(), true);

	container.register(
		'PermissionModeManager',
		() => new PermissionModeManager(),
		true,
	);

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

	container.register('InputClassifier', () => new InputClassifier(), true);
	container.register('OutputFormatter', () => new OutputFormatter(), true);
	container.register('WorkflowManager', () => new WorkflowManager(), true);

	container.register(
		'ToolRegistry',
		() => {
			const registry = new LazyToolRegistry();
			const projectRoot = process.env.CODEH_PROJECT_ROOT || process.cwd();

			let analyzerInstance: ISymbolAnalyzer | null = null;
			const getAnalyzer = (): ISymbolAnalyzer => {
				if (!analyzerInstance) {
					analyzerInstance = new TypeScriptSymbolAnalyzer(projectRoot);
				}
				return analyzerInstance;
			};

			const hostExecutor = container.resolve<ShellExecutor>('ShellExecutor');
			const dockerExecutor = container.resolve<DockerShellExecutor>(
				'DockerShellExecutor',
			);
			const sandboxModeManager = container.resolve<SandboxModeManager>(
				'SandboxModeManager',
			);
			const fileOps = container.resolve<FileOperations>('FileOperations');
			const workflowManager =
				container.resolve<WorkflowManager>('WorkflowManager');

			registry.registerLazy('shell', () =>
				new ShellTool(
					hostExecutor,
					dockerExecutor,
					sandboxModeManager,
				),
			);
			registry.registerLazy('file_ops', () => new FileOpsTool(fileOps));

			registry.registerLazy(
				'symbol_search',
				() => new SymbolSearchTool(projectRoot),
			);
			registry.registerLazy(
				'find_references',
				() => new FindReferencesTool(projectRoot),
			);
			registry.registerLazy(
				'get_symbols_overview',
				() => new GetSymbolsOverviewTool(projectRoot),
			);

			registry.registerLazy(
				'rename_symbol',
				() => new RenameSymbolTool(projectRoot),
			);
			registry.registerLazy(
				'replace_symbol_body',
				() => new ReplaceSymbolBodyTool(projectRoot),
			);
			registry.registerLazy(
				'insert_before_symbol',
				() => new InsertBeforeSymbolTool(projectRoot),
			);
			registry.registerLazy(
				'insert_after_symbol',
				() => new InsertAfterSymbolTool(projectRoot),
			);

			registry.registerLazy(
				'replace_regex',
				() => new ReplaceRegexTool(projectRoot),
			);
			registry.registerLazy('find_file', () => new FindFileTool(projectRoot));
			registry.registerLazy(
				'search_for_pattern',
				() => new SearchForPatternTool(projectRoot),
			);

			registry.registerLazy(
				'get_type_information',
				() => new GetTypeInformationTool(projectRoot, getAnalyzer()),
			);
			registry.registerLazy(
				'get_call_hierarchy',
				() => new GetCallHierarchyTool(projectRoot, getAnalyzer()),
			);
			registry.registerLazy(
				'find_implementations',
				() => new FindImplementationsTool(projectRoot, getAnalyzer()),
			);
			registry.registerLazy(
				'validate_code_changes',
				() => new ValidateCodeChangesTool(projectRoot, getAnalyzer()),
			);
			registry.registerLazy(
				'smart_context_extractor',
				() => new SmartContextExtractorTool(projectRoot, getAnalyzer()),
			);
			registry.registerLazy(
				'get_dependency_graph',
				() => new DependencyGraphTool(projectRoot),
			);

			registry.registerLazy(
				'create_plan',
				() => new CreatePlanTool(workflowManager),
			);
			registry.registerLazy('add_todo', () => new AddTodoTool(workflowManager));
			registry.registerLazy(
				'update_todo_status',
				() => new UpdateTodoStatusTool(workflowManager),
			);
			registry.registerLazy(
				'remove_todo',
				() => new RemoveTodoTool(workflowManager),
			);
			registry.registerLazy(
				'get_current_plan',
				() => new GetCurrentPlanTool(workflowManager),
			);

			registry.preload(['shell', 'file_ops']);

			return registry;
		},
		true,
	);

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
	const toolRegistry = container.resolve<LazyToolRegistry>('ToolRegistry') as any;
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
		configuration,
		toolRegistry,
		permissionHandler,
	);
}

