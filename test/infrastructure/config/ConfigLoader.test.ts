/**
 * Tests for ConfigLoader
 * Coverage target: 95%
 */

import test from 'ava';
import sinon from 'sinon';
import {ConfigLoader} from '../../../dist/infrastructure/config/ConfigLoader.js';
import {EnvConfigRepository} from '../../../dist/infrastructure/config/EnvConfigRepository.js';
import {FileConfigRepository} from '../../../dist/infrastructure/config/FileConfigRepository.js';
import {Configuration} from '../../../dist/core/domain/models/Configuration.js';
import type {ConfigData} from '../../../dist/core/domain/interfaces/IConfigRepository.js';

// ===========================
// Test Setup & Helpers
// ===========================

// Subclass to expose private repositories for mocking
class TestConfigLoader extends ConfigLoader {
	constructor() {
		super();
		// We need to replace the internal repositories with mocks
		// Since they are private, we use 'any' casting or define them as protected in source if possible
		// But here we can just overwrite them
		(this as any).envRepo = new EnvConfigRepository();
		(this as any).fileRepo = new FileConfigRepository();
	}

	get envRepoMock(): sinon.SinonStubbedInstance<EnvConfigRepository> {
		return (this as any).envRepo;
	}

	get fileRepoMock(): sinon.SinonStubbedInstance<FileConfigRepository> {
		return (this as any).fileRepo;
	}
}

// Helper to create a loader with stubbed repositories
function createTestLoader() {
	const loader = new TestConfigLoader();
	
	// Stub all methods of the repositories
	sinon.stub(loader.envRepoMock, 'getAll');
	sinon.stub(loader.envRepoMock, 'exists');
	sinon.stub(loader.envRepoMock, 'get');
	
	sinon.stub(loader.fileRepoMock, 'getAll');
	sinon.stub(loader.fileRepoMock, 'exists');
	sinon.stub(loader.fileRepoMock, 'addCustomModel');
	sinon.stub(loader.fileRepoMock, 'clear');
	
	return loader;
}

// ===========================
// Load Priority Tests
// ===========================

test('load returns null when no config exists', async (t) => {
	const loader = createTestLoader();
	
	loader.envRepoMock.getAll.resolves(null);
	loader.fileRepoMock.getAll.resolves(null);
	
	const config = await loader.load();
	
	t.is(config, null);
});

test('load prioritizes env config over file config', async (t) => {
	const loader = createTestLoader();
	
	const envConfig: ConfigData = {
		provider: 'anthropic',
		model: 'env-model',
		apiKey: 'env-key'
	};
	
	const fileConfig: ConfigData = {
		provider: 'openai',
		model: 'file-model',
		apiKey: 'file-key'
	};
	
	loader.envRepoMock.getAll.resolves(envConfig);
	loader.fileRepoMock.getAll.resolves(fileConfig);
	
	const config = await loader.load();
	
	t.truthy(config);
	t.is(config?.provider, 'anthropic');
	t.is(config?.model, 'env-model');
	t.is(config?.apiKey, 'env-key');
});

test('load falls back to file config when env is missing', async (t) => {
	const loader = createTestLoader();
	
	const fileConfig: ConfigData = {
		provider: 'openai',
		model: 'file-model',
		apiKey: 'file-key'
	};
	
	loader.envRepoMock.getAll.resolves(null);
	loader.fileRepoMock.getAll.resolves(fileConfig);
	
	const config = await loader.load();
	
	t.truthy(config);
	t.is(config?.provider, 'openai');
	t.is(config?.model, 'file-model');
});

// ===========================
// Merging Logic Tests
// ===========================

test('mergeConfigs combines env and file config', async (t) => {
	const loader = createTestLoader();
	
	const envConfig: ConfigData = {
		provider: 'anthropic',
		model: 'env-model',
		// Missing apiKey
	};
	
	const fileConfig: ConfigData = {
		provider: 'openai',
		model: 'file-model',
		apiKey: 'file-key'
	};
	
	loader.envRepoMock.getAll.resolves(envConfig);
	loader.fileRepoMock.getAll.resolves(fileConfig);
	
	const merged = await loader.mergeConfigs();
	
	t.truthy(merged);
	t.is(merged?.provider, 'anthropic'); // Env priority
	t.is(merged?.model, 'env-model'); // Env priority
	t.is(merged?.apiKey, 'file-key'); // Fallback to file config
});

