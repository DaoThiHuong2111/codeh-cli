/**
 * Integration tests for Editing & File Operation Tools
 * Tests: FindFileTool, SearchForPatternTool, ReplaceRegexTool,
 *        ReplaceSymbolBodyTool, InsertBeforeSymbolTool, InsertAfterSymbolTool, RenameSymbolTool
 */

import * as path from 'path';
import * as fs from 'fs';
import {fileURLToPath} from 'url';

// Get dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import from compiled dist
const {FindFileTool} = await import('./dist/core/tools/FindFileTool.js');
const {SearchForPatternTool} = await import('./dist/core/tools/SearchForPatternTool.js');
const {ReplaceRegexTool} = await import('./dist/core/tools/ReplaceRegexTool.js');
const {ReplaceSymbolBodyTool} = await import('./dist/core/tools/ReplaceSymbolBodyTool.js');
const {InsertBeforeSymbolTool} = await import('./dist/core/tools/InsertBeforeSymbolTool.js');
const {InsertAfterSymbolTool} = await import('./dist/core/tools/InsertAfterSymbolTool.js');
const {RenameSymbolTool} = await import('./dist/core/tools/RenameSymbolTool.js');

const FIXTURES_ROOT = path.join(__dirname, 'test/fixtures/symbol-analysis');
const TEMP_TEST_DIR = path.join(__dirname, 'test/fixtures/temp-editing-tests');

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
		console.error(error.stack);
		testsFailed++;
	}
}

// Helper: Create temp directory for editing tests
function setupTempDir() {
	if (fs.existsSync(TEMP_TEST_DIR)) {
		fs.rmSync(TEMP_TEST_DIR, {recursive: true, force: true});
	}
	fs.mkdirSync(TEMP_TEST_DIR, {recursive: true});

	// Copy tsconfig.json so TypeScriptSymbolAnalyzer can parse files
	const tsconfigSource = path.join(FIXTURES_ROOT, 'tsconfig.json');
	const tsconfigDest = path.join(TEMP_TEST_DIR, 'tsconfig.json');
	fs.copyFileSync(tsconfigSource, tsconfigDest);
}

// Helper: Copy fixture file to temp dir
function copyFixtureToTemp(filename) {
	const source = path.join(FIXTURES_ROOT, filename);
	const dest = path.join(TEMP_TEST_DIR, filename);
	fs.copyFileSync(source, dest);
	return dest;
}

// Helper: Cleanup temp directory
function cleanupTempDir() {
	if (fs.existsSync(TEMP_TEST_DIR)) {
		fs.rmSync(TEMP_TEST_DIR, {recursive: true, force: true});
	}
}

// ========================================
// Tests - FindFileTool
// ========================================

await test('FindFileTool: should find TypeScript files', async () => {
	const tool = new FindFileTool(FIXTURES_ROOT);
	const result = await tool.execute({
		pattern: '*.ts',
	});

	assert(result.success, 'Tool should succeed');

	const files = result.metadata?.files || [];
	assert(files.length >= 4, `Should find at least 4 .ts files, got ${files.length}`);

	const hasUserService = files.some(f => f.includes('UserService.ts'));
	assert(hasUserService, 'Should find UserService.ts');

	const hasCalculator = files.some(f => f.includes('Calculator.ts'));
	assert(hasCalculator, 'Should find Calculator.ts');
});

await test('FindFileTool: should find files with wildcard pattern', async () => {
	const tool = new FindFileTool(FIXTURES_ROOT);
	const result = await tool.execute({
		pattern: 'User*.ts',
	});

	assert(result.success, 'Tool should succeed');

	const files = result.metadata?.files || [];
	assert(files.length >= 1, `Should find at least 1 User*.ts file, got ${files.length}`);
	assert(files[0].includes('UserService.ts'), 'Should find UserService.ts');
});

await test('FindFileTool: should respect maxResults limit', async () => {
	const tool = new FindFileTool(FIXTURES_ROOT);
	const result = await tool.execute({
		pattern: '*.ts',
		maxResults: 2,
	});

	assert(result.success, 'Tool should succeed');

	const files = result.metadata?.files || [];
	assert(files.length <= 2, `Should respect maxResults=2, got ${files.length}`);
});

