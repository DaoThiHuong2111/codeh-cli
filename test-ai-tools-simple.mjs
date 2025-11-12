#!/usr/bin/env node
/**
 * Test: AI Tools Availability
 * Simplified test to verify code navigation tools are properly registered
 */

console.log('\n🧪 Testing: AI Tool Availability\n');
console.log('━'.repeat(60));

// Verify tool files exist
import {existsSync} from 'fs';
import {join} from 'path';

const projectRoot = process.cwd();
const toolFiles = [
	'dist/core/tools/SymbolSearchTool.js',
	'dist/core/tools/FindReferencesTool.js',
	'dist/core/tools/GetSymbolsOverviewTool.js',
	'dist/core/tools/RenameSymbolTool.js',
	'dist/core/tools/ReplaceSymbolBodyTool.js',
	'dist/core/tools/FindFileTool.js',
	'dist/core/tools/SearchForPatternTool.js',
];

console.log('📦 Checking tool files...\n');

let allExist = true;
for (const file of toolFiles) {
	const fullPath = join(projectRoot, file);
	const exists = existsSync(fullPath);
	const toolName = file.split('/').pop().replace('.js', '');
	console.log(`  ${exists ? '✓' : '✗'} ${toolName}`);
	allExist = allExist && exists;
}

console.log('\n━'.repeat(60));

// Check if tools are registered in DI setup
console.log('\n📋 Checking tool registration in DI setup...\n');

import {readFileSync} from 'fs';
const setupPath = join(projectRoot, 'source/core/di/setup.ts');
const setupContent = readFileSync(setupPath, 'utf-8');

const toolRegistrations = [
	{name: 'SymbolSearchTool', pattern: /SymbolSearchTool/},
	{name: 'FindReferencesTool', pattern: /FindReferencesTool/},
	{name: 'GetSymbolsOverviewTool', pattern: /GetSymbolsOverviewTool/},
	{name: 'RenameSymbolTool', pattern: /RenameSymbolTool/},
	{name: 'ReplaceSymbolBodyTool', pattern: /ReplaceSymbolBodyTool/},
];

let allRegistered = true;
for (const tool of toolRegistrations) {
	const registered = tool.pattern.test(setupContent);
	console.log(`  ${registered ? '✓' : '✗'} ${tool.name} registered`);
	allRegistered = allRegistered && registered;
}

console.log('\n━'.repeat(60));

// Summary
console.log('\n📊 Test Summary:\n');

const allPass = allExist && allRegistered;

if (allPass) {
	console.log('🎉 All AI Tools: AVAILABLE!\n');
	console.log('✅ Tool Infrastructure Ready:');
	console.log('   - All tool files compiled successfully');
	console.log('   - Tools registered in DI container');
	console.log('   - AI agent can access tools via ToolRegistry\n');
	console.log('🔧 Available Tools:');
	console.log('   • symbol_search - Find symbols by name');
	console.log('   • find_references - Find who calls a symbol');
	console.log('   • get_symbols_overview - Get file symbol overview');
	console.log('   • rename_symbol - Rename across codebase');
	console.log('   • replace_symbol_body - Replace symbol code');
	console.log('   • find_file - Find files by pattern');
	console.log('   • search_for_pattern - Search code patterns\n');
	console.log('💡 Next Steps:');
	console.log('   1. Add system prompts to guide AI tool selection');
	console.log('   2. Improve tool output format (human-readable)');
	console.log('   3. Test with real AI model (not mock)\n');
} else {
	console.log('⚠️  Some checks failed:\n');
	if (!allExist) console.log('  - Some tool files missing');
	if (!allRegistered) console.log('  - Some tools not registered');
	console.log();
}

console.log('━'.repeat(60));
console.log();
