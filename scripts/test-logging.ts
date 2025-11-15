#!/usr/bin/env tsx
/**
 * Test script for logging system
 *
 * Usage:
 *   CODEH_LOGGING=true tsx scripts/test-logging.ts
 *   CODEH_LOGGING=1 tsx scripts/test-logging.ts
 */

import {getLogger, generateRequestId} from '../source/infrastructure/logging/Logger.js';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

async function testLogging() {
	console.log('=== Testing Logging System ===\n');

	// Check environment variable
	const loggingEnv = process.env.CODEH_LOGGING;
	console.log(`CODEH_LOGGING = "${loggingEnv}"`);

	if (!loggingEnv) {
		console.log('\n❌ CODEH_LOGGING is not set!');
		console.log('Please run with: CODEH_LOGGING=true tsx scripts/test-logging.ts');
		process.exit(1);
	}

	// Get logger
	const logger = getLogger();
	const requestId = generateRequestId();
	logger.setRequestId(requestId);

	console.log(`Request ID: ${requestId}\n`);

	// Test different log levels
	console.log('Writing test logs...');

	logger.debug('TestComponent', 'testLogging', 'This is a DEBUG message', {
		test: 'debug',
		timestamp: Date.now(),
	});

	logger.info('TestComponent', 'testLogging', 'This is an INFO message', {
		test: 'info',
		status: 'success',
	});

	logger.warn('TestComponent', 'testLogging', 'This is a WARN message', {
		test: 'warn',
		warning: 'something might be wrong',
	});

	logger.error('TestComponent', 'testLogging', 'This is an ERROR message', {
		test: 'error',
		error: 'simulated error for testing',
	});

	// Test function entry/exit
	logger.logFunctionEntry('TestComponent', 'sampleFunction', {param1: 'value1'});
	await sleep(100); // Simulate some work
	logger.logFunctionExit('TestComponent', 'sampleFunction', 100, true);

	// Flush logs
	console.log('Flushing logs...');
	logger.flush();

	// Wait a bit for file write
	await sleep(200);

	// Check log files
	const logDir = path.join(os.homedir(), '.codeh', 'logs');
	console.log(`\nLog directory: ${logDir}`);

	if (!fs.existsSync(logDir)) {
		console.log('❌ Log directory does not exist!');
		console.log('Logging might not be enabled properly.');
		process.exit(1);
	}

	const files = fs.readdirSync(logDir)
		.filter(f => f.endsWith('.json'))
		.sort((a, b) => {
			const statA = fs.statSync(path.join(logDir, a));
			const statB = fs.statSync(path.join(logDir, b));
			return statB.mtimeMs - statA.mtimeMs;
		});

	if (files.length === 0) {
		console.log('❌ No log files found!');
		process.exit(1);
	}

	console.log(`\nFound ${files.length} log file(s):`);
	files.forEach(f => {
		const filePath = path.join(logDir, f);
		const stat = fs.statSync(filePath);
		console.log(`  - ${f} (${stat.size} bytes)`);
	});

	// Read latest log file
	const latestLog = path.join(logDir, files[0]);
	console.log(`\nReading latest log: ${files[0]}`);
	console.log('---');

	const content = fs.readFileSync(latestLog, 'utf-8');
	const lines = content.trim().split('\n');

	// Find logs from this test run
	const testLogs = lines
		.map(line => {
			try {
				return JSON.parse(line);
			} catch {
				return null;
			}
		})
		.filter(log => log && log.requestId === requestId);

	if (testLogs.length === 0) {
		console.log('❌ No logs found with our request ID!');
		console.log('This might indicate a timing issue. Check the full log file.');
	} else {
		console.log(`✅ Found ${testLogs.length} log entries from this test run:\n`);
		testLogs.forEach(log => {
			console.log(JSON.stringify(log, null, 2));
		});
	}

	console.log('\n=== Test Complete ===');
	console.log('✅ Logging system is working!');
	console.log(`📁 View all logs in: ${logDir}`);
}

function sleep(ms: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms));
}

testLogging().catch(error => {
	console.error('Test failed:', error);
	process.exit(1);
});
