#!/usr/bin/env tsx
/**
 * Test script to verify only ONE log file is created
 */

import {getLogger, generateRequestId} from '../source/infrastructure/logging/Logger.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

console.log('=== Testing Single Log File Creation ===\n');

// Simulate the flow in cli.tsx + HomePresenter
const logger = getLogger();
const requestId = generateRequestId();
logger.setRequestId(requestId);

console.log('1️⃣  Logger created (no sessionId yet)');
console.log('   Expected: No file created yet\n');

// Simulate HomePresenter setting session ID
const sessionId = `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
logger.setSessionId?.(sessionId);

console.log('2️⃣  Session ID set:', sessionId);
console.log('   Expected: Still no file created\n');

// Now write first log (should create the file)
logger.info('Test', 'main', 'First log entry');

console.log('3️⃣  First log written');
console.log('   Expected: ONE file created now\n');

// Write more logs
logger.debug('Test', 'main', 'Second log entry');
logger.warn('Test', 'main', 'Third log entry');

// Flush
logger.flush();

// Check files
setTimeout(() => {
	const logDir = path.join(os.homedir(), '.codeh', 'logs');
	if (!fs.existsSync(logDir)) {
		console.log('❌ Log directory does not exist!');
		process.exit(1);
	}

	const files = fs.readdirSync(logDir).filter((f: string) => f.endsWith('.json'));

	console.log('\n=== Results ===');
	console.log(`Files created: ${files.length}`);

	if (files.length === 0) {
		console.log('❌ No log files created!');
		process.exit(1);
	} else if (files.length === 1) {
		console.log('✅ SUCCESS: Only ONE log file created!');
		console.log(`   File: ${files[0]}`);

		// Verify it uses session ID
		if (files[0].includes(sessionId.split('_')[1])) {
			console.log('✅ File uses session ID correctly');
		} else {
			console.log('⚠️  File does not use session ID');
		}

		// Count logs
		const content = fs.readFileSync(path.join(logDir, files[0]), 'utf-8');
		const lines = content.trim().split('\n').length;
		console.log(`✅ Log entries: ${lines} (expected 3)`);

		if (lines === 3) {
			console.log('\n🎉 Perfect! Everything works correctly!');
		}
	} else {
		console.log('❌ FAILURE: Multiple files created!');
		files.forEach((f: string) => console.log(`   - ${f}`));
		process.exit(1);
	}
}, 500);
