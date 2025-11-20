/**
 * Tests for FileConfigRepository
 * Coverage target: 95%
 */

import test from 'ava';
import {FileConfigRepository} from '../../../dist/infrastructure/config/FileConfigRepository.js';
import {join} from 'path';
import {tmpdir} from 'os';
import {mkdtempSync, rmSync, writeFileSync, existsSync, readFileSync} from 'fs';
import type {ConfigData} from '../../../dist/core/domain/interfaces/IConfigRepository.js';

// ===========================
// Test Setup & Helpers
// ===========================

// Helper to create a temp config file
function createTempConfig(content?: any): string {
	const dir = mkdtempSync(join(tmpdir(), 'codeh-test-'));
	const file = join(dir, 'configs.json');
	if (content) {
		writeFileSync(file, JSON.stringify(content));
	}
	return file;
}

// Helper to cleanup temp config file
function cleanupTempConfig(file: string) {
	const dir = join(file, '..');
	if (existsSync(dir)) {
		rmSync(dir, {recursive: true, force: true});
	}
}

// ===========================
// Initialization Tests
// ===========================

test('creates config directory if not exists', (t) => {
	const dir = mkdtempSync(join(tmpdir(), 'codeh-test-init-'));
	const file = join(dir, 'subdir', 'configs.json');
	
	// Ensure subdir doesn't exist
	rmSync(dir, {recursive: true, force: true});
	
	new FileConfigRepository(file);
	
	// Check if directory was created (parent of file)
	// Note: The constructor calls loadConfig which creates the dir
	t.true(existsSync(join(file, '..')));
	
	cleanupTempConfig(file);
});

test('loads existing config file', (t) => {
	const content = {
		custom_models: [
			{
				provider: 'anthropic',
				model: 'claude-3',
				api_key: 'test-key'
			}
		]
	};
	const file = createTempConfig(content);
	
	const repo = new FileConfigRepository(file);
	const configPath = repo.getConfigPath();
	
	t.is(configPath, file);
	
	cleanupTempConfig(file);
});

test('handles missing config file gracefully', async (t) => {
	const dir = mkdtempSync(join(tmpdir(), 'codeh-test-missing-'));
	const file = join(dir, 'configs.json');
	
	const repo = new FileConfigRepository(file);
	const models = await repo.getCustomModels();
	
	t.deepEqual(models, []);
	
	cleanupTempConfig(file);
});

test('handles corrupted config file', async (t) => {
	const dir = mkdtempSync(join(tmpdir(), 'codeh-test-corrupt-'));
	const file = join(dir, 'configs.json');
	writeFileSync(file, '{ invalid json ');
	
	const repo = new FileConfigRepository(file);
	const models = await repo.getCustomModels();
	
	// Should return empty array on error
	t.deepEqual(models, []);
	
	cleanupTempConfig(file);
});

// ===========================
// CRUD Operations
// ===========================

test('set and get config values', async (t) => {
	const file = createTempConfig({});
	const repo = new FileConfigRepository(file);
	
	await repo.set('custom_models.0.provider', 'openai');
	const value = await repo.get('custom_models.0.provider');
	
	t.is(value, 'openai');
	
	// Verify file content
	const content = JSON.parse(readFileSync(file, 'utf8'));
	t.is(content.custom_models[0].provider, 'openai');
	
	cleanupTempConfig(file);
});

test('get returns undefined for missing key', async (t) => {
	const file = createTempConfig({});
	const repo = new FileConfigRepository(file);
	
	const value = await repo.get('non.existent.key');
	t.is(value, undefined);
	
	cleanupTempConfig(file);
});

test('delete removes config key', async (t) => {
	const content = {
		some: {
			deep: {
				key: 'value'
			}
		}
	};
	const file = createTempConfig(content);
	const repo = new FileConfigRepository(file);
	
	await repo.delete('some.deep.key');
	const value = await repo.get('some.deep.key');
	
	t.is(value, undefined);
	
	// Verify file content
	const newContent = JSON.parse(readFileSync(file, 'utf8'));
	t.is(newContent.some.deep.key, undefined);
	
	cleanupTempConfig(file);
});

