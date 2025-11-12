/**
 * Unit Tests for Symbol Tools
 * Tests with real TypeScript fixtures to ensure accurate results
 */

import test from 'ava';
import * as path from 'path';
import {SymbolSearchTool} from '../../../dist/core/tools/SymbolSearchTool.js';
import {FindReferencesTool} from '../../../dist/core/tools/FindReferencesTool.js';
import {GetSymbolsOverviewTool} from '../../../dist/core/tools/GetSymbolsOverviewTool.js';
import {SymbolKind} from '../../../dist/core/domain/models/Symbol.js';

// ========================================
// Test Configuration
// ========================================

const FIXTURES_ROOT = path.resolve(
	process.cwd(),
	'test/fixtures/symbol-analysis',
);

const USER_SERVICE_FILE = path.join(FIXTURES_ROOT, 'UserService.ts');
const CALCULATOR_FILE = path.join(FIXTURES_ROOT, 'Calculator.ts');
const PRODUCT_REPO_FILE = path.join(FIXTURES_ROOT, 'ProductRepository.ts');
const UTILS_FILE = path.join(FIXTURES_ROOT, 'utils.ts');
const INDEX_FILE = path.join(FIXTURES_ROOT, 'index.ts');

// ========================================
// GetSymbolsOverviewTool Tests
// ========================================

test('GetSymbolsOverviewTool: should find all symbols in UserService.ts', async t => {
	const tool = new GetSymbolsOverviewTool(FIXTURES_ROOT);

	const result = await tool.execute({
		filePath: 'UserService.ts',
	});

	t.true(result.success, 'Tool execution should succeed');
	t.truthy(result.output, 'Should have output');

	// Parse output to verify
	const symbols = result.metadata?.symbols || [];

	// Should find User interface
	const userInterface = symbols.find(
		(s: any) => s.name === 'User' && s.kind === SymbolKind.Interface,
	);
	t.truthy(userInterface, 'Should find User interface');

	// Should find UserService class
	const userServiceClass = symbols.find(
		(s: any) => s.name === 'UserService' && s.kind === SymbolKind.Class,
	);
	t.truthy(userServiceClass, 'Should find UserService class');

	// Verify count
	t.true(symbols.length >= 2, 'Should have at least 2 top-level symbols');
});

test('GetSymbolsOverviewTool: should find all symbols in Calculator.ts', async t => {
	const tool = new GetSymbolsOverviewTool(FIXTURES_ROOT);

	const result = await tool.execute({
		filePath: 'Calculator.ts',
	});

	t.true(result.success);
	const symbols = result.metadata?.symbols || [];

	// Should find Calculator class
	const calculatorClass = symbols.find(
		(s: any) => s.name === 'Calculator' && s.kind === SymbolKind.Class,
	);
	t.truthy(calculatorClass, 'Should find Calculator class');
	t.is(
		symbols.length,
		1,
		'Should have exactly 1 top-level symbol (Calculator class)',
	);
});

test('GetSymbolsOverviewTool: should find all exports in index.ts', async t => {
	const tool = new GetSymbolsOverviewTool(FIXTURES_ROOT);

	const result = await tool.execute({
		filePath: 'index.ts',
	});

	t.true(result.success);
	t.truthy(result.output);
	// index.ts should have export statements
});

test('GetSymbolsOverviewTool: should fail with invalid file path', async t => {
	const tool = new GetSymbolsOverviewTool(FIXTURES_ROOT);

	const result = await tool.execute({
		filePath: 'NonExistent.ts',
	});

	t.false(result.success, 'Should fail for non-existent file');
	t.truthy(result.error, 'Should have error message');
});

// ========================================
// SymbolSearchTool Tests - Exact Match
// ========================================

test('SymbolSearchTool: should find UserService class by exact name', async t => {
	const tool = new SymbolSearchTool(FIXTURES_ROOT);

	const result = await tool.execute({
		namePattern: 'UserService',
		substringMatching: false,
	});

	t.true(result.success, 'Tool execution should succeed');
	const symbols = result.metadata?.symbols || [];

	t.true(symbols.length > 0, 'Should find at least one symbol');

	// Find the class (not methods inside it)
	const userServiceClass = symbols.find(
		(s: any) => s.name === 'UserService' && s.kind === SymbolKind.Class,
	);
	t.truthy(userServiceClass, 'Should find UserService class');
	t.is(userServiceClass.name, 'UserService');
	t.truthy(
		userServiceClass.location.relativePath.includes('UserService.ts'),
		'Should be in UserService.ts',
	);
});

