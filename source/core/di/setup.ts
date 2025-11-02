/**
 * DI Container Setup
 * Configures all application dependencies
 */

import { Container } from './Container';

// Layer 3 - Infrastructure
import { ApiClientFactory } from '../../infrastructure/api/ApiClientFactory';
import { ConfigLoader } from '../../infrastructure/config/ConfigLoader';
import { FileHistoryRepository } from '../../infrastructure/history/FileHistoryRepository';
import { FileOperations } from '../../infrastructure/filesystem/FileOperations';
import { ShellExecutor } from '../../infrastructure/process/ShellExecutor';
import { CommandValidator } from '../../infrastructure/process/CommandValidator';

// Layer 2 - Core
import { CodehClient } from '../application/CodehClient';
import { CodehChat } from '../application/CodehChat';
import { InputClassifier } from '../application/services/InputClassifier';
import { OutputFormatter } from '../application/services/OutputFormatter';
import { ToolRegistry } from '../tools/base/ToolRegistry';
import { ShellTool } from '../tools/Shell';
import { FileOpsTool } from '../tools/FileOps';
import { IApiClient } from '../domain/interfaces/IApiClient';
import { IHistoryRepository } from '../domain/interfaces/IHistoryRepository';
import { Configuration } from '../domain/models/Configuration';

export async function setupContainer(): Promise<Container> {
  const container = new Container();

  // ==================================================
  // LAYER 3: Infrastructure
  // ==================================================

  // Config
  container.register('ConfigLoader', () => new ConfigLoader(), true);

  // API Client (async resolution)
  container.register(
    'ApiClient',
    () => {
      const configLoader = container.resolve<ConfigLoader>('ConfigLoader');
      const factory = new ApiClientFactory();

      // Load config synchronously for DI setup
      // In production, this should be handled differently
      const config = configLoader.mergeConfigs();
      return config.then((cfg) => {
        const configuration = Configuration.create(cfg);
        return factory.create(configuration);
      });
    },
    true
  );

  // History
  container.register(
    'HistoryRepository',
    () => new FileHistoryRepository(),
    true
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
    true
  );

  // Orchestrators
  container.register(
    'CodehClient',
    async () => {
      const apiClient = await container.resolve('ApiClient') as IApiClient;
      const historyRepo = await container.resolve('HistoryRepository') as IHistoryRepository;
      return new CodehClient(apiClient, historyRepo);
    },
    true
  );

  container.register(
    'CodehChat',
    async () => {
      const historyRepo = await container.resolve('HistoryRepository') as IHistoryRepository;
      return new CodehChat(historyRepo);
    },
    true
  );

  return container;
}

/**
 * Create a new container instance
 */
export function createContainer(): Container {
  return new Container();
}
