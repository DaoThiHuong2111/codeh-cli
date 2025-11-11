/**
 * Integration tests for Tool Registry with Symbol Tools
 */

import test from 'ava';
import {setupContainer} from '../../source/core/di/setup';
import {ToolRegistry} from '../../source/core/tools/base/ToolRegistry';
import {promises as fs} from 'fs';
import * as path from 'path';

// Test project
const TEST_PROJECT_ROOT = path.join(
	process.cwd(),
	'test/fixtures/registry-integration',
);
const TEST_FILE = 'source/sample.ts';

// Setup test project
test.before(async () => {
	await fs.mkdir(path.join(TEST_PROJECT_ROOT, 'source'), {recursive: true});

	// Create sample TypeScript file
	const sampleCode = `
export class UserService {
	private users: User[] = [];

	addUser(user: User): void {
		this.users.push(user);
	}

	getUsers(): User[] {
		return this.users;
	}
}

export interface User {
	id: number;
	name: string;
}

export function createDefaultUser(): User {
	return {id: 1, name: 'Default'};
}
`;

	await fs.writeFile(path.join(TEST_PROJECT_ROOT, TEST_FILE), sampleCode);

	// Create tsconfig.json
	const tsConfig = {
		compilerOptions: {
			target: 'ES2020',
			module: 'ESNext',
			moduleResolution: 'node',
			esModuleInterop: true,
		},
		include: ['source/**/*'],
	};

	await fs.writeFile(
		path.join(TEST_PROJECT_ROOT, 'tsconfig.json'),
		JSON.stringify(tsConfig, null, 2),
	);

	// Set project root for tools
	process.env.CODEH_PROJECT_ROOT = TEST_PROJECT_ROOT;
});

// Cleanup
test.after.always(async () => {
	await fs.rm(TEST_PROJECT_ROOT, {recursive: true, force: true});
	delete process.env.CODEH_PROJECT_ROOT;
});

// ============================================
// ToolRegistry Integration Tests
// ============================================

test('ToolRegistry: should have all symbol tools registered', async t => {
	const container = await setupContainer();
	const registry = container.resolve<ToolRegistry>('ToolRegistry');

	t.true(registry.has('symbol_search'));
	t.true(registry.has('find_references'));
	t.true(registry.has('get_symbols_overview'));
});

test('ToolRegistry: should execute get_symbols_overview via registry', async t => {
	const container = await setupContainer();
	const registry = container.resolve<ToolRegistry>('ToolRegistry');

	const result = await registry.execute('get_symbols_overview', {
		filePath: TEST_FILE,
	});

	t.true(result.success);
	t.truthy(result.output);
	t.true(result.output!.includes('UserService'));
	t.true(result.output!.includes('createDefaultUser'));
});

test('ToolRegistry: should execute symbol_search via registry', async t => {
	const container = await setupContainer();
	const registry = container.resolve<ToolRegistry>('ToolRegistry');

	const result = await registry.execute('symbol_search', {
		namePattern: 'UserService',
		filePath: TEST_FILE,
	});

	t.true(result.success);
	t.truthy(result.output);
	t.true(result.output!.includes('UserService'));
	t.is(result.metadata?.count, 1);
});

test('ToolRegistry: should search with substring matching', async t => {
	const container = await setupContainer();
	const registry = container.resolve<ToolRegistry>('ToolRegistry');

	const result = await registry.execute('symbol_search', {
		namePattern: 'User',
		substringMatching: true,
	});

	t.true(result.success);
	const count = result.metadata?.count || 0;
	t.true(count >= 2); // UserService and User interface
});

test('ToolRegistry: should search for method with name path', async t => {
	const container = await setupContainer();
	const registry = container.resolve<ToolRegistry>('ToolRegistry');

	const result = await registry.execute('symbol_search', {
		namePattern: 'UserService/addUser',
		filePath: TEST_FILE,
		includeBody: true,
	});

	t.true(result.success);
	t.truthy(result.metadata?.symbols);
	const symbols = result.metadata.symbols;

	if (symbols.length > 0) {
		t.is(symbols[0].name, 'addUser');
		t.truthy(symbols[0].body);
	}
});

test('ToolRegistry: should execute find_references via registry', async t => {
	const container = await setupContainer();
	const registry = container.resolve<ToolRegistry>('ToolRegistry');

	const result = await registry.execute('find_references', {
		namePath: 'createDefaultUser',
		filePath: TEST_FILE,
	});

	// Should succeed even if no references found
	t.true(result.success);
	t.truthy(result.output);
});

