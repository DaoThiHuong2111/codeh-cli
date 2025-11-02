/**
 * Environment Variable Config Repository
 * Reads configuration from environment variables
 * Only supports CODEH_* prefixed variables
 */

import {
  IConfigRepository,
  ConfigData,
} from '../../core/domain/interfaces/IConfigRepository';

export class EnvConfigRepository implements IConfigRepository {
  private readonly envVars = [
    'CODEH_MODEL',
    'CODEH_BASE_URL',
    'CODEH_API_KEY',
    'CODEH_PROVIDER',
    'CODEH_MAX_TOKEN',
    'CODEH_TEMPERATURE',
  ];

  async get(key: string): Promise<string | undefined> {
    return process.env[key];
  }

  async set(key: string, value: string): Promise<void> {
    process.env[key] = value;
  }

  async getAll(): Promise<ConfigData | null> {
    const provider = await this.get('CODEH_PROVIDER');
    const model = await this.get('CODEH_MODEL');
    const baseUrl = await this.get('CODEH_BASE_URL');
    const apiKey = await this.get('CODEH_API_KEY');
    const maxTokens = await this.getMaxTokens();
    const temperature = await this.getTemperature();

    // If no provider is set, consider env config as not existing
    if (!provider) {
      return null;
    }

    return {
      provider: provider as any,
      model: model || '',
      baseUrl,
      apiKey,
      maxTokens,
      temperature,
    };
  }

  async exists(): Promise<boolean> {
    const provider = await this.get('CODEH_PROVIDER');
    return !!provider;
  }

  async delete(key: string): Promise<void> {
    delete process.env[key];
  }

  async clear(): Promise<void> {
    this.envVars.forEach((key) => {
      delete process.env[key];
    });
  }

  // Helper methods
  private async getMaxTokens(): Promise<number> {
    const value = await this.get('CODEH_MAX_TOKEN');
    if (value) {
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? 4096 : parsed;
    }
    return 4096;
  }

  private async getTemperature(): Promise<number> {
    const value = await this.get('CODEH_TEMPERATURE');
    if (value) {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0.7 : parsed;
    }
    return 0.7;
  }

  // Validation
  async validate(): Promise<string[]> {
    const missing: string[] = [];

    const provider = await this.get('CODEH_PROVIDER');
    if (!provider) {
      missing.push('CODEH_PROVIDER');
    }

    const model = await this.get('CODEH_MODEL');
    if (!model) {
      missing.push('CODEH_MODEL');
    }

    const baseUrl = await this.get('CODEH_BASE_URL');
    if (!baseUrl) {
      missing.push('CODEH_BASE_URL');
    }

    const apiKey = await this.get('CODEH_API_KEY');
    // Ollama doesn't require API key
    if (!apiKey && provider !== 'ollama') {
      missing.push('CODEH_API_KEY');
    }

    return missing;
  }

  async getAllEnvVars(): Promise<Record<string, string | undefined>> {
    const result: Record<string, string | undefined> = {};
    this.envVars.forEach((key) => {
      result[key] = process.env[key];
    });
    return result;
  }
}
