/**
 * Integration Tests: AI + Editing Tools
 * Simulates real user workflow: User asks AI → AI calls tools → Tools execute → AI responds
 */

import * as path from 'path';
import * as fs from 'fs';
import {fileURLToPath} from 'url';

// Get dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import from compiled dist
const {CodehClient} = await import('./dist/core/application/CodehClient.js');
const {Configuration} = await import('./dist/core/domain/models/Configuration.js');
const {ToolRegistry} = await import('./dist/core/tools/base/ToolRegistry.js');
const {SymbolSearchTool} = await import('./dist/core/tools/SymbolSearchTool.js');
const {FindReferencesTool} = await import('./dist/core/tools/FindReferencesTool.js');
const {GetSymbolsOverviewTool} = await import('./dist/core/tools/GetSymbolsOverviewTool.js');
const {RenameSymbolTool} = await import('./dist/core/tools/RenameSymbolTool.js');
const {ReplaceSymbolBodyTool} = await import('./dist/core/tools/ReplaceSymbolBodyTool.js');
const {InsertBeforeSymbolTool} = await import('./dist/core/tools/InsertBeforeSymbolTool.js');
const {InsertAfterSymbolTool} = await import('./dist/core/tools/InsertAfterSymbolTool.js');
const {ReplaceRegexTool} = await import('./dist/core/tools/ReplaceRegexTool.js');
const {FindFileTool} = await import('./dist/core/tools/FindFileTool.js');
const {SearchForPatternTool} = await import('./dist/core/tools/SearchForPatternTool.js');
const {Message} = await import('./dist/core/domain/models/Message.js');

const FIXTURES_ROOT = path.join(__dirname, 'test/fixtures/symbol-analysis');
const TEMP_TEST_DIR = path.join(__dirname, 'test/fixtures/temp-integration-tests');

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

// ========================================
// Mock AI Client - Simulates Anthropic API
// ========================================

/**
 * Mock AI that simulates different tool calling scenarios
 */
class MockAIClient {
	constructor(scenario) {
		this.scenario = scenario;
		this.callCount = 0;
	}

	async chat(request) {
		this.callCount++;

		if (this.scenario === 'find-and-search') {
			return this.handleFindAndSearchScenario(request);
		} else if (this.scenario === 'rename-symbol') {
			return this.handleRenameSymbolScenario(request);
		} else if (this.scenario === 'replace-method-body') {
			return this.handleReplaceMethodBodyScenario(request);
		} else if (this.scenario === 'insert-code') {
			return this.handleInsertCodeScenario(request);
		} else if (this.scenario === 'regex-refactor') {
			return this.handleRegexRefactorScenario(request);
		}

		throw new Error(`Unknown scenario: ${this.scenario}`);
	}

	handleFindAndSearchScenario(request) {
		// Call 1: Use find_file to locate TypeScript files
		if (this.callCount === 1) {
			return {
				content: 'Let me find all TypeScript files first.',
				model: 'mock-ai',
				finishReason: 'tool_calls',
				toolCalls: [
					{
						id: 'call_1',
						name: 'find_file',
						arguments: {
							pattern: '*.ts',
						},
					},
				],
			};
		}

		// Call 2: Use search_for_pattern to find specific code
		if (this.callCount === 2) {
			return {
				content: 'Now I will search for createUser methods.',
				model: 'mock-ai',
				finishReason: 'tool_calls',
				toolCalls: [
					{
						id: 'call_2',
						name: 'search_for_pattern',
						arguments: {
							pattern: 'createUser',
						},
					},
				],
			};
		}

		// Call 3: Final response
		return {
			content: 'I found TypeScript files and located the createUser method in UserService.ts.',
			model: 'mock-ai',
			finishReason: 'stop',
		};
	}

	handleRenameSymbolScenario(request) {
		// Call 1: Use rename_symbol
		if (this.callCount === 1) {
			return {
				content: 'I will rename the createUser method to addUser.',
				model: 'mock-ai',
				finishReason: 'tool_calls',
				toolCalls: [
					{
						id: 'call_1',
						name: 'rename_symbol',
						arguments: {
							namePath: 'UserService/createUser',
							filePath: 'UserService.ts',
							newName: 'addUser',
						},
					},
				],
			};
		}

		// Call 2: Final response
		return {
			content: 'Successfully renamed createUser to addUser across the codebase.',
			model: 'mock-ai',
			finishReason: 'stop',
		};
	}

