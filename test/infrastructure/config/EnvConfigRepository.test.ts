/**
 * Tests for EnvConfigRepository
 * Coverage target: 95%
 */

import test from 'ava';
import {EnvConfigRepository} from '../../../dist/infrastructure/config/EnvConfigRepository.js';

// ===========================
// Test Setup & Helpers
// ===========================

// Helper to restore env vars after each test
const originalEnv = {...process.env};

test.beforeEach(() => {
	// Clear relevant env vars before each test
	delete process.env.CODEH_PROVIDER;
	delete process.env.CODEH_MODEL;
	delete process.env.CODEH_BASE_URL;
	delete process.env.CODEH_API_KEY;
	delete process.env.CODEH_MAX_TOKEN;
	delete process.env.CODEH_TEMPERATURE;
	delete process.env.CODEH_LOGGING;
});

test.afterEach(() => {
	// Restore original env vars
	process.env = {...originalEnv};
});

// ===========================
// Basic CRUD Operations
// ===========================

test.serial('get returns undefined for missing key', async (t) => {
	const repo = new EnvConfigRepository();
	const value = await repo.get('CODEH_NON_EXISTENT');
	t.is(value, undefined);
});

test.serial('get returns value for existing key', async (t) => {
	process.env.CODEH_TEST_KEY = 'test-value';
	const repo = new EnvConfigRepository();
	const value = await repo.get('CODEH_TEST_KEY');
	t.is(value, 'test-value');
	delete process.env.CODEH_TEST_KEY;
});

test.serial('set updates environment variable', async (t) => {
	const repo = new EnvConfigRepository();
	await repo.set('CODEH_TEST_SET', 'new-value');
	t.is(process.env.CODEH_TEST_SET, 'new-value');
	delete process.env.CODEH_TEST_SET;
});

test.serial('delete removes environment variable', async (t) => {
	process.env.CODEH_TEST_DELETE = 'to-delete';
	const repo = new EnvConfigRepository();
	await repo.delete('CODEH_TEST_DELETE');
	t.is(process.env.CODEH_TEST_DELETE, undefined);
});

test.serial('exists returns true when provider is set', async (t) => {
	process.env.CODEH_PROVIDER = 'anthropic';
	const repo = new EnvConfigRepository();
	const exists = await repo.exists();
	t.true(exists);
});

test.serial('exists returns false when provider is missing', async (t) => {
	const repo = new EnvConfigRepository();
	const exists = await repo.exists();
	t.false(exists);
});

// ===========================
// Config Retrieval
// ===========================

test.serial('getAll returns null when no provider set', async (t) => {
	const repo = new EnvConfigRepository();
	const config = await repo.getAll();
	t.is(config, null);
});

test.serial('getAll returns full config object', async (t) => {
	process.env.CODEH_PROVIDER = 'anthropic';
	process.env.CODEH_MODEL = 'claude-3';
	process.env.CODEH_BASE_URL = 'https://api.anthropic.com';
	process.env.CODEH_API_KEY = 'sk-test';
	process.env.CODEH_MAX_TOKEN = '2048';
	process.env.CODEH_TEMPERATURE = '0.5';

	const repo = new EnvConfigRepository();
	const config = await repo.getAll();

	t.truthy(config);
	t.is(config?.provider, 'anthropic');
	t.is(config?.model, 'claude-3');
	t.is(config?.baseUrl, 'https://api.anthropic.com');
	t.is(config?.apiKey, 'sk-test');
	t.is(config?.maxTokens, 2048);
	t.is(config?.temperature, 0.5);
});

test.serial('getAll uses default values for missing optional fields', async (t) => {
	process.env.CODEH_PROVIDER = 'openai';
	
	const repo = new EnvConfigRepository();
	const config = await repo.getAll();

	t.truthy(config);
	t.is(config?.provider, 'openai');
	t.is(config?.model, '');
	t.is(config?.maxTokens, 4096); // Default
	t.is(config?.temperature, 0.7); // Default
});

// ===========================
// Helper Methods
// ===========================

test.serial('getMaxTokens parses integer correctly', async (t) => {
	process.env.CODEH_MAX_TOKEN = '1000';
	// We need provider to get config back via getAll
	process.env.CODEH_PROVIDER = 'test';
	
	const repo = new EnvConfigRepository();
	// Access private method via any cast or public getAll
	const config = await repo.getAll();
	t.is(config?.maxTokens, 1000);
});

test.serial('getMaxTokens handles invalid integer', async (t) => {
	process.env.CODEH_MAX_TOKEN = 'invalid';
	process.env.CODEH_PROVIDER = 'test';
	const repo = new EnvConfigRepository();
	const config = await repo.getAll();
	t.is(config?.maxTokens, 4096); // Default
});

test.serial('getTemperature parses float correctly', async (t) => {
	process.env.CODEH_TEMPERATURE = '0.1';
	process.env.CODEH_PROVIDER = 'test';
	const repo = new EnvConfigRepository();
	const config = await repo.getAll();
	t.is(config?.temperature, 0.1);
});

test.serial('getTemperature handles invalid float', async (t) => {
	process.env.CODEH_TEMPERATURE = 'invalid';
	process.env.CODEH_PROVIDER = 'test';
	const repo = new EnvConfigRepository();
	const config = await repo.getAll();
	t.is(config?.temperature, 0.7); // Default
});

// ===========================
// Validation
// ===========================

test.serial('validate returns missing fields', async (t) => {
	const repo = new EnvConfigRepository();
	const missing = await repo.validate();
	
	t.true(missing.includes('CODEH_PROVIDER'));
	t.true(missing.includes('CODEH_MODEL'));
	// Base URL is optional in some contexts but validated here
	t.true(missing.includes('CODEH_BASE_URL'));
	t.true(missing.includes('CODEH_API_KEY'));
});

test.serial('validate passes with all fields', async (t) => {
	process.env.CODEH_PROVIDER = 'anthropic';
	process.env.CODEH_MODEL = 'claude-3';
	process.env.CODEH_BASE_URL = 'https://api.anthropic.com';
	process.env.CODEH_API_KEY = 'sk-test';

	const repo = new EnvConfigRepository();
	const missing = await repo.validate();
	
	t.is(missing.length, 0);
});

test.serial('validate allows missing API key for ollama', async (t) => {
	process.env.CODEH_PROVIDER = 'ollama';
	process.env.CODEH_MODEL = 'llama2';
	process.env.CODEH_BASE_URL = 'http://localhost:11434';
	// No API key

	const repo = new EnvConfigRepository();
	const missing = await repo.validate();
	
	t.false(missing.includes('CODEH_API_KEY'));
});

// ===========================
// Bulk Operations
// ===========================

test.serial('getAllEnvVars returns all set variables', async (t) => {
	process.env.CODEH_PROVIDER = 'test';
	process.env.CODEH_MODEL = 'test-model';

	const repo = new EnvConfigRepository();
	const vars = await repo.getAllEnvVars();

	t.is(vars['CODEH_PROVIDER'], 'test');
	t.is(vars['CODEH_MODEL'], 'test-model');
	t.is(vars['CODEH_API_KEY'], undefined);
});

test.serial('clear removes all CODEH variables', async (t) => {
	process.env.CODEH_PROVIDER = 'test';
	process.env.CODEH_MODEL = 'test-model';
	process.env.OTHER_VAR = 'keep-me';

	const repo = new EnvConfigRepository();
	await repo.clear();

	t.is(process.env.CODEH_PROVIDER, undefined);
	t.is(process.env.CODEH_MODEL, undefined);
	t.is(process.env.OTHER_VAR, 'keep-me');
});
