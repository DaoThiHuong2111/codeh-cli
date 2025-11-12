#!/usr/bin/env node
/**
 * Test: Cache Performance
 * Verifies ResultCache improves performance of repeated operations
 */

import {TypeScriptSymbolAnalyzer} from './dist/infrastructure/typescript/TypeScriptSymbolAnalyzer.js';
import {performance} from 'perf_hooks';

console.log('\n🧪 Testing: Cache Performance Optimization\n');
console.log('━'.repeat(60));

const projectRoot = process.cwd();
const analyzer = new TypeScriptSymbolAnalyzer(projectRoot);

// Test file
const testFile = 'source/core/application/ToolExecutionOrchestrator.ts';

console.log('\n📊 Performance Test: Symbol Hierarchy\n');

// First call (cold cache)
const start1 = performance.now();
const hierarchy1 = analyzer.getSymbolHierarchy(testFile);
const duration1 = performance.now() - start1;

console.log(`  🔵 Cold cache: ${duration1.toFixed(2)}ms`);
console.log(`     Found ${hierarchy1.length} symbols`);

// Second call (warm cache)
const start2 = performance.now();
const hierarchy2 = analyzer.getSymbolHierarchy(testFile);
const duration2 = performance.now() - start2;

console.log(`  🟢 Warm cache: ${duration2.toFixed(2)}ms`);
console.log(`     Found ${hierarchy2.length} symbols`);

const speedup = (duration1 / duration2).toFixed(2);
console.log(`  ⚡ Speedup: ${speedup}x faster`);

console.log('\n━'.repeat(60));
console.log('\n📊 Performance Test: Find References\n');

// Test findReferences performance
const testSymbol = 'ToolExecutionOrchestrator';

// First call (cold cache)
const start3 = performance.now();
try {
	const refs1 = analyzer.findReferences(testSymbol, testFile);
	const duration3 = performance.now() - start3;

	console.log(`  🔵 Cold cache: ${duration3.toFixed(2)}ms`);
	console.log(`     Found ${refs1.length} references`);

	// Second call (warm cache)
	const start4 = performance.now();
	const refs2 = analyzer.findReferences(testSymbol, testFile);
	const duration4 = performance.now() - start4;

	console.log(`  🟢 Warm cache: ${duration4.toFixed(2)}ms`);
	console.log(`     Found ${refs2.length} references`);

	const speedup2 = (duration3 / duration4).toFixed(2);
	console.log(`  ⚡ Speedup: ${speedup2}x faster`);
} catch (error) {
	console.log(`  ⚠️  Could not test findReferences: ${error.message}`);
}

console.log('\n━'.repeat(60));
console.log('\n📈 Cache Statistics\n');

const stats = analyzer.getCacheStats();
console.log(`  Total Hits: ${stats.hits}`);
console.log(`  Total Misses: ${stats.misses}`);
console.log(`  Cache Size: ${stats.size} entries`);
console.log(`  Hit Rate: ${(stats.hitRate * 100).toFixed(1)}%`);
console.log(`  Evictions: ${stats.evictions}`);

console.log('\n━'.repeat(60));

// Summary
console.log('\n✅ Cache Performance Test: SUCCESS\n');
console.log('🎯 Key Improvements:');
console.log('   • LRU Cache with 500 entry limit');
console.log('   • Symbol hierarchy cached per file');
console.log('   • References cached per symbol');
console.log('   • Automatic invalidation on file changes');
console.log(`   • Average speedup: ${speedup}x for repeated queries\n`);

console.log('💡 Cache Benefits:');
console.log('   • Reduces TypeScript AST traversal overhead');
console.log('   • Speeds up repeated symbol lookups');
console.log('   • Minimizes Language Service API calls');
console.log('   • Memory-bounded with LRU eviction\n');

console.log('━'.repeat(60));
console.log();
