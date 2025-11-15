/**
 * Test: Multiple setSessionId() calls (like when user creates new session with /new)
 * This simulates the real app flow where:
 * 1. Constructor sets initial sessionId
 * 2. User runs /new command → startNewSession() sets new sessionId
 *
 * Expected: Only ONE log file should be created (using first sessionId)
 */

import {getLogger} from '../source/infrastructure/logging/Logger.js';
import {existsSync, readdirSync, readFileSync, unlinkSync} from 'fs';
import {join} from 'path';
import {homedir} from 'os';

const LOGS_DIR = join(homedir(), '.codeh', 'logs');

function getLogFiles(): string[] {
	if (!existsSync(LOGS_DIR)) return [];
	return readdirSync(LOGS_DIR).filter(f => f.startsWith('logs_') && f.endsWith('.json'));
}

function cleanupLogs() {
	const files = getLogFiles();
	files.forEach(f => {
		try {
			unlinkSync(join(LOGS_DIR, f));
		} catch {}
	});
}

async function runTest() {
	console.log('=== Testing Multiple setSessionId() Calls (NEW SESSION FLOW) ===\n');

	// Debug environment
	console.log('🐛 DEBUG INFO:');
	console.log('   CODEH_LOGGING env:', process.env.CODEH_LOGGING);
	console.log('   Logs directory:', LOGS_DIR);
	console.log('   Logs dir exists:', existsSync(LOGS_DIR));
	console.log('');

	cleanupLogs();

	const logger = getLogger();
	console.log('🐛 Logger type:', logger.constructor.name);
	console.log('   Has setSessionId:', typeof (logger as any).setSessionId);
	console.log('');

	const sessionId1 = `1111111111111_aaaaaaaaa`;
	const sessionId2 = `2222222222222_bbbbbbbbb`;

	console.log('1️⃣  Initial state');
	console.log('   Files before:', getLogFiles().length);

	console.log('\n2️⃣  Set sessionId (first time - like constructor)');
	console.log('   SessionId:', sessionId1);
	logger.setSessionId(sessionId1);
	console.log('   Files after setSessionId:', getLogFiles().length);

	console.log('\n3️⃣  Write first log');
	logger.info('Test', 'test', 'First log with session1');
	logger.flush();
	await new Promise(resolve => setTimeout(resolve, 100));
	const filesAfterFirstLog = getLogFiles();
	console.log('   Files after first log:', filesAfterFirstLog.length);
	console.log('   File:', filesAfterFirstLog[0]);

	console.log('\n4️⃣  User creates new session - Set sessionId (second time - like /new)');
	console.log('   SessionId:', sessionId2);
	logger.setSessionId(sessionId2); // ← THIS SHOULD BE IGNORED!
	await new Promise(resolve => setTimeout(resolve, 100));
	console.log('   Files after second setSessionId:', getLogFiles().length);

	console.log('\n5️⃣  Write another log (should go to SAME file)');
	logger.info('Test', 'test', 'Second log - should use session1 not session2');
	logger.flush();
	await new Promise(resolve => setTimeout(resolve, 100));

	console.log('\n6️⃣  Write third log');
	logger.info('Test', 'test', 'Third log');
	logger.flush();
	await new Promise(resolve => setTimeout(resolve, 100));

	// Final flush to ensure all logs are written
	logger.flush();
	await new Promise(resolve => setTimeout(resolve, 200));

	console.log('\n=== Results ===');
	const finalFiles = getLogFiles();
	console.log('Files created:', finalFiles.length);

	if (finalFiles.length === 1) {
		console.log('✅ SUCCESS: Only ONE log file created!');
		console.log('   File:', finalFiles[0]);

		// Check which sessionId was used
		if (finalFiles[0].includes(sessionId1)) {
			console.log('✅ File uses FIRST session ID (correct!)');
			console.log('✅ Second setSessionId() was IGNORED (correct!)');
		} else if (finalFiles[0].includes(sessionId2)) {
			console.log('❌ FAIL: File uses SECOND session ID (wrong!)');
			console.log('❌ Second setSessionId() was NOT ignored (bug!)');
			process.exit(1);
		}

		// Count log entries
		const logContent = readFileSync(join(LOGS_DIR, finalFiles[0]), 'utf-8');
		const entries = logContent.trim().split('\n').filter(l => l.trim());
		console.log(`✅ Log entries: ${entries.length} (expected 3)`);

		if (entries.length === 3) {
			console.log('\n🎉 Perfect! Multiple setSessionId() calls handled correctly!');
			console.log('   Only ONE file created with FIRST sessionId');
			console.log('   All logs went to the same file');
		} else {
			console.log(`\n⚠️  Warning: Expected 3 log entries, got ${entries.length}`);
		}

	} else if (finalFiles.length > 1) {
		console.log('❌ FAIL: Multiple files created!');
		console.log('   Files:', finalFiles);
		console.log('\n❌ Bug: Second setSessionId() created a new file!');
		process.exit(1);
	} else {
		console.log('❌ FAIL: No files created!');
		process.exit(1);
	}
}

runTest().catch(err => {
	console.error('Test failed:', err);
	process.exit(1);
});
