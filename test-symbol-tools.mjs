/**
 * Simple integration test for Symbol Tools
 * Runs directly without test framework
 */

import * as path from 'path';
import {fileURLToPath} from 'url';

// Get dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import from compiled dist
const {SymbolSearchTool} = await import('./dist/core/tools/SymbolSearchTool.js');
const {FindReferencesTool} = await import('./dist/core/tools/FindReferencesTool.js');
const {GetSymbolsOverviewTool} = await import('./dist/core/tools/GetSymbolsOverviewTool.js');
const {SymbolKind} = await import('./dist/core/domain/models/Symbol.js');

const FIXTURES_ROOT = path.join(__dirname, 'test/fixtures/symbol-analysis');

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
	if (!condition) {
		console.error(` FAIL: ${message}`);
		testsFailed++;
		return false;
	}
	console.log(`✅ PASS: ${message}`);
	testsPassed++;
	return true;
}

async function test(name, fn) {
	console.log(`\n🧪 Test: ${name}`);
	try {
		await fn();
	} catch (error) {
		console.error(` ERROR in "${name}":`, error.message);
		testsFailed++;
	}
}

// ========================================
// Tests
// ========================================

await test('GetSymbolsOverviewTool: should find symbols in UserService.ts', async () => {
	const tool = new GetSymbolsOverviewTool(FIXTURES_ROOT);
	const result = await tool.execute({filePath: 'UserService.ts'});

	assert(result.success, 'Tool execution should succeed');
	assert(result.output, 'Should have output');

	const symbols = result.metadata?.symbols || [];
	assert(symbols.length >= 2, `Should find at least 2 symbols, got ${symbols.length}`);

	const hasUserInterface = symbols.some(s => s.name === 'User' && s.kind === SymbolKind.Interface);
	assert(hasUserInterface, 'Should find User interface');

	const hasUserServiceClass = symbols.some(s => s.name === 'UserService' && s.kind === SymbolKind.Class);
	assert(hasUserServiceClass, 'Should find UserService class');
});

await test('SymbolSearchTool: should find UserService class by exact name', async () => {
	const tool = new SymbolSearchTool(FIXTURES_ROOT);
	const result = await tool.execute({
		namePattern: 'UserService',
		substringMatching: false,
	});

	assert(result.success, 'Tool should succeed');

	const symbols = result.metadata?.symbols || [];
	const userServiceClass = symbols.find(s => s.name === 'UserService' && s.kind === SymbolKind.Class);

	assert(userServiceClass, 'Should find UserService class');
	assert(userServiceClass.name === 'UserService', 'Class name should be UserService');
	assert(userServiceClass.location.relativePath.includes('UserService.ts'), 'Should be in UserService.ts');
});

await test('SymbolSearchTool: should find Calculator class', async () => {
	const tool = new SymbolSearchTool(FIXTURES_ROOT);
	const result = await tool.execute({
		namePattern: 'Calculator',
		substringMatching: false,
	});

	assert(result.success, 'Tool should succeed');

	const symbols = result.metadata?.symbols || [];
	const calculatorClass = symbols.find(s => s.name === 'Calculator' && s.kind === SymbolKind.Class);

	assert(calculatorClass, 'Should find Calculator class');
	assert(calculatorClass.name === 'Calculator', 'Class name should be Calculator');
});

await test('SymbolSearchTool: should find createUser method by name path', async () => {
	const tool = new SymbolSearchTool(FIXTURES_ROOT);
	const result = await tool.execute({
		namePattern: 'UserService/createUser',
		substringMatching: false,
	});

	assert(result.success, 'Tool should succeed');

	const symbols = result.metadata?.symbols || [];
	const createUserMethod = symbols.find(s => s.name === 'createUser' && s.kind === SymbolKind.Method);

	assert(createUserMethod, 'Should find createUser method');
	assert(createUserMethod.namePath === 'UserService/createUser', 'Name path should match');
});

await test('SymbolSearchTool: should include method body when requested', async () => {
	const tool = new SymbolSearchTool(FIXTURES_ROOT);
	const result = await tool.execute({
		namePattern: 'Calculator/add',
		includeBody: true,
	});

	assert(result.success, 'Tool should succeed');

	const symbols = result.metadata?.symbols || [];
	const addMethod = symbols.find(s => s.name === 'add');

	assert(addMethod, 'Should find add method');
	assert(addMethod.body, 'Should include body');
	assert(addMethod.body.includes('a + b'), 'Body should contain implementation code');
});

