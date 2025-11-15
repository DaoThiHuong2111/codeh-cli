#!/usr/bin/env tsx
/**
 * Test script to verify .env file is loaded correctly
 */

import dotenv from 'dotenv';

// Load .env file (same way as cli.tsx)
dotenv.config({debug: true});

console.log('=== Testing .env File Loading ===\n');

// Check all CODEH_ variables
const codehVars = Object.keys(process.env)
	.filter(key => key.startsWith('CODEH_'))
	.sort();

if (codehVars.length === 0) {
	console.log('❌ No CODEH_* environment variables found!');
	console.log('\nPossible issues:');
	console.log('1. .env file does not exist');
	console.log('2. .env file is in wrong location');
	console.log('3. .env file has syntax errors');
	console.log('\nExpected location: /home/user/codeh-cli/.env');
} else {
	console.log(`✅ Found ${codehVars.length} CODEH_* variables:\n`);
	codehVars.forEach(key => {
		const value = process.env[key];
		// Mask API keys
		const displayValue = key.includes('KEY') && value
			? `${value.substring(0, 8)}...`
			: value;
		console.log(`  ${key} = "${displayValue}"`);
	});
}

// Specifically check CODEH_LOGGING
console.log('\n=== CODEH_LOGGING Check ===');
const loggingValue = process.env.CODEH_LOGGING;
console.log(`Raw value: "${loggingValue}"`);
console.log(`Type: ${typeof loggingValue}`);

if (loggingValue) {
	const lower = loggingValue.toLowerCase();
	const isEnabled = lower === 'true' || lower === '1' || lower === 'yes';
	console.log(`Lowercase: "${lower}"`);
	console.log(`Logging enabled: ${isEnabled ? '✅ YES' : '❌ NO'}`);
} else {
	console.log('❌ CODEH_LOGGING is not set');
}

console.log('\n=== .env File Location ===');
console.log(`Current directory: ${process.cwd()}`);
console.log('Expected .env path: /home/user/codeh-cli/.env');
