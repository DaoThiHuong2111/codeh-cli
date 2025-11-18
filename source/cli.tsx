#!/usr/bin/env node
import dotenv from 'dotenv';
import React from 'react';
import {render} from 'ink';
import meow from 'meow';
import {fileURLToPath} from 'url';
import {dirname, join} from 'path';
import {existsSync} from 'fs';
import App from './cli/app.js';
import {setupContainer} from './core/di/setup.js';
import {getLogger, cleanupOldLogs, generateRequestId} from './infrastructure/logging/Logger.js';
import {globalSandboxModeManager} from './infrastructure/process/SandboxModeManager.js';

// Load .env file from multiple locations (in priority order)
// 1. Package root (for development)
// 2. User home directory ~/.codeh/.env (for user-specific config)
// 3. Current working directory (legacy support)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageRoot = join(__dirname, '..');
const homeConfigPath = join(process.env.HOME || process.env.USERPROFILE || '', '.codeh', '.env');

// Suppress dotenv tips/warnings
process.env.DOTENV_CONFIG_SILENT = 'true';

// Try loading from package root first (development)
const packageEnvPath = join(packageRoot, '.env');
if (existsSync(packageEnvPath)) {
	dotenv.config({path: packageEnvPath, debug: false});
}

// Then try user home directory (user-specific settings)
if (existsSync(homeConfigPath)) {
	dotenv.config({path: homeConfigPath, override: false, debug: false});
}

// Finally, try current directory (legacy, lowest priority)
dotenv.config({override: false, debug: false});

// Initialize logger and cleanup old logs
const logger = getLogger();
cleanupOldLogs(7);

const cli = meow(
	`
	Usage
	  $ codeh

	Options
	  --version  Show version number
	  --help     Show help

	Examples
	  $ codeh
`,
	{
		importMeta: import.meta,
		flags: {
			version: {
				type: 'boolean',
				shortFlag: 'v',
			},
		},
	},
);

async function main() {
	const start = Date.now();
	const requestId = generateRequestId();
	logger.setRequestId(requestId);

	// Don't log here - wait until sessionId is set in HomePresenter
	// to avoid creating multiple log files

	try {
		// Setup DI container
		const container = await setupContainer();
		const duration = Date.now() - start;

		// First log will be written by HomePresenter after setSessionId()

		render(<App container={container} />, {
			exitOnCtrlC: false,
		});
	} catch (error) {
		const duration = Date.now() - start;
		logger.error('CLI', 'main', 'Failed to start application', {
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
			duration_ms: duration,
		});
		logger.flush();
		process.exit(1);
	}
}

// Cleanup on exit
process.on('beforeExit', async () => {
	logger.info('CLI', 'process', 'Application exiting');

	// Cleanup Docker sandbox container if running
	try {
		await globalSandboxModeManager.cleanup();
	} catch (error) {
		logger.error('CLI', 'process', 'Failed to cleanup sandbox container', {
			error: error instanceof Error ? error.message : String(error),
		});
	}

	logger.flush();
});

// Handle SIGINT (Ctrl+C) and SIGTERM
const handleExit = async (signal: string) => {
	logger.info('CLI', 'process', `Received ${signal}, cleaning up...`);

	// Cleanup Docker sandbox container
	try {
		await globalSandboxModeManager.cleanup();
	} catch (error) {
		logger.error('CLI', 'process', 'Failed to cleanup sandbox container', {
			error: error instanceof Error ? error.message : String(error),
		});
	}

	logger.flush();
	process.exit(0);
};

process.on('SIGINT', () => handleExit('SIGINT'));
process.on('SIGTERM', () => handleExit('SIGTERM'));

main();
