#!/usr/bin/env node
/**
 * Test: Symbol Fetching from Real Files
 * Verifies that HomePresenter can fetch symbols from TypeScript files
 */

import {TypeScriptCodeNavigator} from './dist/core/application/services/TypeScriptCodeNavigator.js';

// ========================================
// Test Symbol Fetching
// ========================================

async function testSymbolFetch() {
	console.log('\n🧪 Testing: Symbol Fetching from Real Files\n');
	console.log('━'.repeat(50));

	// Initialize navigator
	const projectRoot = process.cwd();
	const navigator = new TypeScriptCodeNavigator(projectRoot);

	// Test files to analyze
	const testFiles = [
		'source/cli/presenters/HomePresenter.ts',
		'source/core/domain/models/Symbol.ts',
		'source/core/application/services/TypeScriptCodeNavigator.ts',
	];

	console.log(`\n📂 Project Root: ${projectRoot}`);
	console.log(`\n📝 Testing ${testFiles.length} files:\n`);

	for (const filePath of testFiles) {
		console.log(`\n${'─'.repeat(50)}`);
		console.log(`📄 File: ${filePath}\n`);

		try {
			// Fetch symbol hierarchy
			const symbols = await navigator.getSymbolHierarchy(filePath);

			if (symbols.length === 0) {
				console.log('   ⚠️  No symbols found');
				continue;
			}

			console.log(`   ✓ Found ${symbols.length} top-level symbols:\n`);

			// Display symbols
			symbols.forEach((symbol, index) => {
				const kindName = symbol.getKindName();
				const location = `${symbol.location.startLine}:${symbol.location.startColumn}`;
				const childCount = symbol.children ? symbol.children.length : 0;

				console.log(
					`   ${index + 1}. ${symbol.name} (${kindName}) @ ${location}`,
				);

				if (childCount > 0) {
					console.log(`      └─ ${childCount} children`);

					// Show first 3 children
					symbol.children?.slice(0, 3).forEach(child => {
						console.log(`         • ${child.name} (${child.getKindName()})`);
					});

					if (childCount > 3) {
						console.log(`         ... and ${childCount - 3} more`);
					}
				}
			});
		} catch (error) {
			console.error(`   ✗ Error: ${error.message}`);
		}
	}

	console.log(`\n${'━'.repeat(50)}`);
	console.log('\n🎉 Symbol Fetching Test Complete!\n');
}

// Run test
testSymbolFetch().catch(error => {
	console.error('\n❌ Test failed:', error);
	process.exit(1);
});
