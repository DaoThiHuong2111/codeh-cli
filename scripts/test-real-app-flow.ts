#!/usr/bin/env tsx
/**
 * Test to simulate real app flow:
 * 1. cli.tsx initializes logger (no sessionId)
 * 2. cli.tsx calls logger methods BEFORE sessionId is set
 * 3. HomePresenter sets sessionId
 * 4. More logging happens
 */

import {getLogger, generateRequestId, cleanupOldLogs} from '../source/infrastructure/logging/Logger';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

console.log('=== Testing Real App Flow ===\n');

// Simulate cli.tsx
const logger = getLogger();
cleanupOldLogs(7);

const start = Date.now();
const requestId = generateRequestId();
logger.setRequestId(requestId);

console.log('1️⃣  Logger initialized (like cli.tsx)');
console.log('   RequestId:', requestId);
console.log('   Expected: No file created yet\n');

// REMOVED: These logs that were causing the problem
// logger.info('CLI', 'main', 'Application starting', {...});
// logger.debug('CLI', 'main', 'Setting up DI container');

// Simulate HomePresenter setting sessionId
const sessionId = `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
console.log('2️⃣  Setting sessionId (like HomePresenter)');
console.log('   SessionId:', sessionId);

if (logger.setSessionId) {
	logger.setSessionId(sessionId);
}

// NOW first log happens (after sessionId is set)
logger.info('HomePresenter', 'constructor', 'Presenter initialized', {
	session_id: sessionId,
});

console.log('3️⃣  First log written (AFTER sessionId set)\n');

// More logging
logger.debug('Test', 'flow', 'Additional log entry');
logger.flush();

// Check files
setTimeout(() => {
	const logDir = path.join(os.homedir(), '.codeh', 'logs');
	const files = fs.readdirSync(logDir).filter((f: string) => f.endsWith('.json'));

	console.log('=== Results ===');
	console.log(`Files created: ${files.length}`);

	if (files.length === 1) {
		console.log('✅ SUCCESS: Only ONE file created!');
		console.log(`   File: ${files[0]}`);

		// Verify it uses session ID
		if (files[0].includes(sessionId.split('_')[1])) {
			console.log('✅ File uses correct session ID');
		}

		const content = fs.readFileSync(path.join(logDir, files[0]), 'utf-8');
		const lines = content.trim().split('\n');
		console.log(`✅ Log entries: ${lines.length}`);

		console.log('\n🎉 Perfect! No duplicate files created!');
	} else {
		console.log('❌ FAILURE: Multiple files created!');
		files.forEach((f: string) => console.log(`   - ${f}`));

		// Show content of each file
		files.forEach((f: string) => {
			const content = fs.readFileSync(path.join(logDir, f), 'utf-8');
			const lines = content.trim().split('\n').length;
			console.log(`   ${f}: ${lines} entries`);
		});

		process.exit(1);
	}
}, 500);