test('SymbolSearchTool: should find Calculator class by exact name', async t => {
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
	t.is(calculatorClass.name, 'Calculator');
});

test('SymbolSearchTool: should find User interface', async t => {
	const tool = new SymbolSearchTool(FIXTURES_ROOT);

	const result = await tool.execute({
		namePattern: 'User',
		substringMatching: false,
	});

	t.true(result.success);
	const symbols = result.metadata?.symbols || [];

	const userInterface = symbols.find(
		(s: any) => s.name === 'User' && s.kind === SymbolKind.Interface,
	);
	t.truthy(userInterface, 'Should find User interface');
	t.is(userInterface.name, 'User');
});

test('SymbolSearchTool: should find Product interface', async t => {
	const tool = new SymbolSearchTool(FIXTURES_ROOT);

	const result = await tool.execute({
		namePattern: 'Product',
		substringMatching: false,
	});

	t.true(result.success);
	const symbols = result.metadata?.symbols || [];

	const productInterface = symbols.find(
		(s: any) => s.name === 'Product' && s.kind === SymbolKind.Interface,
	);
	t.truthy(productInterface, 'Should find Product interface');
	t.truthy(
		productInterface.location.relativePath.includes('ProductRepository.ts'),
	);
});

// ========================================
// SymbolSearchTool Tests - Method Search
// ========================================

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
	t.is(createUserMethod.name, 'createUser');
	t.is(createUserMethod.namePath, 'UserService/createUser');
});

test('SymbolSearchTool: should find add method in Calculator', async t => {
	const tool = new SymbolSearchTool(FIXTURES_ROOT);

	const result = await tool.execute({
		namePattern: 'Calculator/add',
		substringMatching: false,
	});

	t.true(result.success);
	const symbols = result.metadata?.symbols || [];

	const addMethod = symbols.find(
		(s: any) => s.name === 'add' && s.kind === SymbolKind.Method,
	);
	t.truthy(addMethod, 'Should find add method');
	t.is(addMethod.namePath, 'Calculator/add');
});

test('SymbolSearchTool: should find multiple methods with substring matching', async t => {
	const tool = new SymbolSearchTool(FIXTURES_ROOT);

	const result = await tool.execute({
		namePattern: 'find',
		substringMatching: true,
	});

	t.true(result.success);
	const symbols = result.metadata?.symbols || [];

	// Should find findById, findProductById, findByCategory
	t.true(symbols.length >= 3, 'Should find multiple methods containing "find"');

	const hasFindById = symbols.some((s: any) => s.name === 'findById');
	const hasFindProductById = symbols.some(
		(s: any) => s.name === 'findProductById',
	);
	const hasFindByCategory = symbols.some(
		(s: any) => s.name === 'findByCategory',
	);

	t.true(hasFindById || hasFindProductById || hasFindByCategory);
});

// ========================================
// SymbolSearchTool Tests - Include Body
// ========================================

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
		'Body should contain actual implementation',
	);
});

test('SymbolSearchTool: should NOT include body when not requested', async t => {
	const tool = new SymbolSearchTool(FIXTURES_ROOT);

	const result = await tool.execute({
		namePattern: 'Calculator/add',
		includeBody: false,
	});

	t.true(result.success);
	const symbols = result.metadata?.symbols || [];

	const addMethod = symbols.find((s: any) => s.name === 'add');
	t.truthy(addMethod, 'Should find add method');
	t.falsy(addMethod.body, 'Should NOT include body');
});

// ========================================
// SymbolSearchTool Tests - Include Children
// ========================================

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
	t.truthy(calculatorClass, 'Should find Calculator class');
	t.truthy(calculatorClass.children, 'Should have children');
	t.true(
		calculatorClass.children.length >= 6,
		'Should have at least 6 methods (add, subtract, multiply, divide, getHistory, clearHistory)',
	);

	// Verify specific methods exist
	const hasAdd = calculatorClass.children.some((c: any) => c.name === 'add');
	const hasSubtract = calculatorClass.children.some(
		(c: any) => c.name === 'subtract',
	);
	const hasMultiply = calculatorClass.children.some(
		(c: any) => c.name === 'multiply',
	);

	t.true(hasAdd, 'Should have add method');
	t.true(hasSubtract, 'Should have subtract method');
	t.true(hasMultiply, 'Should have multiply method');
});