test('mergeConfigs handles partial env config correctly', async (t) => {
	const loader = createTestLoader();
	
	// Env only provides API key
	const envConfig: any = {
		apiKey: 'env-key'
	};
	
	const fileConfig: ConfigData = {
		provider: 'openai',
		model: 'file-model',
		apiKey: 'file-key',
		maxTokens: 1000
	};
	
	loader.envRepoMock.getAll.resolves(envConfig);
	loader.fileRepoMock.getAll.resolves(fileConfig);
	
	const merged = await loader.mergeConfigs();
	
	t.truthy(merged);
	t.is(merged?.provider, 'openai'); // From file
	t.is(merged?.model, 'file-model'); // From file
	t.is(merged?.apiKey, 'env-key'); // From env (override)
	t.is(merged?.maxTokens, 1000); // From file
});

// ===========================
// Validation Tests
// ===========================

test('validate returns valid result for correct config', async (t) => {
	const loader = createTestLoader();
	
	const validConfig: ConfigData = {
		provider: 'anthropic',
		model: 'claude-3',
		apiKey: 'sk-test'
	};
	
	loader.envRepoMock.getAll.resolves(validConfig);
	loader.fileRepoMock.getAll.resolves(null);
	
	const result = await loader.validate();
	
	t.true(result.valid);
	t.is(result.errors.length, 0);
});

test('validate returns errors for missing required fields', async (t) => {
	const loader = createTestLoader();
	
	const invalidConfig: ConfigData = {
		provider: 'anthropic',
		model: '', // Missing model
		apiKey: '' // Missing API key
	};
	
	loader.envRepoMock.getAll.resolves(invalidConfig);
	loader.fileRepoMock.getAll.resolves(null);
	
	const result = await loader.validate();
	
	t.false(result.valid);
	t.true(result.errors.length > 0);
});

test('validate returns error when no config exists', async (t) => {
	const loader = createTestLoader();
	
	loader.envRepoMock.getAll.resolves(null);
	loader.fileRepoMock.getAll.resolves(null);
	
	const result = await loader.validate();
	
	t.false(result.valid);
	t.true(result.errors.includes('No configuration found'));
});

// ===========================
// Status & Operations Tests
// ===========================

test('getStatus reports correct source status', async (t) => {
	const loader = createTestLoader();
	
	loader.envRepoMock.exists.resolves(true);
	loader.fileRepoMock.exists.resolves(false);
	loader.envRepoMock.getAll.resolves({
		provider: 'anthropic',
		model: 'claude'
	} as any);
	loader.fileRepoMock.getAll.resolves(null);
	
	const status = await loader.getStatus();
	
	t.true(status.hasEnvConfig);
	t.false(status.hasFileConfig);
	t.true(status.hasConfig);
	t.is(status.provider, 'anthropic');
});

test('save delegates to file repository', async (t) => {
	const loader = createTestLoader();
	
	loader.fileRepoMock.addCustomModel.resolves();
	
	const config = Configuration.create({
		provider: 'openai',
		model: 'gpt-4',
		apiKey: 'sk-test'
	});
	
	await loader.save(config);
	
	t.true(loader.fileRepoMock.addCustomModel.calledOnce);
	const args = loader.fileRepoMock.addCustomModel.firstCall.args[0];
	t.is(args.provider, 'openai');
	t.is(args.model, 'gpt-4');
});

test('clear delegates to file repository', async (t) => {
	const loader = createTestLoader();
	
	loader.fileRepoMock.clear.resolves();
	
	await loader.clear();
	
	t.true(loader.fileRepoMock.clear.calledOnce);
});

test('exists returns true if either repo has config', async (t) => {
	const loader = createTestLoader();
	
	loader.envRepoMock.exists.resolves(false);
	loader.fileRepoMock.exists.resolves(true);
	
	const exists = await loader.exists();
	
	t.true(exists);
});
