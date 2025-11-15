#!/usr/bin/env tsx
/**
 * Test to verify EnvConfigRepository and Logger use the same logic
 */

import {EnvConfigRepository} from '../source/infrastructure/config/EnvConfigRepository';
import {isLoggingEnabled} from '../source/infrastructure/config/EnvUtils';

console.log('=== Testing EnvConfigRepository & Logger Consistency ===\n');

async function test() {
	const repo = new EnvConfigRepository();

	// Test 1: EnvConfigRepository.getLoggingEnabled()
	const loggingFromRepo = await repo.getLoggingEnabled();
	console.log('1️⃣  EnvConfigRepository.getLoggingEnabled():', loggingFromRepo);

	// Test 2: Shared utility function
	const loggingFromUtil = isLoggingEnabled();
	console.log('2️⃣  isLoggingEnabled() utility:', loggingFromUtil);

	// Test 3: Verify they match
	if (loggingFromRepo === loggingFromUtil) {
		console.log('\n✅ SUCCESS: Both use the same logic!');
	} else {
		console.log('\n❌ FAILURE: Different results!');
		process.exit(1);
	}

	// Test 4: Check with CODEH_LOGGING env var
	console.log('\n3️⃣  CODEH_LOGGING env var:', process.env.CODEH_LOGGING);

	if (process.env.CODEH_LOGGING) {
		if (loggingFromRepo === true) {
			console.log('✅ Correctly detected as enabled');
		} else {
			console.log('❌ Should be enabled!');
			process.exit(1);
		}
	} else {
		if (loggingFromRepo === false) {
			console.log('✅ Correctly detected as disabled');
		} else {
			console.log('❌ Should be disabled!');
			process.exit(1);
		}
	}

	console.log('\n🎉 All tests passed! EnvConfigRepository and Logger are consistent.');
}

test().catch(error => {
	console.error('Test failed:', error);
	process.exit(1);
});