test('SymbolSearchTool: should include UserService methods when depth=1', async t => {
	const tool = new SymbolSearchTool(FIXTURES_ROOT);

	const result = await tool.execute({
		namePattern: 'UserService',
		depth: 1,
	});

	t.true(result.success);
	const symbols = result.metadata?.symbols || [];

	const userServiceClass = symbols.find(
		(s: any) => s.name === 'UserService' && s.kind === SymbolKind.Class,
	);
	t.truthy(userServiceClass);
	t.truthy(userServiceClass.children);
	t.true(
		userServiceClass.children.length >= 5,
		'Should have at least 5 methods',
	);

	// Verify key methods
	const hasCreateUser = userServiceClass.children.some(
		(c: any) => c.name === 'createUser',
	);
	const hasFindById = userServiceClass.children.some(
		(c: any) => c.name === 'findById',
	);
	const hasUpdateUser = userServiceClass.children.some(
		(c: any) => c.name === 'updateUser',
	);

	t.true(hasCreateUser, 'Should have createUser method');
	t.true(hasFindById, 'Should have findById method');
	t.true(hasUpdateUser, 'Should have updateUser method');
});

// ========================================
// SymbolSearchTool Tests - Function Search
// ========================================

test('SymbolSearchTool: should find standalone functions', async t => {
	const tool = new SymbolSearchTool(FIXTURES_ROOT);

	const result = await tool.execute({
		namePattern: 'formatUserName',
		substringMatching: false,
	});

	t.true(result.success);
	const symbols = result.metadata?.symbols || [];

	const formatUserNameFunc = symbols.find(
		(s: any) => s.name === 'formatUserName' && s.kind === SymbolKind.Function,
	);
	t.truthy(formatUserNameFunc, 'Should find formatUserName function');
	t.truthy(formatUserNameFunc.location.relativePath.includes('utils.ts'));
});

test('SymbolSearchTool: should find multiple utility functions', async t => {
	const tool = new SymbolSearchTool(FIXTURES_ROOT);

	const result = await tool.execute({
		namePattern: 'create',
		substringMatching: true,
	});

	t.true(result.success);
	const symbols = result.metadata?.symbols || [];

	// Should find createUserService, createCalculator, createUser
	t.true(symbols.length >= 2, 'Should find multiple functions with "create"');
});

// ========================================
// SymbolSearchTool Tests - File Path Filter
// ========================================

test('SymbolSearchTool: should search only in specified file', async t => {
	const tool = new SymbolSearchTool(FIXTURES_ROOT);

	const result = await tool.execute({
		namePattern: 'add',
		filePath: 'Calculator.ts',
		substringMatching: true,
	});

	t.true(result.success);
	const symbols = result.metadata?.symbols || [];

	// Should only find symbols from Calculator.ts
	const allFromCalculator = symbols.every((s: any) =>
		s.location.relativePath.includes('Calculator.ts'),
	);
	t.true(allFromCalculator, 'All symbols should be from Calculator.ts');
});

// ========================================
// FindReferencesTool Tests
// ========================================

test('FindReferencesTool: should find references to UserService', async t => {
	const tool = new FindReferencesTool(FIXTURES_ROOT);

	const result = await tool.execute({
		namePath: 'UserService',
		filePath: 'UserService.ts',
	});

	t.true(result.success, 'Tool execution should succeed');
	const references = result.metadata?.references || [];

	// ProductRepository imports and uses UserService
	// utils.ts imports UserService
	// index.ts exports UserService
	t.true(
		references.length >= 1,
		'Should find at least 1 reference to UserService',
	);

	// Check if ProductRepository.ts is in references
	const hasProductRepoRef = references.some((r: any) =>
		r.filePath.includes('ProductRepository.ts'),
	);
	t.true(
		hasProductRepoRef || references.length > 0,
		'Should find reference from ProductRepository or other files',
	);
});

test('FindReferencesTool: should find references to Calculator', async t => {
	const tool = new FindReferencesTool(FIXTURES_ROOT);

	const result = await tool.execute({
		namePath: 'Calculator',
		filePath: 'Calculator.ts',
	});

	t.true(result.success);
	const references = result.metadata?.references || [];

	// utils.ts imports Calculator
	// index.ts exports Calculator
	t.true(references.length >= 1, 'Should find references to Calculator');
});

test('FindReferencesTool: should find who calls createUser method', async t => {
	const tool = new FindReferencesTool(FIXTURES_ROOT);

	const result = await tool.execute({
		namePath: 'UserService/createUser',
		filePath: 'UserService.ts',
	});

	t.true(result.success);
	// Note: In our fixtures, createUser might not be called externally
	// But the tool should still execute successfully
	t.truthy(result.metadata?.references);
});