await test('FindFileTool: should return no results for non-existent pattern', async () => {
	const tool = new FindFileTool(FIXTURES_ROOT);
	const result = await tool.execute({
		pattern: 'NonExistent*.xyz',
	});

	assert(result.success, 'Tool should succeed even with no matches');

	const found = result.metadata?.found || 0;
	assert(found === 0, 'Should find 0 files');
});

// ========================================
// Tests - SearchForPatternTool
// ========================================

await test('SearchForPatternTool: should find "class" keyword', async () => {
	const tool = new SearchForPatternTool(FIXTURES_ROOT);
	const result = await tool.execute({
		pattern: 'class\\s+\\w+',
	});

	assert(result.success, 'Tool should succeed');

	const found = result.metadata?.found || 0;
	assert(found >= 2, `Should find at least 2 class declarations, got ${found}`);
});

await test('SearchForPatternTool: should find specific method name', async () => {
	const tool = new SearchForPatternTool(FIXTURES_ROOT);
	const result = await tool.execute({
		pattern: 'createUser',
	});

	assert(result.success, 'Tool should succeed');

	const matches = result.metadata?.matches || [];
	assert(matches.length >= 1, `Should find createUser method, got ${matches.length}`);

	const hasUserServiceMatch = matches.some(m => m.file.includes('UserService.ts'));
	assert(hasUserServiceMatch, 'Should find createUser in UserService.ts');
});

await test('SearchForPatternTool: should filter by file pattern', async () => {
	const tool = new SearchForPatternTool(FIXTURES_ROOT);
	const result = await tool.execute({
		pattern: 'export',
		filePattern: 'User*.ts',
	});

	assert(result.success, 'Tool should succeed');

	const matches = result.metadata?.matches || [];
	const allFromUserService = matches.every(m => m.file.includes('UserService.ts'));
	assert(allFromUserService, 'All matches should be from UserService.ts');
});

await test('SearchForPatternTool: should respect maxResults', async () => {
	const tool = new SearchForPatternTool(FIXTURES_ROOT);
	const result = await tool.execute({
		pattern: 'function|method|class',
		maxResults: 3,
	});

	assert(result.success, 'Tool should succeed');

	const found = result.metadata?.found || 0;
	assert(found <= 3, `Should respect maxResults=3, got ${found}`);
});

// ========================================
// Tests - ReplaceRegexTool (với temp files)
// ========================================

await test('ReplaceRegexTool: should replace simple text', async () => {
	setupTempDir();
	copyFixtureToTemp('UserService.ts');

	const tool = new ReplaceRegexTool(TEMP_TEST_DIR);
	const result = await tool.execute({
		filePath: 'UserService.ts',
		pattern: 'User Service',
		replacement: 'User Manager',
	});

	assert(result.success, 'Tool should succeed');

	const matchesReplaced = result.metadata?.matchesReplaced || 0;
	assert(matchesReplaced >= 1, 'Should replace at least 1 match');

	// Verify file was actually modified
	const fileContent = fs.readFileSync(path.join(TEMP_TEST_DIR, 'UserService.ts'), 'utf8');
	assert(fileContent.includes('User Manager'), 'File should contain new text');
	assert(!fileContent.includes('User Service'), 'File should not contain old text');

	cleanupTempDir();
});

await test('ReplaceRegexTool: should use capture groups', async () => {
	setupTempDir();
	copyFixtureToTemp('UserService.ts');

	const tool = new ReplaceRegexTool(TEMP_TEST_DIR);
	const result = await tool.execute({
		filePath: 'UserService.ts',
		pattern: '(createUser|deleteUser)',
		replacement: 'handle_$1',
	});

	assert(result.success, 'Tool should succeed');

	const matchesReplaced = result.metadata?.matchesReplaced || 0;
	assert(matchesReplaced >= 2, `Should replace at least 2 matches, got ${matchesReplaced}`);

	// Verify replacements
	const fileContent = fs.readFileSync(path.join(TEMP_TEST_DIR, 'UserService.ts'), 'utf8');
	assert(fileContent.includes('handle_createUser'), 'Should have handle_createUser');
	assert(fileContent.includes('handle_deleteUser'), 'Should have handle_deleteUser');

	cleanupTempDir();
});