test('clear removes all configuration', async (t) => {
	const content = {
		custom_models: [{provider: 'test', model: 'test'}],
		other: 'data'
	};
	const file = createTempConfig(content);
	const repo = new FileConfigRepository(file);
	
	await repo.clear();
	
	const models = await repo.getCustomModels();
	t.is(models.length, 0);
	
	// Verify file content is reset
	const newContent = JSON.parse(readFileSync(file, 'utf8'));
	t.deepEqual(newContent, {custom_models: []});
	
	cleanupTempConfig(file);
});

// ===========================
// Custom Models Management
// ===========================

test('addCustomModel adds new model', async (t) => {
	const file = createTempConfig({});
	const repo = new FileConfigRepository(file);
	
	const model: ConfigData = {
		provider: 'anthropic',
		model: 'claude-3-opus',
		apiKey: 'sk-test',
		maxTokens: 1000,
		temperature: 0.5
	};
	
	await repo.addCustomModel(model);
	
	const models = await repo.getCustomModels();
	t.is(models.length, 1);
	t.is(models[0].provider, 'anthropic');
	t.is(models[0].model, 'claude-3-opus');
	
	cleanupTempConfig(file);
});

test('removeCustomModel removes model by index', async (t) => {
	const content = {
		custom_models: [
			{provider: 'p1', model: 'm1'},
			{provider: 'p2', model: 'm2'},
			{provider: 'p3', model: 'm3'}
		]
	};
	const file = createTempConfig(content);
	const repo = new FileConfigRepository(file);
	
	await repo.removeCustomModel(1); // Remove middle one
	
	const models = await repo.getCustomModels();
	t.is(models.length, 2);
	t.is(models[0].provider, 'p1');
	t.is(models[1].provider, 'p3');
	
	cleanupTempConfig(file);
});

test('removeCustomModel handles invalid index gracefully', async (t) => {
	const content = {
		custom_models: [{provider: 'p1', model: 'm1'}]
	};
	const file = createTempConfig(content);
	const repo = new FileConfigRepository(file);
	
	await repo.removeCustomModel(99); // Invalid index
	
	const models = await repo.getCustomModels();
	t.is(models.length, 1);
	
	cleanupTempConfig(file);
});

// ===========================
// Config Retrieval
// ===========================

test('getAll returns first custom model', async (t) => {
	const content = {
		custom_models: [
			{
				provider: 'openai',
				model: 'gpt-4',
				api_key: 'sk-gpt',
				max_tokens: 2000,
				temperature: 0.8
			},
			{
				provider: 'anthropic',
				model: 'claude'
			}
		]
	};
	const file = createTempConfig(content);
	const repo = new FileConfigRepository(file);
	
	const config = await repo.getAll();
	
	t.truthy(config);
	t.is(config?.provider, 'openai');
	t.is(config?.model, 'gpt-4');
	t.is(config?.apiKey, 'sk-gpt');
	t.is(config?.maxTokens, 2000);
	t.is(config?.temperature, 0.8);
	
	cleanupTempConfig(file);
});

test('getAll returns null if no models configured', async (t) => {
	const file = createTempConfig({custom_models: []});
	const repo = new FileConfigRepository(file);
	
	const config = await repo.getAll();
	t.is(config, null);
	
	cleanupTempConfig(file);
});

test('exists returns true if models configured', async (t) => {
	const content = {
		custom_models: [{provider: 'p1', model: 'm1'}]
	};
	const file = createTempConfig(content);
	const repo = new FileConfigRepository(file);
	
	const exists = await repo.exists();
	t.true(exists);
	
	cleanupTempConfig(file);
});

test('exists returns false if no models configured', async (t) => {
	const file = createTempConfig({custom_models: []});
	const repo = new FileConfigRepository(file);
	
	const exists = await repo.exists();
	t.false(exists);
	
	cleanupTempConfig(file);
});

// ===========================
// Bulk Operations
// ===========================

test('setMultiple updates multiple values', async (t) => {
	const file = createTempConfig({});
	const repo = new FileConfigRepository(file);
	
	await repo.setMultiple({
		'key1': 'value1',
		'nested.key2': 'value2'
	});
	
	const val1 = await repo.get('key1');
	const val2 = await repo.get('nested.key2');
	
	t.is(val1, 'value1');
	t.is(val2, 'value2');
	
	cleanupTempConfig(file);
});