	handleReplaceMethodBodyScenario(request) {
		// Call 1: Use replace_symbol_body
		if (this.callCount === 1) {
			return {
				content: 'I will replace the generateId method implementation.',
				model: 'mock-ai',
				finishReason: 'tool_calls',
				toolCalls: [
					{
						id: 'call_1',
						name: 'replace_symbol_body',
						arguments: {
							namePath: 'UserService/generateId',
							filePath: 'UserService.ts',
							newBody: '\tprivate generateId(): string {\n\t\treturn "new_id_" + Date.now();\n\t}',
						},
					},
				],
			};
		}

		// Call 2: Final response
		return {
			content: 'Successfully replaced the generateId method implementation.',
			model: 'mock-ai',
			finishReason: 'stop',
		};
	}

	handleInsertCodeScenario(request) {
		// Call 1: Use insert_after_symbol
		if (this.callCount === 1) {
			return {
				content: 'I will add a new countUsers method after getAllUsers.',
				model: 'mock-ai',
				finishReason: 'tool_calls',
				toolCalls: [
					{
						id: 'call_1',
						name: 'insert_after_symbol',
						arguments: {
							namePath: 'UserService/getAllUsers',
							filePath: 'UserService.ts',
							content: '\n\tcountUsers(): number {\n\t\treturn this.users.size;\n\t}\n',
						},
					},
				],
			};
		}

		// Call 2: Final response
		return {
			content: 'Successfully added the countUsers method to UserService.',
			model: 'mock-ai',
			finishReason: 'stop',
		};
	}

	handleRegexRefactorScenario(request) {
		// Call 1: Use replace_regex
		if (this.callCount === 1) {
			return {
				content: 'I will rename User Service to User Manager using regex.',
				model: 'mock-ai',
				finishReason: 'tool_calls',
				toolCalls: [
					{
						id: 'call_1',
						name: 'replace_regex',
						arguments: {
							filePath: 'UserService.ts',
							pattern: 'User Service',
							replacement: 'User Manager',
							flags: 'g',
						},
					},
				],
			};
		}

		// Call 2: Final response
		return {
			content: 'Successfully refactored "User Service" to "User Manager".',
			model: 'mock-ai',
			finishReason: 'stop',
		};
	}

	async streamChat(request, onChunk) {
		const response = await this.chat(request);
		onChunk({content: response.content, done: true});
		return response;
	}

	async healthCheck() {
		return true;
	}

	getProviderName() {
		return 'mock-ai';
	}

	async getAvailableModels() {
		return ['mock-ai'];
	}

	getCallCount() {
		return this.callCount;
	}
}

// ========================================
// Mock Infrastructure
// ========================================

class MockHistoryRepository {
	constructor() {
		this.messages = [];
	}

	async addMessage(message) {
		this.messages.push(message);
	}

	async getRecentMessages(limit) {
		return this.messages.slice(-limit);
	}

	async clearHistory() {
		this.messages = [];
	}

	async saveToFile() {}
	async loadFromFile() {}
}

class MockPermissionHandler {
	async requestPermission(context) {
		// Auto-approve all tools for testing
		return {
			approved: true,
			reason: 'Auto-approved for testing',
		};
	}

	hasPreApproval(toolName) {
		// All tools are pre-approved in tests
		return true;
	}

	async savePermissionPreference(toolName, alwaysAllow) {
		// No-op for testing
	}

	async clearPreferences() {
		// No-op for testing
	}
}

// ========================================
// Helper Functions
// ========================================

function setupTempDir() {
	if (fs.existsSync(TEMP_TEST_DIR)) {
		fs.rmSync(TEMP_TEST_DIR, {recursive: true, force: true});
	}
	fs.mkdirSync(TEMP_TEST_DIR, {recursive: true});

	// Copy tsconfig.json
	const tsconfigSource = path.join(FIXTURES_ROOT, 'tsconfig.json');
	const tsconfigDest = path.join(TEMP_TEST_DIR, 'tsconfig.json');
	fs.copyFileSync(tsconfigSource, tsconfigDest);

	// Copy UserService.ts
	const userServiceSource = path.join(FIXTURES_ROOT, 'UserService.ts');
	const userServiceDest = path.join(TEMP_TEST_DIR, 'UserService.ts');
	fs.copyFileSync(userServiceSource, userServiceDest);
}

function cleanupTempDir() {
	if (fs.existsSync(TEMP_TEST_DIR)) {
		fs.rmSync(TEMP_TEST_DIR, {recursive: true, force: true});
	}
}

