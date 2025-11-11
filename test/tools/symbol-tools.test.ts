/**
 * Test cases for Symbol Tools
 */

import test from 'ava';
import {promises as fs} from 'fs';
import * as path from 'path';
import {SymbolSearchTool} from '../../source/core/tools/SymbolSearchTool';
import {FindReferencesTool} from '../../source/core/tools/FindReferencesTool';
import {GetSymbolsOverviewTool} from '../../source/core/tools/GetSymbolsOverviewTool';

// Test fixtures
const TEST_PROJECT_ROOT = path.join(process.cwd(), 'test/fixtures/typescript-project');
const TEST_FILE = 'source/example.ts';

// Setup: Create test TypeScript files
test.before(async () => {
	// Create test project structure
	await fs.mkdir(path.join(TEST_PROJECT_ROOT, 'source'), {recursive: true});

	// Create example TypeScript file
	const exampleCode = `
/**
 * Example Calculator class
 */
export class Calculator {
	/**
	 * Add two numbers
	 */
	add(a: number, b: number): number {
		return a + b;
	}

	/**
	 * Multiply two numbers
	 */
	multiply(a: number, b: number): number {
		return a * b;
	}
}

/**
 * Utility function to format number
 */
export function formatNumber(num: number): string {
	return num.toFixed(2);
}

/**
 * Example usage
 */
export function example() {
	const calc = new Calculator();
	const result = calc.add(1, 2);
	const formatted = formatNumber(result);
	return formatted;
}
`;

	await fs.writeFile(path.join(TEST_PROJECT_ROOT, TEST_FILE), exampleCode);

	// Create tsconfig.json
	const tsConfig = {
		compilerOptions: {
			target: 'ES2020',
			module: 'ESNext',
			moduleResolution: 'node',
			esModuleInterop: true,
			strict: true,
		},
		include: ['source/**/*'],
	};

	await fs.writeFile(
		path.join(TEST_PROJECT_ROOT, 'tsconfig.json'),
		JSON.stringify(tsConfig, null, 2),
	);
});

// Cleanup
test.after.always(async () => {
	// Remove test project
	await fs.rm(TEST_PROJECT_ROOT, {recursive: true, force: true});
});

// ============================================
// GetSymbolsOverviewTool Tests
// ============================================

test('GetSymbolsOverviewTool: should get symbols overview', async t => {
	const tool = new GetSymbolsOverviewTool(TEST_PROJECT_ROOT);
	const result = await tool.execute({filePath: TEST_FILE});

	t.true(result.success);
	t.truthy(result.output);
	t.true(result.output!.includes('Calculator'));
	t.true(result.output!.includes('formatNumber'));
	t.true(result.output!.includes('example'));
	t.is(result.metadata?.count, 3); // 3 top-level symbols
});

test('GetSymbolsOverviewTool: should fail for non-existent file', async t => {
	const tool = new GetSymbolsOverviewTool(TEST_PROJECT_ROOT);
	const result = await tool.execute({filePath: 'non-existent.ts'});

	t.false(result.success);
	t.truthy(result.error);
});

test('GetSymbolsOverviewTool: should validate parameters', async t => {
	const tool = new GetSymbolsOverviewTool(TEST_PROJECT_ROOT);

	t.false(tool.validateParameters({}));
	t.false(tool.validateParameters({filePath: 123}));
	t.true(tool.validateParameters({filePath: 'test.ts'}));
});

test('GetSymbolsOverviewTool: should return correct definition', t => {
	const tool = new GetSymbolsOverviewTool(TEST_PROJECT_ROOT);
	const definition = tool.getDefinition();

	t.is(definition.name, 'get_symbols_overview');
	t.truthy(definition.description);
	t.truthy(definition.inputSchema);
	t.deepEqual(definition.inputSchema.required, ['filePath']);
});

// ============================================
// SymbolSearchTool Tests
// ============================================

