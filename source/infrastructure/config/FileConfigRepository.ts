/**
 * File-based Config Repository
 * Reads/writes configuration from ~/.codeh/configs.json
 */

import {
  IConfigRepository,
  ConfigData,
} from '../../core/domain/interfaces/IConfigRepository';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { homedir } from 'os';
import { join, dirname } from 'path';

interface FileConfigData {
  custom_models?: Array<{
    provider: string;
    model: string;
    base_url?: string;
    api_key?: string;
    max_tokens?: number;
    temperature?: number;
  }>;
  [key: string]: any;
}

export class FileConfigRepository implements IConfigRepository {
  private configFile: string;
  private config: FileConfigData;

  constructor(configPath?: string) {
    this.configFile = configPath || join(homedir(), '.codeh', 'configs.json');
    this.config = this.loadConfig();
  }

  private loadConfig(): FileConfigData {
    try {
      const configDir = dirname(this.configFile);
      if (!existsSync(configDir)) {
        mkdirSync(configDir, { recursive: true });
      }

      if (existsSync(this.configFile)) {
        const fileContent = readFileSync(this.configFile, 'utf8');
        return JSON.parse(fileContent);
      } else {
        const defaultConfig: FileConfigData = { custom_models: [] };
        this.saveConfig(defaultConfig);
        return defaultConfig;
      }
    } catch (error: any) {
      console.warn('Error loading config, using defaults:', error.message);
      return { custom_models: [] };
    }
  }

  private saveConfig(config: FileConfigData): void {
    try {
      writeFileSync(this.configFile, JSON.stringify(config, null, 2));
    } catch (error: any) {
      console.error('Error saving config:', error.message);
    }
  }

  async get(key: string): Promise<string | undefined> {
    const keys = key.split('.');
    let value: any = this.config;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return undefined;
      }
    }

    return value !== undefined ? String(value) : undefined;
  }

  async set(key: string, value: string): Promise<void> {
    const keys = key.split('.');
    const lastKey = keys.pop()!;
    let target: any = this.config;

    for (const k of keys) {
      if (!(k in target) || typeof target[k] !== 'object') {
        target[k] = {};
      }
      target = target[k];
    }

    target[lastKey] = value;
    this.saveConfig(this.config);
  }

  async getAll(): Promise<ConfigData> {
    const firstModel = this.config.custom_models?.[0];

    if (!firstModel) {
      return {
        provider: 'anthropic',
        model: '',
        baseUrl: '',
        apiKey: '',
        maxTokens: 4096,
        temperature: 0.7,
      };
    }

    return {
      provider: firstModel.provider as any,
      model: firstModel.model || '',
      baseUrl: firstModel.base_url,
      apiKey: firstModel.api_key,
      maxTokens: firstModel.max_tokens || 4096,
      temperature: firstModel.temperature || 0.7,
    };
  }

  async exists(): Promise<boolean> {
    return existsSync(this.configFile);
  }

  async delete(key: string): Promise<void> {
    const keys = key.split('.');
    const lastKey = keys.pop()!;
    let target: any = this.config;

    for (const k of keys) {
      if (!(k in target)) {
        return; // Key path doesn't exist
      }
      target = target[k];
    }

    delete target[lastKey];
    this.saveConfig(this.config);
  }

  async clear(): Promise<void> {
    this.config = { custom_models: [] };
    this.saveConfig(this.config);
  }

  // Additional methods specific to file config
  async getCustomModels(): Promise<ConfigData[]> {
    const models = this.config.custom_models || [];
    return models.map((m) => ({
      provider: m.provider as any,
      model: m.model || '',
      baseUrl: m.base_url,
      apiKey: m.api_key,
      maxTokens: m.max_tokens || 4096,
      temperature: m.temperature || 0.7,
    }));
  }

  async addCustomModel(model: ConfigData): Promise<void> {
    if (!this.config.custom_models) {
      this.config.custom_models = [];
    }

    this.config.custom_models.push({
      provider: model.provider,
      model: model.model,
      base_url: model.baseUrl,
      api_key: model.apiKey,
      max_tokens: model.maxTokens,
      temperature: model.temperature,
    });

    this.saveConfig(this.config);
  }

  async removeCustomModel(index: number): Promise<void> {
    if (this.config.custom_models && this.config.custom_models[index]) {
      this.config.custom_models.splice(index, 1);
      this.saveConfig(this.config);
    }
  }

  async setMultiple(updates: Record<string, string>): Promise<void> {
    for (const [key, value] of Object.entries(updates)) {
      await this.set(key, value);
    }
  }

  getConfigPath(): string {
    return this.configFile;
  }
}
