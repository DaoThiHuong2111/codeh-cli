#!/usr/bin/env tsx
/**
 * Debug script to help troubleshoot .env loading issues
 *
 * Usage: npx tsx scripts/debug-env.ts
 */

import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

console.log('=== .env Debug Tool ===\n');

// 1. Check current directory
console.log('1️⃣  Current Directory:');
console.log(`   ${process.cwd()}\n`);

// 2. Check if .env file exists
const envPath = path.join(process.cwd(), '.env');
console.log('2️⃣  .env File Check:');
console.log(`   Path: ${envPath}`);

if (!fs.existsSync(envPath)) {
	console.log('   ❌ File does NOT exist!\n');
	console.log('   Solution:');
	console.log('   1. Create .env file: cp .env.example .env');
	console.log('   2. Add this line: CODEH_LOGGING=true');
	process.exit(1);
}

console.log('   ✅ File exists\n');

// 3. Read raw content
console.log('3️⃣  Raw File Content:');
const rawContent = fs.readFileSync(envPath, 'utf-8');
console.log('---START---');
console.log(rawContent);
console.log('---END---\n');

// 4. Check for common issues
console.log('4️⃣  File Analysis:');
const lines = rawContent.split('\n');
let hasIssues = false;

lines.forEach((line, index) => {
	const lineNum = index + 1;

	// Skip empty lines and comments
	if (line.trim() === '' || line.trim().startsWith('#')) {
		return;
	}

	// Check for CODEH_LOGGING
	if (line.includes('CODEH_LOGGING')) {
		console.log(`   Line ${lineNum}: "${line}"`);

		// Check for trailing spaces
		if (line !== line.trim()) {
			console.log(`      ⚠️  Has leading/trailing spaces!`);
			hasIssues = true;
		}

		// Check for tabs
		if (line.includes('\t')) {
			console.log(`      ⚠️  Contains TAB characters!`);
			hasIssues = true;
		}

		// Extract value
		const match = line.match(/CODEH_LOGGING\s*=\s*(.+)/);
		if (match) {
			const value = match[1].trim();
			console.log(`      Value: "${value}"`);
			console.log(`      Value length: ${value.length} chars`);

			// Check if value has quotes
			if (value.startsWith('"') || value.startsWith("'")) {
				console.log(`      ⚠️  Value has quotes! Remove them.`);
				console.log(`      Correct: CODEH_LOGGING=true`);
				console.log(`      Wrong:   CODEH_LOGGING="true"`);
				hasIssues = true;
			}
		}
	}
});

if (!hasIssues) {
	console.log('   ✅ No obvious issues found\n');
} else {
	console.log('   ❌ Issues detected! Fix them above.\n');
}

// 5. Load with dotenv and check
console.log('5️⃣  Loading with dotenv:');
const result = dotenv.config({debug: true});

if (result.error) {
	console.log(`   ❌ Error: ${result.error.message}\n`);
} else {
	console.log('   ✅ Loaded successfully\n');
}

// 6. Check environment variables
console.log('6️⃣  Environment Variables:');
const loggingValue = process.env.CODEH_LOGGING;
console.log(`   CODEH_LOGGING = "${loggingValue}"`);
console.log(`   Type: ${typeof loggingValue}`);

if (loggingValue) {
	console.log(`   Length: ${loggingValue.length} chars`);

	// Show hex values of each character
	console.log('   Character codes:');
	for (let i = 0; i < loggingValue.length; i++) {
		const char = loggingValue[i];
		const code = loggingValue.charCodeAt(i);
		console.log(`      [${i}] '${char}' = 0x${code.toString(16).toUpperCase()} (${code})`);
	}

	// Test if it will enable logging
	const lower = loggingValue.toLowerCase();
	const isEnabled = lower === 'true' || lower === '1' || lower === 'yes';
	console.log(`\n   Lowercase: "${lower}"`);
	console.log(`   Will enable logging: ${isEnabled ? '✅ YES' : '❌ NO'}`);

	if (!isEnabled) {
		console.log('\n   ❌ PROBLEM: Value will NOT enable logging!');
		console.log('   Expected one of: true, TRUE, 1, yes');
		console.log(`   Got: "${loggingValue}"`);
	}
} else {
	console.log('   ❌ CODEH_LOGGING is undefined!\n');
	console.log('   This means dotenv did not load the variable.');
	console.log('   Check if .env file has the line: CODEH_LOGGING=true');
}

console.log('\n=== Debug Complete ===');

// Final recommendation
if (loggingValue) {
	const lower = loggingValue.toLowerCase();
	const isEnabled = lower === 'true' || lower === '1' || lower === 'yes';

	if (isEnabled) {
		console.log('✅ Everything looks good! Logging should work.');
		console.log('\nIf logging still does not work:');
		console.log('1. Make sure you are in the project root directory');
		console.log('2. Try: export CODEH_LOGGING=true && codeh');
		console.log('3. Check ~/.codeh/logs/ for log files');
	} else {
		console.log('❌ Fix the CODEH_LOGGING value in .env file');
		console.log('\nCorrect format:');
		console.log('CODEH_LOGGING=true');
		console.log('\nDO NOT use quotes, spaces, or other characters!');
	}
}
