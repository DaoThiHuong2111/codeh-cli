/**
 * Unit Tests for Symbol Tools - Direct TypeScript Testing
 */

import test from 'ava';
import * as path from 'path';

// Import from source (TypeScript) instead of dist
import {SymbolSearchTool} from '../../../source/core/tools/SymbolSearchTool.ts';
import {FindReferencesTool} from '../../../source/core/tools/FindReferencesTool.ts';
import {GetSymbolsOverviewTool} from '../../../source/core/tools/GetSymbolsOverviewTool.ts';
import {SymbolKind} from '../../../source/core/domain/models/Symbol.ts';

const FIXTURES_ROOT = path.resolve(
	process.cwd(),
	'test/fixtures/symbol-analysis',
);

// ========================================
// Basic Sanity Tests
// ========================================

test('GetSymbolsOverviewTool: should find symbols in UserService.ts', async t => {
	const tool = new GetSymbolsOverviewTool(FIXTURES_ROOT);

	const result = await tool.execute({
		filePath: 'UserService.ts',
	});

	t.true(result.success, 'Tool execution should succeed');
	t.truthy(result.output, 'Should have output');

	const symbols = result.metadata?.symbols || [];
	t.true(
		symbols.length >= 2,
		'Should find at least 2 symbols (User interface + UserService class)',
	);

	// Verify User interface exists
	const hasUserInterface = symbols.some(
		(s: any) => s.name === 'User' && s.kind === SymbolKind.Interface,
	);
	t.true(hasUserInterface, 'Should find User interface');

	// Verify UserService class exists
	const hasUserServiceClass = symbols.some(
		(s: any) => s.name === 'UserService' && s.kind === SymbolKind.Class,
	);
	t.true(hasUserServiceClass, 'Should find UserService class');
});

test('SymbolSearchTool: should find UserService class by exact name', async t => {
	const tool = new SymbolSearchTool(FIXTURES_ROOT);

	const result = await tool.execute({
		namePattern: 'UserService',
		substringMatching: false,
	});

	t.true(result.success, 'Tool should succeed');
	const symbols = result.metadata?.symbols || [];

	const userServiceClass = symbols.find(
		(s: any) => s.name === 'UserService' && s.kind === SymbolKind.Class,
	);
	t.truthy(userServiceClass, 'Should find UserService class');
	t.is(userServiceClass.name, 'UserService');
});

test('SymbolSearchTool: should find Calculator class', async t => {
	const tool = new SymbolSearchTool(FIXTURES_ROOT);

	const result = await tool.execute({
		namePattern: 'Calculator',
		substringMatching: false,
	});

	t.true(result.success);
	const symbols = result.metadata?.symbols || [];

	const calculatorClass = symbols.find(
		(s: any) => s.name === 'Calculator' && s.kind === SymbolKind.Class,
	);
	t.truthy(calculatorClass, 'Should find Calculator class');
});

test('SymbolSearchTool: should find createUser method by name path', async t => {
	const tool = new SymbolSearchTool(FIXTURES_ROOT);

	const result = await tool.execute({
		namePattern: 'UserService/createUser',
		substringMatching: false,
	});

	t.true(result.success);
	const symbols = result.metadata?.symbols || [];

	const createUserMethod = symbols.find(
		(s: any) => s.name === 'createUser' && s.kind === SymbolKind.Method,
	);
	t.truthy(createUserMethod, 'Should find createUser method');
	t.is(createUserMethod.namePath, 'UserService/createUser');
});

test('SymbolSearchTool: should include method body when requested', async t => {
	const tool = new SymbolSearchTool(FIXTURES_ROOT);

	const result = await tool.execute({
		namePattern: 'Calculator/add',
		includeBody: true,
	});

	t.true(result.success);
	const symbols = result.metadata?.symbols || [];

	const addMethod = symbols.find((s: any) => s.name === 'add');
	t.truthy(addMethod, 'Should find add method');
	t.truthy(addMethod.body, 'Should include body');
	t.true(
		addMethod.body.includes('a + b'),
		'Body should contain implementation',
	);
});

test('SymbolSearchTool: should include class methods when depth=1', async t => {
	const tool = new SymbolSearchTool(FIXTURES_ROOT);

	const result = await tool.execute({
		namePattern: 'Calculator',
		depth: 1,
	});

	t.true(result.success);
	const symbols = result.metadata?.symbols || [];

	const calculatorClass = symbols.find(
		(s: any) => s.name === 'Calculator' && s.kind === SymbolKind.Class,
	);
	t.truthy(calculatorClass);
	t.truthy(calculatorClass.children, 'Should have children');
	t.true(
		calculatorClass.children.length >= 6,
		`Should have at least 6 methods, got ${calculatorClass.children.length}`,
	);

	// Verify key methods exist
	const methodNames = calculatorClass.children.map((c: any) => c.name);
	t.true(methodNames.includes('add'), 'Should have add method');
	t.true(methodNames.includes('subtract'), 'Should have subtract method');
	t.true(methodNames.includes('multiply'), 'Should have multiply method');
	t.true(methodNames.includes('divide'), 'Should have divide method');
});

test('SymbolSearchTool: should find methods with substring matching', async t => {
	const tool = new SymbolSearchTool(FIXTURES_ROOT);

	const result = await tool.execute({
		namePattern: 'find',
		substringMatching: true,
	});

	t.true(result.success);
	const symbols = result.metadata?.symbols || [];

	// Should find findById, findProductById, findByCategory
	t.true(
		symbols.length >= 2,
		`Should find multiple "find*" methods, got ${symbols.length}`,
	);
});

test('FindReferencesTool: should execute successfully', async t => {
	const tool = new FindReferencesTool(FIXTURES_ROOT);

	const result = await tool.execute({
		namePath: 'UserService',
		filePath: 'UserService.ts',
	});

	t.true(result.success, 'Tool should execute successfully');
	t.truthy(result.metadata, 'Should have metadata');
	// References may or may not exist, but tool should work
});

test('Performance: Symbol search should be fast', async t => {
	const tool = new SymbolSearchTool(FIXTURES_ROOT);

	const startTime = Date.now();
	await tool.execute({
		namePattern: 'UserService',
	});
	const duration = Date.now() - startTime;

	t.true(
		duration < 2000,
		`Search should complete in < 2s (took ${duration}ms)`,
	);
});