function createCodehClient(mockAI, projectRoot) {
	const historyRepo = new MockHistoryRepository();
	const permissionHandler = new MockPermissionHandler();
	const toolRegistry = new ToolRegistry();

	// Register ALL tools
	toolRegistry.register(new SymbolSearchTool(projectRoot));
	toolRegistry.register(new FindReferencesTool(projectRoot));
	toolRegistry.register(new GetSymbolsOverviewTool(projectRoot));
	toolRegistry.register(new RenameSymbolTool(projectRoot));
	toolRegistry.register(new ReplaceSymbolBodyTool(projectRoot));
	toolRegistry.register(new InsertBeforeSymbolTool(projectRoot));
	toolRegistry.register(new InsertAfterSymbolTool(projectRoot));
	toolRegistry.register(new ReplaceRegexTool(projectRoot));
	toolRegistry.register(new FindFileTool(projectRoot));
	toolRegistry.register(new SearchForPatternTool(projectRoot));

	// Create mock configuration
	const mockConfig = Configuration.create({
		provider: 'anthropic',
		model: 'claude-3-5-sonnet-20241022',
		apiKey: 'test-key',
		maxTokens: 4096,
		temperature: 0.7,
	});

	const client = new CodehClient(mockAI, historyRepo, mockConfig, toolRegistry, permissionHandler);

	return {client, toolRegistry};
}

// ========================================
// Integration Tests
// ========================================

await test('Integration: AI finds files and searches patterns', async () => {
	const mockAI = new MockAIClient('find-and-search');
	const {client} = createCodehClient(mockAI, FIXTURES_ROOT);

	const turn = await client.execute('Find all TypeScript files and locate createUser method');

	// Verify AI workflow (initial call + 2 continuation calls)
	assert(mockAI.getCallCount() >= 2, `AI should call at least 2 times, got ${mockAI.getCallCount()}`);

	// Verify final response exists (tool calls are internal, turn may not expose them all)
	assert(turn.response !== null, 'Should have final response');
	assert(
		turn.response.content.includes('found') || turn.response.content.includes('createUser'),
		'Response should indicate success',
	);
});

await test('Integration: AI renames symbol across codebase', async () => {
	// Note: Using FIXTURES_ROOT (not temp) because rename_symbol only finds locations, doesn't actually rename
	const mockAI = new MockAIClient('rename-symbol');
	const {client} = createCodehClient(mockAI, FIXTURES_ROOT);

	const turn = await client.execute('Rename createUser to addUser');

	// Verify workflow
	assert(mockAI.getCallCount() >= 2, `AI should call at least 2 times, got ${mockAI.getCallCount()}`);

	// Verify response
	assert(turn.response !== null, 'Should have response');
	assert(turn.response.content.includes('renamed') || turn.response.content.includes('Success'), 'Should indicate success');
});

await test('Integration: AI replaces method body', async () => {
	setupTempDir();

	const mockAI = new MockAIClient('replace-method-body');
	const {client} = createCodehClient(mockAI, TEMP_TEST_DIR);

	const turn = await client.execute('Replace generateId implementation');

	// Verify workflow
	assert(mockAI.getCallCount() >= 2, `AI should call at least 2 times, got ${mockAI.getCallCount()}`);

	// Verify response
	assert(turn.response !== null, 'Should have response');

	// Verify file was modified
	const fileContent = fs.readFileSync(
		path.join(TEMP_TEST_DIR, 'UserService.ts'),
		'utf8',
	);
	assert(fileContent.includes('new_id_'), 'File should contain new implementation');

	cleanupTempDir();
});

await test('Integration: AI inserts new code', async () => {
	setupTempDir();

	const mockAI = new MockAIClient('insert-code');
	const {client} = createCodehClient(mockAI, TEMP_TEST_DIR);

	const turn = await client.execute('Add countUsers method after getAllUsers');

	// Verify workflow
	assert(mockAI.getCallCount() >= 2, `AI should call at least 2 times, got ${mockAI.getCallCount()}`);

	// Verify response
	assert(turn.response !== null, 'Should have response');

	// Verify file was modified
	const fileContent = fs.readFileSync(
		path.join(TEMP_TEST_DIR, 'UserService.ts'),
		'utf8',
	);
	assert(fileContent.includes('countUsers'), 'File should contain new method');

	cleanupTempDir();
});

await test('Integration: AI uses regex to refactor', async () => {
	setupTempDir();

	const mockAI = new MockAIClient('regex-refactor');
	const {client} = createCodehClient(mockAI, TEMP_TEST_DIR);

	const turn = await client.execute('Refactor User Service to User Manager');

	// Verify workflow
	assert(mockAI.getCallCount() >= 2, `AI should call at least 2 times, got ${mockAI.getCallCount()}`);

	// Verify response
	assert(turn.response !== null, 'Should have response');

	// Verify file was modified
	const fileContent = fs.readFileSync(
		path.join(TEMP_TEST_DIR, 'UserService.ts'),
		'utf8',
	);
	assert(fileContent.includes('User Manager'), 'File should contain User Manager');
	assert(!fileContent.includes('User Service'), 'File should not contain User Service');

	cleanupTempDir();
});