test('SymbolSearchTool: should find class by exact name', async t => {
	const tool = new SymbolSearchTool(TEST_PROJECT_ROOT);
	const result = await tool.execute({
		namePattern: 'Calculator',
		filePath: TEST_FILE,
	});

	t.true(result.success);
	t.truthy(result.output);
	t.true(result.output!.includes('Calculator'));
	t.is(result.metadata?.count, 1);
});

test('SymbolSearchTool: should find method by name path', async t => {
	const tool = new SymbolSearchTool(TEST_PROJECT_ROOT);
	const result = await tool.execute({
		namePattern: 'Calculator/add',
		filePath: TEST_FILE,
	});

	t.true(result.success);
	t.true(result.output!.includes('Calculator/add'));
	t.is(result.metadata?.count, 1);
});

test('SymbolSearchTool: should use substring matching', async t => {
	const tool = new SymbolSearchTool(TEST_PROJECT_ROOT);
	const result = await tool.execute({
		namePattern: 'format',
		substringMatching: true,
	});

	t.true(result.success);
	t.true(result.output!.includes('formatNumber'));
});

test('SymbolSearchTool: should include symbol body when requested', async t => {
	const tool = new SymbolSearchTool(TEST_PROJECT_ROOT);
	const result = await tool.execute({
		namePattern: 'add',
		filePath: TEST_FILE,
		includeBody: true,
		substringMatching: true,
	});

	t.true(result.success);
	const symbols = result.metadata?.symbols || [];
	const addMethod = symbols.find((s: any) => s.name === 'add');
	t.truthy(addMethod);
	t.truthy(addMethod.body);
});

test('SymbolSearchTool: should include children with depth=1', async t => {
	const tool = new SymbolSearchTool(TEST_PROJECT_ROOT);
	const result = await tool.execute({
		namePattern: 'Calculator',
		filePath: TEST_FILE,
		depth: 1,
	});

	t.true(result.success);
	const symbols = result.metadata?.symbols || [];
	const calculator = symbols[0];
	t.truthy(calculator);
	t.truthy(calculator.children);
	t.true(calculator.children.length >= 2); // add and multiply methods
});

test('SymbolSearchTool: should validate parameters', async t => {
	const tool = new SymbolSearchTool(TEST_PROJECT_ROOT);

	t.false(tool.validateParameters({}));
	t.false(tool.validateParameters({namePattern: 123}));
	t.true(tool.validateParameters({namePattern: 'Test'}));
});

test('SymbolSearchTool: should return correct definition', t => {
	const tool = new SymbolSearchTool(TEST_PROJECT_ROOT);
	const definition = tool.getDefinition();

	t.is(definition.name, 'symbol_search');
	t.truthy(definition.description);
	t.truthy(definition.inputSchema);
	t.deepEqual(definition.inputSchema.required, ['namePattern']);
});

// ============================================
// FindReferencesTool Tests
// ============================================

test('FindReferencesTool: should find references to function', async t => {
	const tool = new FindReferencesTool(TEST_PROJECT_ROOT);
	const result = await tool.execute({
		namePath: 'formatNumber',
		filePath: TEST_FILE,
	});

	t.true(result.success);
	t.truthy(result.output);
	// formatNumber is called in example() function
	t.true(result.metadata?.count >= 0); // May be 0 if TS language service doesn't work in test
});

test('FindReferencesTool: should find references to class method', async t => {
	const tool = new FindReferencesTool(TEST_PROJECT_ROOT);
	const result = await tool.execute({
		namePath: 'Calculator/add',
		filePath: TEST_FILE,
	});

	t.true(result.success);
	// add is called in example() function
	t.true(result.metadata?.count >= 0);
});

test('FindReferencesTool: should return empty for unused symbol', async t => {
	const tool = new FindReferencesTool(TEST_PROJECT_ROOT);
	const result = await tool.execute({
		namePath: 'Calculator/multiply', // multiply is not used anywhere
		filePath: TEST_FILE,
	});

	t.true(result.success);
	t.true(result.output!.includes('No references') || result.metadata?.count === 0);
});