test('ToolRegistry: should get all tool definitions', async t => {
	const container = await setupContainer();
	const registry = container.resolve<ToolRegistry>('ToolRegistry');

	const definitions = registry.getDefinitions();

	t.true(Array.isArray(definitions));
	t.true(definitions.length >= 5); // Shell, FileOps, + 3 Symbol tools

	// Check symbol tools are present
	const toolNames = definitions.map(d => d.name);
	t.true(toolNames.includes('symbol_search'));
	t.true(toolNames.includes('find_references'));
	t.true(toolNames.includes('get_symbols_overview'));
});

test('ToolRegistry: should handle invalid tool name', async t => {
	const container = await setupContainer();
	const registry = container.resolve<ToolRegistry>('ToolRegistry');

	const result = await registry.execute('non_existent_tool', {});

	t.false(result.success);
	t.truthy(result.error);
	t.true(result.error!.includes('not found'));
});

test('ToolRegistry: should handle invalid parameters', async t => {
	const container = await setupContainer();
	const registry = container.resolve<ToolRegistry>('ToolRegistry');

	const result = await registry.execute('symbol_search', {
		// Missing required 'namePattern'
	});

	t.false(result.success);
	t.truthy(result.error);
	t.true(result.error!.includes('Invalid parameters'));
});

test('ToolRegistry: should handle tool execution errors gracefully', async t => {
	const container = await setupContainer();
	const registry = container.resolve<ToolRegistry>('ToolRegistry');

	const result = await registry.execute('get_symbols_overview', {
		filePath: 'non-existent-file.ts',
	});

	t.false(result.success);
	t.truthy(result.error);
});

// ============================================
// Multi-tool Workflow Tests
// ============================================

test('Workflow: get overview → search symbol → find references', async t => {
	const container = await setupContainer();
	const registry = container.resolve<ToolRegistry>('ToolRegistry');

	// Step 1: Get overview
	const overviewResult = await registry.execute('get_symbols_overview', {
		filePath: TEST_FILE,
	});

	t.true(overviewResult.success);
	const symbols = overviewResult.metadata?.symbols || [];
	t.true(symbols.length > 0);

	// Step 2: Search for first symbol with body
	const firstSymbol = symbols[0];
	const searchResult = await registry.execute('symbol_search', {
		namePattern: firstSymbol.name,
		filePath: TEST_FILE,
		includeBody: true,
	});

	t.true(searchResult.success);

	// Step 3: Find references
	const foundSymbols = searchResult.metadata?.symbols || [];
	if (foundSymbols.length > 0) {
		const refResult = await registry.execute('find_references', {
			namePath: foundSymbols[0].namePath,
			filePath: TEST_FILE,
		});

		t.true(refResult.success);
	}
});

test('Workflow: search all classes then find their methods', async t => {
	const container = await setupContainer();
	const registry = container.resolve<ToolRegistry>('ToolRegistry');

	// Find all classes
	const classResult = await registry.execute('symbol_search', {
		namePattern: '',
		substringMatching: true,
	});

	t.true(classResult.success);
	const symbols = classResult.metadata?.symbols || [];
	const classes = symbols.filter((s: any) => s.kind === 5); // Class kind

	// For each class, find methods
	for (const cls of classes) {
		const methodsResult = await registry.execute('symbol_search', {
			namePattern: cls.name,
			depth: 1, // Include children
		});

		t.true(methodsResult.success);
	}
});

// ============================================
// Performance Tests
// ============================================

test('Performance: repeated calls should be fast', async t => {
	const container = await setupContainer();
	const registry = container.resolve<ToolRegistry>('ToolRegistry');

	// First call (may be slower - initializes analyzer)
	const start1 = Date.now();
	await registry.execute('get_symbols_overview', {filePath: TEST_FILE});
	const duration1 = Date.now() - start1;

	// Second call (should be faster - reuses analyzer)
	const start2 = Date.now();
	await registry.execute('get_symbols_overview', {filePath: TEST_FILE});
	const duration2 = Date.now() - start2;

	// Third call
	const start3 = Date.now();
	await registry.execute('get_symbols_overview', {filePath: TEST_FILE});
	const duration3 = Date.now() - start3;

	// Subsequent calls should be reasonably fast
	t.true(duration2 < duration1 * 2); // At most 2x slower
	t.true(duration3 < 1000); // Less than 1 second

	t.pass();
});

// ============================================
// Container Tests
// ============================================

test('Container: should resolve ToolRegistry as singleton', async t => {
	const container = await setupContainer();

	const registry1 = container.resolve<ToolRegistry>('ToolRegistry');
	const registry2 = container.resolve<ToolRegistry>('ToolRegistry');

	// Should be same instance (singleton)
	t.is(registry1, registry2);
});

test('Container: tools should have correct project root', async t => {
	const container = await setupContainer();
	const registry = container.resolve<ToolRegistry>('ToolRegistry');

	// Execute tool and verify it works with test project
	const result = await registry.execute('get_symbols_overview', {
		filePath: TEST_FILE,
	});

	t.true(result.success);
	t.true(result.output!.includes('UserService'));
});