await test('ReplaceRegexTool: should return success with no matches', async () => {
	setupTempDir();
	copyFixtureToTemp('UserService.ts');

	const tool = new ReplaceRegexTool(TEMP_TEST_DIR);
	const result = await tool.execute({
		filePath: 'UserService.ts',
		pattern: 'NonExistentPattern12345',
		replacement: 'something',
	});

	assert(result.success, 'Tool should succeed even with no matches');

	const matchesFound = result.metadata?.matchesFound || 0;
	assert(matchesFound === 0, 'Should find 0 matches');

	cleanupTempDir();
});

// ========================================
// Tests - ReplaceSymbolBodyTool
// ========================================

await test('ReplaceSymbolBodyTool: should replace method body', async () => {
	setupTempDir();
	copyFixtureToTemp('UserService.ts');

	const tool = new ReplaceSymbolBodyTool(TEMP_TEST_DIR);
	const result = await tool.execute({
		namePath: 'UserService/generateId',
		filePath: 'UserService.ts',
		newBody: '\tprivate generateId(): string {\n\t\treturn \'fixed_id_123\';\n\t}',
	});

	assert(result.success, 'Tool should succeed');
	assert(result.metadata?.symbol === 'generateId', 'Should replace generateId method');

	// Verify file was modified
	const fileContent = fs.readFileSync(path.join(TEMP_TEST_DIR, 'UserService.ts'), 'utf8');
	assert(fileContent.includes('fixed_id_123'), 'Should have new implementation');
	assert(!fileContent.includes('Date.now()'), 'Should not have old implementation');

	cleanupTempDir();
});

await test('ReplaceSymbolBodyTool: should replace class method with complex body', async () => {
	setupTempDir();
	copyFixtureToTemp('Calculator.ts');

	const tool = new ReplaceSymbolBodyTool(TEMP_TEST_DIR);
	const newImplementation = `\tadd(a: number, b: number): number {
\t\t// New implementation with logging
\t\tconsole.log('Adding:', a, b);
\t\tconst result = a + b;
\t\tconsole.log('Result:', result);
\t\treturn result;
\t}`;

	const result = await tool.execute({
		namePath: 'Calculator/add',
		filePath: 'Calculator.ts',
		newBody: newImplementation,
	});

	assert(result.success, 'Tool should succeed');

	// Verify new implementation
	const fileContent = fs.readFileSync(path.join(TEMP_TEST_DIR, 'Calculator.ts'), 'utf8');
	assert(fileContent.includes('New implementation with logging'), 'Should have new comment');
	assert(fileContent.includes('console.log'), 'Should have logging statements');

	cleanupTempDir();
});

// ========================================
// Tests - InsertBeforeSymbolTool
// ========================================

await test('InsertBeforeSymbolTool: should insert before class', async () => {
	setupTempDir();
	copyFixtureToTemp('UserService.ts');

	const tool = new InsertBeforeSymbolTool(TEMP_TEST_DIR);
	const result = await tool.execute({
		namePath: 'UserService',
		filePath: 'UserService.ts',
		content: '// IMPORTANT: This class manages user operations\n',
	});

	assert(result.success, 'Tool should succeed');

	// Verify insertion
	const fileContent = fs.readFileSync(path.join(TEMP_TEST_DIR, 'UserService.ts'), 'utf8');
	const classIndex = fileContent.indexOf('export class UserService');
	const commentIndex = fileContent.indexOf('// IMPORTANT: This class manages user operations');

	assert(commentIndex !== -1, 'Should find inserted comment');
	assert(commentIndex < classIndex, 'Comment should be before class declaration');

	cleanupTempDir();
});

await test('InsertBeforeSymbolTool: should insert import before interface', async () => {
	setupTempDir();
	copyFixtureToTemp('UserService.ts');

	const tool = new InsertBeforeSymbolTool(TEMP_TEST_DIR);
	const result = await tool.execute({
		namePath: 'User',
		filePath: 'UserService.ts',
		content: 'import {Logger} from \'./logger\';\n',
	});

	assert(result.success, 'Tool should succeed');

	// Verify insertion
	const fileContent = fs.readFileSync(path.join(TEMP_TEST_DIR, 'UserService.ts'), 'utf8');
	assert(fileContent.includes('import {Logger}'), 'Should have import statement');

	const importIndex = fileContent.indexOf('import {Logger}');
	const interfaceIndex = fileContent.indexOf('export interface User');
	assert(importIndex < interfaceIndex, 'Import should be before interface');

	cleanupTempDir();
});

