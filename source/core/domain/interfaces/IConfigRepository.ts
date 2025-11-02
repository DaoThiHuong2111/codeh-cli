/**
 * Interface for configuration storage
 */

export interface ConfigData {
  provider: 'anthropic' | 'openai' | 'ollama' | 'generic-chat-completion-api';
  model: string;
  baseUrl?: string;
  apiKey?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface IConfigRepository {
  /**
   * Get configuration value by key
   */
  get(key: string): Promise<string | undefined>;

  /**
   * Set configuration value
   */
  set(key: string, value: string): Promise<void>;

  /**
   * Get all configuration
   */
  getAll(): Promise<ConfigData>;

  /**
   * Check if configuration exists
   */
  exists(): Promise<boolean>;

  /**
   * Delete configuration
   */
  delete(key: string): Promise<void>;

  /**
   * Clear all configuration
   */
  clear(): Promise<void>;
}
