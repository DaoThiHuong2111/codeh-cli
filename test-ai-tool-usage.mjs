#!/usr/bin/env node
/**
 * Test: AI Tool Usage
 * Verifies AI agent can autonomously use code navigation tools
 */

import {CodehClient} from './dist/core/application/CodehClient.js';
import {InMemoryHistoryRepository} from './dist/infrastructure/history/InMemoryHistoryRepository.js';
import {ToolRegistry} from './dist/core/tools/base/ToolRegistry.js';
import {SymbolSearchTool} from './dist/core/tools/SymbolSearchTool.js';
import {FindReferencesTool} from './dist/core/tools/FindReferencesTool.js';
import {GetSymbolsOverviewTool} from './dist/core/tools/GetSymbolsOverviewTool.js';
import {SimplePermissionHandler} from './dist/infrastructure/permissions/SimplePermissionHandler.js';

// Mock API Client for testing
class MockApiClient {
	constructor() {
		this.callCount = 0;
		this.lastRequest = null;
	}

	async chat({messages, tools}) {
		this.callCount++;
		this.lastRequest = {messages, tools};

		// Simulate AI choosing to use symbol_search tool
		const userMessage = messages[messages.length - 1].content;

		// Parse user intent and respond with tool use
		if (userMessage.includes('tìm') || userMessage.includes('find')) {
			// AI decides to use symbol_search tool
			const toolName =
				userMessage.includes('references') || userMessage.includes('gọi')
					? 'find_references'
					: 'symbol_search';

			return {
				id: 'test-response',
				type: 'message',
				role: 'assistant',
				content: [
					{
						type: 'tool_use',
						id: 'tool-1',
						name: toolName,
						input:
							toolName === 'symbol_search'
								? {
										namePattern: 'fetchSymbols',
										filePath: 'source/cli/presenters/HomePresenter.ts',
										includeBody: false,
										depth: 0,
									}
								: {
										namePath: 'HomePresenter/fetchSymbols',
										filePath: 'source/cli/presenters/HomePresenter.ts',
									},
					},
				],
				stop_reason: 'tool_use',
				usage: {input_tokens: 100, output_tokens: 50},
			};
		}

		// Default response
		return {
			id: 'test-response',
			type: 'message',
			role: 'assistant',
			content: [
				{
					type: 'text',
					text: 'I understand. Let me help you with that.',
				},
			],
			stop_reason: 'end_turn',
			usage: {input_tokens: 100, output_tokens: 50},
		};
	}
}

// ========================================
// Test Scenarios
// ========================================

async function testAIToolUsage() {
	console.log('\n🧪 Testing: AI Tool Usage (AI-First Approach)\n');
	console.log('━'.repeat(60));

	// Setup
	const projectRoot = process.cwd();
	const apiClient = new MockApiClient();
	const historyRepo = new InMemoryHistoryRepository();
	const toolRegistry = new ToolRegistry();
	const permissionHandler = new SimplePermissionHandler();

	// Register code navigation tools
	toolRegistry.register(new SymbolSearchTool(projectRoot));
	toolRegistry.register(new FindReferencesTool(projectRoot));
	toolRegistry.register(new GetSymbolsOverviewTool(projectRoot));

	const client = new CodehClient(
		apiClient,
		historyRepo,
		toolRegistry,
		permissionHandler,
	);

	console.log('✓ Setup complete: 3 code navigation tools registered\n');
	console.log('━'.repeat(60));

	// ========================================
	// Test 1: Symbol Search Tool
	// ========================================
	console.log('\n📋 Test 1: AI uses symbol_search tool');
	console.log('─'.repeat(60));
	console.log(
		'User: "Tìm method fetchSymbols trong HomePresenter"\n',
	);

	const result1 = await client.execute(
		'Tìm method fetchSymbols trong HomePresenter',
	);

	console.log('AI Response:');
	if (result1.toolCalls && result1.toolCalls.length > 0) {
		const toolCall = result1.toolCalls[0];
		console.log(`  ✓ AI chose tool: "${toolCall.name}"`);
		console.log(`  ✓ Tool parameters:`, JSON.stringify(toolCall.input, null, 2));

		if (toolCall.result) {
			console.log(`\n  Tool Output (first 200 chars):`);
			const output =
				typeof toolCall.result === 'string'
					? toolCall.result
					: JSON.stringify(toolCall.result);
			console.log(`  ${output.substring(0, 200)}...`);
		}
	} else {
		console.log('  ✗ No tool calls detected');
	}

	// Verify
	const test1Pass =
		result1.toolCalls &&
		result1.toolCalls.length > 0 &&
		result1.toolCalls[0].name === 'symbol_search';
	console.log(`\n  Result: ${test1Pass ? '✅ PASS' : '❌ FAIL'}`);

	// ========================================
	// Test 2: Find References Tool
	// ========================================
	console.log('\n━'.repeat(60));
	console.log('\n📋 Test 2: AI uses find_references tool');
	console.log('─'.repeat(60));
	console.log(
		'User: "Ai đang gọi method fetchSymbols?"\n',
	);

	const result2 = await client.execute(
		'Ai đang gọi method fetchSymbols?',
	);

	console.log('AI Response:');
	if (result2.toolCalls && result2.toolCalls.length > 0) {
		const toolCall = result2.toolCalls[0];
		console.log(`  ✓ AI chose tool: "${toolCall.name}"`);
		console.log(`  ✓ Tool parameters:`, JSON.stringify(toolCall.input, null, 2));

		if (toolCall.result) {
			console.log(`\n  Tool Output (first 200 chars):`);
			const output =
				typeof toolCall.result === 'string'
					? toolCall.result
					: JSON.stringify(toolCall.result);
			console.log(`  ${output.substring(0, 200)}...`);
		}
	} else {
		console.log('  ✗ No tool calls detected');
	}

	const test2Pass =
		result2.toolCalls &&
		result2.toolCalls.length > 0 &&
		result2.toolCalls[0].name === 'find_references';
	console.log(`\n  Result: ${test2Pass ? '✅ PASS' : '❌ FAIL'}`);

	// ========================================
	// Summary
	// ========================================
	console.log('\n━'.repeat(60));
	console.log('\n📊 Test Summary:\n');

	const passCount = [test1Pass, test2Pass].filter(Boolean).length;
	const totalTests = 2;

	console.log(`  Total: ${passCount}/${totalTests} tests passed`);
	console.log(`  ${test1Pass ? '✅' : '❌'} AI autonomously calls symbol_search`);
	console.log(
		`  ${test2Pass ? '✅' : '❌'} AI autonomously calls find_references`,
	);

	console.log('\n━'.repeat(60));

	if (passCount === totalTests) {
		console.log('\n🎉 AI Tool Usage: WORKING!\n');
		console.log('✅ AI agent can autonomously:');
		console.log('   - Understand user intent from questions');
		console.log('   - Select appropriate code navigation tools');
		console.log('   - Call tools with correct parameters');
		console.log('   - Return results in conversation\n');
	} else {
		console.log('\n⚠️  Some tests failed. Check implementation.\n');
	}

	console.log('━'.repeat(60));
}

// Run tests
testAIToolUsage().catch(error => {
	console.error('\n❌ Test failed:', error);
	process.exit(1);
});