await test('SymbolSearchTool: should NOT include body when not requested', async () => {
	const tool = new SymbolSearchTool(FIXTURES_ROOT);
	const result = await tool.execute({
		namePattern: 'Calculator/add',
		includeBody: false,
	});

	assert(result.success, 'Tool should succeed');

	const symbols = result.metadata?.symbols || [];
	const addMethod = symbols.find(s => s.name === 'add');

	assert(addMethod, 'Should find add method');
	assert(!addMethod.body, 'Should NOT include body when not requested');
});

await test('SymbolSearchTool: should include class methods when depth=1', async () => {
	const tool = new SymbolSearchTool(FIXTURES_ROOT);
	const result = await tool.execute({
		namePattern: 'Calculator',
		depth: 1,
	});

	assert(result.success, 'Tool should succeed');

	const symbols = result.metadata?.symbols || [];
	const calculatorClass = symbols.find(s => s.name === 'Calculator' && s.kind === SymbolKind.Class);

	assert(calculatorClass, 'Should find Calculator class');
	assert(calculatorClass.children, 'Should have children');
	assert(calculatorClass.children.length >= 6, `Should have at least 6 methods, got ${calculatorClass.children.length}`);

	const methodNames = calculatorClass.children.map(c => c.name);
	assert(methodNames.includes('add'), 'Should have add method');
	assert(methodNames.includes('subtract'), 'Should have subtract method');
	assert(methodNames.includes('multiply'), 'Should have multiply method');
	assert(methodNames.includes('divide'), 'Should have divide method');
});

await test('SymbolSearchTool: should find UserService methods when depth=1', async () => {
	const tool = new SymbolSearchTool(FIXTURES_ROOT);
	const result = await tool.execute({
		namePattern: 'UserService',
		depth: 1,
	});

	assert(result.success, 'Tool should succeed');

	const symbols = result.metadata?.symbols || [];
	const userServiceClass = symbols.find(s => s.name === 'UserService' && s.kind === SymbolKind.Class);

	assert(userServiceClass, 'Should find UserService class');
	assert(userServiceClass.children, 'Should have children');
	assert(userServiceClass.children.length >= 5, `Should have at least 5 methods, got ${userServiceClass.children.length}`);

	const methodNames = userServiceClass.children.map(c => c.name);
	assert(methodNames.includes('createUser'), 'Should have createUser method');
	assert(methodNames.includes('findById'), 'Should have findById method');
	assert(methodNames.includes('updateUser'), 'Should have updateUser method');
});

await test('SymbolSearchTool: should find methods with substring matching', async () => {
	const tool = new SymbolSearchTool(FIXTURES_ROOT);
	const result = await tool.execute({
		namePattern: 'find',
		substringMatching: true,
	});

	assert(result.success, 'Tool should succeed');

	const symbols = result.metadata?.symbols || [];
	assert(symbols.length >= 2, `Should find multiple "find*" methods, got ${symbols.length}`);
});

await test('SymbolSearchTool: should find standalone functions', async () => {
	const tool = new SymbolSearchTool(FIXTURES_ROOT);
	const result = await tool.execute({
		namePattern: 'formatUserName',
		substringMatching: false,
	});

	assert(result.success, 'Tool should succeed');

	const symbols = result.metadata?.symbols || [];
	const formatUserNameFunc = symbols.find(s => s.name === 'formatUserName' && s.kind === SymbolKind.Function);

	assert(formatUserNameFunc, 'Should find formatUserName function');
	assert(formatUserNameFunc.location.relativePath.includes('utils.ts'), 'Should be in utils.ts');
});

await test('FindReferencesTool: should execute successfully', async () => {
	const tool = new FindReferencesTool(FIXTURES_ROOT);
	const result = await tool.execute({
		namePath: 'UserService',
		filePath: 'UserService.ts',
	});

	assert(result.success, 'Tool should execute successfully');
	assert(result.metadata !== undefined, 'Should have metadata');
});

// ========================================
// Summary
// ========================================

console.log('\n' + '='.repeat(50));
console.log(`\n📊 Test Results:`);
console.log(`   ✅ Passed: ${testsPassed}`);
console.log(`    Failed: ${testsFailed}`);
console.log(`   📈 Total:  ${testsPassed + testsFailed}`);

if (testsFailed === 0) {
	console.log(`\n🎉 All tests passed!\n`);
	process.exit(0);
} else {
	console.log(`\n💥 Some tests failed!\n`);
	process.exit(1);
}