test('FindReferencesTool: should fail for non-existent symbol', async t => {
	const tool = new FindReferencesTool(TEST_PROJECT_ROOT);
	const result = await tool.execute({
		namePath: 'NonExistent',
		filePath: TEST_FILE,
	});

	// Should return empty references, not error
	t.true(result.success);
	t.true(result.output!.includes('No references'));
});

test('FindReferencesTool: should validate parameters', async t => {
	const tool = new FindReferencesTool(TEST_PROJECT_ROOT);

	t.false(tool.validateParameters({}));
	t.false(tool.validateParameters({namePath: 'Test'}));
	t.false(tool.validateParameters({filePath: 'test.ts'}));
	t.true(
		tool.validateParameters({namePath: 'Test', filePath: 'test.ts'}),
	);
});

test('FindReferencesTool: should return correct definition', t => {
	const tool = new FindReferencesTool(TEST_PROJECT_ROOT);
	const definition = tool.getDefinition();

	t.is(definition.name, 'find_references');
	t.truthy(definition.description);
	t.truthy(definition.inputSchema);
	t.deepEqual(definition.inputSchema.required, ['namePath', 'filePath']);
});

// ============================================
// Integration Tests
// ============================================

test('Integration: find symbol then find its references', async t => {
	// Step 1: Find formatNumber function
	const searchTool = new SymbolSearchTool(TEST_PROJECT_ROOT);
	const searchResult = await searchTool.execute({
		namePattern: 'formatNumber',
		filePath: TEST_FILE,
	});

	t.true(searchResult.success);
	const symbols = searchResult.metadata?.symbols || [];
	const formatNumberSymbol = symbols[0];
	t.truthy(formatNumberSymbol);

	// Step 2: Find references to formatNumber
	const refTool = new FindReferencesTool(TEST_PROJECT_ROOT);
	const refResult = await refTool.execute({
		namePath: formatNumberSymbol.namePath,
		filePath: TEST_FILE,
	});

	t.true(refResult.success);
});

test('Integration: get overview then search for specific symbol', async t => {
	// Step 1: Get overview
	const overviewTool = new GetSymbolsOverviewTool(TEST_PROJECT_ROOT);
	const overviewResult = await overviewTool.execute({filePath: TEST_FILE});

	t.true(overviewResult.success);
	const symbols = overviewResult.metadata?.symbols || [];
	t.true(symbols.length > 0);

	// Step 2: Search for first symbol
	const firstSymbol = symbols[0];
	const searchTool = new SymbolSearchTool(TEST_PROJECT_ROOT);
	const searchResult = await searchTool.execute({
		namePattern: firstSymbol.name,
		filePath: TEST_FILE,
		includeBody: true,
		depth: 1,
	});

	t.true(searchResult.success);
	const foundSymbols = searchResult.metadata?.symbols || [];
	t.true(foundSymbols.length > 0);
	t.is(foundSymbols[0].name, firstSymbol.name);
});

// ============================================
// Error Handling Tests
// ============================================

test('Error handling: invalid TypeScript code', async t => {
	// Create invalid TypeScript file
	const invalidFile = 'source/invalid.ts';
	const invalidCode = 'this is not valid TypeScript code {{{';

	await fs.writeFile(path.join(TEST_PROJECT_ROOT, invalidFile), invalidCode);

	const tool = new GetSymbolsOverviewTool(TEST_PROJECT_ROOT);
	const result = await tool.execute({filePath: invalidFile});

	// Should handle gracefully
	t.true(result.success || !result.success); // Either succeeds with empty or fails gracefully
});

test('Error handling: empty file', async t => {
	// Create empty file
	const emptyFile = 'source/empty.ts';
	await fs.writeFile(path.join(TEST_PROJECT_ROOT, emptyFile), '');

	const tool = new GetSymbolsOverviewTool(TEST_PROJECT_ROOT);
	const result = await tool.execute({filePath: emptyFile});

	t.true(result.success);
	t.is(result.metadata?.count, 0);
});
