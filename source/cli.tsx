#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import meow from 'meow';
import App from './cli/app';
import { setupContainer } from './core/di/setup';

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
	}
);

async function main() {
	try {
		// Setup DI container
		const container = await setupContainer();

		// Render app
		render(<App container={container} />);
	} catch (error) {
		console.error('Failed to start application:', error);
		process.exit(1);
	}
}

main();
