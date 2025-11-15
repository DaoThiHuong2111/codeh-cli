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

// Load .env file from multiple locations (in priority order)
// 1. Package root (for development)
// 2. User home directory ~/.codeh/.env (for user-specific config)
// 3. Current working directory (legacy support)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageRoot = join(__dirname, '..');
const homeConfigPath = join(process.env.HOME || process.env.USERPROFILE || '', '.codeh', '.env');

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

	logger.info('CLI', 'main', 'Application starting', {
		version: cli.pkg?.version,
		node_version: process.version,
		platform: process.platform,
	});

	try {
		// Setup DI container
		logger.debug('CLI', 'main', 'Setting up DI container');
		const container = await setupContainer();
		const duration = Date.now() - start;

		logger.info('CLI', 'main', 'Application started successfully', {
			duration_ms: duration,
		});

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
process.on('beforeExit', () => {
	logger.info('CLI', 'process', 'Application exiting');
	logger.flush();
});

main();