await test('Integration: Tool definitions sent to AI', async () => {
	const mockAI = new MockAIClient('find-and-search');
	const {client, toolRegistry} = createCodehClient(mockAI, FIXTURES_ROOT);

	// Capture request to verify tools are included
	let capturedRequest = null;
	const originalChat = mockAI.chat.bind(mockAI);
	mockAI.chat = async request => {
		capturedRequest = request;
		return originalChat(request);
	};

	await client.execute('Test');

	// Verify tools were sent
	assert(capturedRequest !== null, 'Should capture request');
	assert(capturedRequest.tools !== undefined, 'Request should include tools');
	assert(
		capturedRequest.tools.length === 10,
		`Should have 10 tools, got ${capturedRequest.tools.length}`,
	);

	// Verify tool structure
	const tool = capturedRequest.tools[0];
	assert(tool.name !== undefined, 'Tool should have name');
	assert(tool.description !== undefined, 'Tool should have description');
	assert(
		tool.parameters !== undefined || tool.inputSchema !== undefined,
		'Tool should have parameters or inputSchema',
	);
});

await test('Integration: Tool execution results sent back to AI', async () => {
	const mockAI = new MockAIClient('find-and-search');
	const {client} = createCodehClient(mockAI, FIXTURES_ROOT);

	// Capture second call (continuation with tool results)
	let secondCallRequest = null;
	const originalChat = mockAI.chat.bind(mockAI);
	let callCount = 0;
	mockAI.chat = async request => {
		callCount++;
		if (callCount === 2) {
			secondCallRequest = request;
		}
		return originalChat(request);
	};

	await client.execute('Find files');

	// Verify second call includes tool results
	assert(secondCallRequest !== null, 'Should capture second request');
	assert(secondCallRequest.messages.length > 1, 'Should have multiple messages');

	// Check if messages contain content (tool results are formatted as user messages)
	const hasContent = secondCallRequest.messages.some(
		m => m.content && m.content.length > 0,
	);
	assert(hasContent, 'Messages should have content');
});

await test('Integration: Multi-step workflow with error handling', async () => {
	setupTempDir();

	// Create AI that tries to use a tool with invalid parameters
	const mockAI = {
		callCount: 0,
		async chat(request) {
			this.callCount++;

			if (this.callCount === 1) {
				// Try to rename with invalid name (should fail)
				return {
					content: 'Attempting rename with invalid name.',
					model: 'mock-ai',
					finishReason: 'tool_calls',
					toolCalls: [
						{
							id: 'call_1',
							name: 'rename_symbol',
							arguments: {
								namePath: 'UserService',
								filePath: 'UserService.ts',
								newName: '123InvalidName', // Invalid: starts with number
							},
						},
					],
				};
			}

			// After error, AI should receive error message and can try again or give up
			return {
				content: 'The rename failed due to invalid identifier name.',
				model: 'mock-ai',
				finishReason: 'stop',
			};
		},
		async streamChat(request, onChunk) {
			const response = await this.chat(request);
			onChunk({content: response.content, done: true});
			return response;
		},
		async healthCheck() {
			return true;
		},
		getProviderName() {
			return 'mock-ai';
		},
		async getAvailableModels() {
			return ['mock-ai'];
		},
		getCallCount() {
			return this.callCount;
		},
	};

	const {client} = createCodehClient(mockAI, TEMP_TEST_DIR);

	const turn = await client.execute('Rename UserService to 123Invalid');

	// Verify error was handled
	assert(mockAI.getCallCount() === 2, 'AI should retry after error');
	assert(turn.response !== null, 'Should have final response');
	assert(turn.response.content.includes('failed'), 'Should mention failure');

	cleanupTempDir();
});

// ========================================
// Summary
// ========================================

console.log('\n' + '='.repeat(50));
console.log(`\n📊 Integration Test Results:`);
console.log(`   ✅ Passed: ${testsPassed}`);
console.log(`    Failed: ${testsFailed}`);
console.log(`   📈 Total:  ${testsPassed + testsFailed}`);

if (testsFailed === 0) {
	console.log(`\n🎉 All integration tests passed!\n`);
	process.exit(0);
} else {
	console.log(`\n💥 Some integration tests failed!\n`);
	process.exit(1);
}