// ========================================
// Tests - InsertAfterSymbolTool
// ========================================

await test('InsertAfterSymbolTool: should insert after method', async () => {
	setupTempDir();
	copyFixtureToTemp('UserService.ts');

	const tool = new InsertAfterSymbolTool(TEMP_TEST_DIR);
	const result = await tool.execute({
		namePath: 'UserService/getAllUsers',
		filePath: 'UserService.ts',
		content: '\n\t/**\n\t * Count total users\n\t */\n\tcountUsers(): number {\n\t\treturn this.users.size;\n\t}\n',
	});

	assert(result.success, 'Tool should succeed');

	// Verify insertion
	const fileContent = fs.readFileSync(path.join(TEMP_TEST_DIR, 'UserService.ts'), 'utf8');
	assert(fileContent.includes('countUsers'), 'Should have new method');
	assert(fileContent.includes('Count total users'), 'Should have new method comment');

	const getAllIndex = fileContent.indexOf('getAllUsers');
	const countIndex = fileContent.indexOf('countUsers');
	assert(countIndex > getAllIndex, 'New method should be after getAllUsers');

	cleanupTempDir();
});

await test('InsertAfterSymbolTool: should insert new class after existing class', async () => {
	setupTempDir();
	copyFixtureToTemp('UserService.ts');

	const tool = new InsertAfterSymbolTool(TEMP_TEST_DIR);
	const newClass = '\n\nexport class UserValidator {\n\tvalidateEmail(email: string): boolean {\n\t\treturn email.includes(\'@\');\n\t}\n}\n';

	const result = await tool.execute({
		namePath: 'UserService',
		filePath: 'UserService.ts',
		content: newClass,
	});

	assert(result.success, 'Tool should succeed');

	// Verify insertion
	const fileContent = fs.readFileSync(path.join(TEMP_TEST_DIR, 'UserService.ts'), 'utf8');
	assert(fileContent.includes('UserValidator'), 'Should have new class');
	assert(fileContent.includes('validateEmail'), 'Should have new method');

	cleanupTempDir();
});

// ========================================
// Tests - RenameSymbolTool
// ========================================

await test('RenameSymbolTool: should find rename locations for method', async () => {
	const tool = new RenameSymbolTool(FIXTURES_ROOT);
	const result = await tool.execute({
		namePath: 'UserService/createUser',
		filePath: 'UserService.ts',
		newName: 'addUser',
	});

	// Note: We're not actually modifying files, just checking that tool finds locations
	assert(result.success, 'Tool should succeed');
	assert(result.metadata?.symbol === 'createUser', 'Should target createUser method');
	assert(result.metadata?.newName === 'addUser', 'Should rename to addUser');

	const filesAffected = result.metadata?.filesAffected || 0;
	assert(filesAffected >= 1, `Should find at least 1 location to rename, got ${filesAffected}`);
});

await test('RenameSymbolTool: should find rename locations for class', async () => {
	const tool = new RenameSymbolTool(FIXTURES_ROOT);
	const result = await tool.execute({
		namePath: 'UserService',
		filePath: 'UserService.ts',
		newName: 'UserManager',
	});

	assert(result.success, 'Tool should succeed');
	assert(result.metadata?.symbol === 'UserService', 'Should target UserService class');

	const filesAffected = result.metadata?.filesAffected || 0;
	assert(filesAffected >= 1, `Should find locations to rename, got ${filesAffected}`);
});

await test('RenameSymbolTool: should reject invalid new name', async () => {
	const tool = new RenameSymbolTool(FIXTURES_ROOT);
	const result = await tool.execute({
		namePath: 'UserService',
		filePath: 'UserService.ts',
		newName: '123InvalidName',  // Invalid: starts with number
	});

	assert(!result.success, 'Tool should fail with invalid name');
	assert(result.error && result.error.includes('Invalid'), 'Error message should mention invalid name');
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
