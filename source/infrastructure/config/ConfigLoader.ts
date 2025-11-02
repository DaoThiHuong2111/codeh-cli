/**
 * Config Loader
 * Loads configuration with priority: ENV > File > Defaults
 */

import { Configuration } from '../../core/domain/models/Configuration';
import { EnvConfigRepository } from './EnvConfigRepository';
import { FileConfigRepository } from './FileConfigRepository';
import { ConfigData } from '../../core/domain/interfaces/IConfigRepository';

export class ConfigLoader {
  private envRepo: EnvConfigRepository;
  private fileRepo: FileConfigRepository;

  constructor() {
    this.envRepo = new EnvConfigRepository();
    this.fileRepo = new FileConfigRepository();
  }

  /**
   * Load configuration with priority:
   * 1. Environment variables (highest)
   * 2. File config (~/.codeh/configs.json)
   * 3. Defaults (lowest)
   */
  async load(): Promise<Configuration> {
    const config = await this.mergeConfigs();

    if (!config.provider) {
      throw new Error(
        'No configuration found. Please set CODEH_PROVIDER environment variable or run configuration wizard.'
      );
    }

    return Configuration.create(config);
  }

  /**
   * Check if configuration exists
   */
  async exists(): Promise<boolean> {
    const envExists = await this.envRepo.exists();
    const fileExists = await this.fileRepo.exists();
    return envExists || fileExists;
  }

  /**
   * Get merged configuration data
   */
  async mergeConfigs(): Promise<ConfigData> {
    const fileConfig = await this.fileRepo.getAll();
    const envConfig = await this.envRepo.getAll();

    // Merge with priority: ENV > File > Defaults
    return {
      provider:
        envConfig.provider || fileConfig.provider || ('anthropic' as any),
      model: envConfig.model || fileConfig.model || '',
      baseUrl: envConfig.baseUrl || fileConfig.baseUrl,
      apiKey: envConfig.apiKey || fileConfig.apiKey,
      maxTokens: envConfig.maxTokens || fileConfig.maxTokens || 4096,
      temperature: envConfig.temperature || fileConfig.temperature || 0.7,
    };
  }

  /**
   * Save configuration to file
   */
  async save(config: Configuration): Promise<void> {
    await this.fileRepo.addCustomModel({
      provider: config.provider,
      model: config.model,
      baseUrl: config.baseUrl,
      apiKey: config.apiKey,
      maxTokens: config.maxTokens,
      temperature: config.temperature,
    });
  }

  /**
   * Validate configuration
   */
  async validate(): Promise<{ valid: boolean; errors: string[] }> {
    try {
      const config = await this.load();
      const errors = config.getValidationErrors();

      return {
        valid: errors.length === 0,
        errors,
      };
    } catch (error: any) {
      return {
        valid: false,
        errors: [error.message],
      };
    }
  }

  /**
   * Get configuration status
   */
  async getStatus(): Promise<{
    hasEnvConfig: boolean;
    hasFileConfig: boolean;
    provider?: string;
    model?: string;
  }> {
    const hasEnvConfig = await this.envRepo.exists();
    const hasFileConfig = await this.fileRepo.exists();
    const merged = await this.mergeConfigs();

    return {
      hasEnvConfig,
      hasFileConfig,
      provider: merged.provider,
      model: merged.model,
    };
  }

  /**
   * Clear all configuration
   */
  async clear(): Promise<void> {
    await this.fileRepo.clear();
    // Don't clear env vars as they might be system-level
  }

  /**
   * Get active repository (env or file)
   */
  getEnvRepository(): EnvConfigRepository {
    return this.envRepo;
  }

  getFileRepository(): FileConfigRepository {
    return this.fileRepo;
  }
}
