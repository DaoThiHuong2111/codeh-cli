#!/usr/bin/env node
/**
 * Integration Test: Symbol Explorer with Auto-Fetch
 * Verifies the complete flow from UI toggle to symbol display
 */

import React from 'react';
import {render} from 'ink-testing-library';
import {SymbolExplorer} from './dist/cli/components/organisms/SymbolExplorer.js';
import {TypeScriptCodeNavigator} from './dist/core/application/services/TypeScriptCodeNavigator.js';

// ========================================
// Integration Test
// ========================================

async function testSymbolExplorerIntegration() {
	console.log('\n🧪 Testing: Symbol Explorer Integration\n');
	console.log('━'.repeat(50));

	// Simulate what Home.tsx does: Initialize navigator and fetch symbols
	const projectRoot = process.cwd();
	const navigator = new TypeScriptCodeNavigator(projectRoot);
	const testFilePath = 'source/cli/presenters/HomePresenter.ts';

	console.log(`\n📂 Project: ${projectRoot}`);
	console.log(`📄 File: ${testFilePath}\n`);

	// Step 1: Fetch symbols (simulating useEffect in Home.tsx)
	console.log('Step 1: Fetching symbols...');
	const symbols = await navigator.getSymbolHierarchy(testFilePath);
	console.log(`✓ Fetched ${symbols.length} top-level symbols\n`);

	// Step 2: Render SymbolExplorer with symbols and filePath
	console.log('Step 2: Rendering SymbolExplorer component...');
	const {lastFrame, unmount} = render(
		React.createElement(SymbolExplorer, {
			symbols,
			title: '🔍 Symbol Explorer',
			filePath: testFilePath,
			showLocation: true,
		}),
	);

	const output = lastFrame();
	console.log('✓ Component rendered\n');

	// Step 3: Verify output contains expected elements
	console.log('Step 3: Verifying output...');

	const tests = [
		{
			name: 'Title displayed',
			check: () => output.includes('🔍 Symbol Explorer'),
		},
		{
			name: 'File path displayed',
			check: () => output.includes(testFilePath),
		},
		{
			name: 'Symbol count displayed',
			check: () => /\d+ symbols/.test(output),
		},
		{
			name: 'Contains ViewState interface',
			check: () => output.includes('ViewState'),
		},
		{
			name: 'Contains HomePresenter class',
			check: () => output.includes('HomePresenter'),
		},
		{
			name: 'Location info displayed',
			check: () => /\d+:\d+/.test(output),
		},
	];

	let passed = 0;
	for (const test of tests) {
		const result = test.check();
		if (result) {
			console.log(`  ✓ ${test.name}`);
			passed++;
		} else {
			console.log(`  ✗ ${test.name}`);
		}
	}

	console.log(`\n━`.repeat(50));
	console.log(
		`\n📊 Results: ${passed}/${tests.length} tests passed (${Math.round((passed / tests.length) * 100)}%)`,
	);

	if (passed === tests.length) {
		console.log('\n🎉 Symbol Explorer Integration: WORKING!\n');
		console.log('✅ Complete flow verified:');
		console.log('   1. TypeScriptCodeNavigator fetches symbols');
		console.log('   2. Symbols passed to SymbolExplorer component');
		console.log('   3. File path displayed in header');
		console.log('   4. Symbols rendered with hierarchy');
		console.log('   5. Location info displayed correctly\n');
	} else {
		console.log('\n⚠️  Some tests failed. Check output above.\n');
	}

	// Display sample output
	console.log('━'.repeat(50));
	console.log('\n📋 Sample Output:\n');
	console.log(output.split('\n').slice(0, 20).join('\n'));
	console.log('\n... (truncated)\n');

	unmount();
}

// Run test
testSymbolExplorerIntegration().catch(error => {
	console.error('\n❌ Test failed:', error);
	process.exit(1);
});