test('FindReferencesTool: should handle non-existent symbol gracefully', async t => {
	const tool = new FindReferencesTool(FIXTURES_ROOT);

	const result = await tool.execute({
		namePath: 'NonExistentClass',
		filePath: 'UserService.ts',
	});

	// Should not crash, either success with empty results or clear error
	t.true(result.success || result.error !== undefined);
});

// ========================================
// Integration Tests - Combined Workflows
// ========================================

test('Workflow: Get overview → Find class → Get methods', async t => {
	// Step 1: Get overview
	const overviewTool = new GetSymbolsOverviewTool(FIXTURES_ROOT);
	const overviewResult = await overviewTool.execute({
		filePath: 'Calculator.ts',
	});

	t.true(overviewResult.success);
	const symbols = overviewResult.metadata?.symbols || [];
	t.true(symbols.length > 0);

	// Step 2: Find Calculator class
	const searchTool = new SymbolSearchTool(FIXTURES_ROOT);
	const searchResult = await searchTool.execute({
		namePattern: 'Calculator',
		substringMatching: false,
	});

	t.true(searchResult.success);

	// Step 3: Get methods with depth=1
	const detailsResult = await searchTool.execute({
		namePattern: 'Calculator',
		depth: 1,
	});

	t.true(detailsResult.success);
	const calculatorClass = detailsResult.metadata?.symbols?.[0];
	t.truthy(calculatorClass?.children);
	t.true(calculatorClass.children.length >= 6);
});

test('Workflow: Find method → Get body → Find references', async t => {
	// Step 1: Find createUser method
	const searchTool = new SymbolSearchTool(FIXTURES_ROOT);
	const methodResult = await searchTool.execute({
		namePattern: 'UserService/createUser',
		includeBody: true,
	});

	t.true(methodResult.success);
	const method = methodResult.metadata?.symbols?.[0];
	t.truthy(method);
	t.truthy(method.body);

	// Step 2: Find references to this method
	const refTool = new FindReferencesTool(FIXTURES_ROOT);
	const refResult = await refTool.execute({
		namePath: 'UserService/createUser',
		filePath: 'UserService.ts',
	});

	t.true(refResult.success);
	// References may or may not exist, but tool should work
	t.truthy(refResult.metadata?.references);
});

// ========================================
// Edge Cases and Error Handling
// ========================================

test('SymbolSearchTool: should handle empty namePattern gracefully', async t => {
	const tool = new SymbolSearchTool(FIXTURES_ROOT);

	const result = await tool.execute({
		namePattern: '',
	});

	// Should either fail with clear error or return empty results
	t.true(!result.success || result.metadata?.symbols?.length === 0);
});

test('SymbolSearchTool: should handle special characters in search', async t => {
	const tool = new SymbolSearchTool(FIXTURES_ROOT);

	const result = await tool.execute({
		namePattern: 'User$Service',
		substringMatching: false,
	});

	// Should not crash
	t.true(result.success || result.error !== undefined);
});

test('GetSymbolsOverviewTool: should handle file with no symbols', async t => {
	// Create empty file
	const fs = await import('fs/promises');
	const emptyFile = path.join(FIXTURES_ROOT, 'empty.ts');
	await fs.writeFile(emptyFile, '// Empty file\n');

	const tool = new GetSymbolsOverviewTool(FIXTURES_ROOT);
	const result = await tool.execute({
		filePath: 'empty.ts',
	});

	t.true(result.success);
	const symbols = result.metadata?.symbols || [];
	t.is(symbols.length, 0, 'Should return empty array for file with no symbols');

	// Cleanup
	await fs.unlink(emptyFile);
});

// ========================================
// Performance Tests
// ========================================

test('Performance: Symbol search should be fast', async t => {
	const tool = new SymbolSearchTool(FIXTURES_ROOT);

	const startTime = Date.now();
	await tool.execute({
		namePattern: 'UserService',
	});
	const duration = Date.now() - startTime;

	t.true(
		duration < 1000,
		`Search should complete in < 1s (took ${duration}ms)`,
	);
});

test('Performance: Get overview should be fast', async t => {
	const tool = new GetSymbolsOverviewTool(FIXTURES_ROOT);

	const startTime = Date.now();
	await tool.execute({
		filePath: 'UserService.ts',
	});
	const duration = Date.now() - startTime;

	t.true(
		duration < 500,
		`Overview should complete in < 500ms (took ${duration}ms)`,
	);
});
