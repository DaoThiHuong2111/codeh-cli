#!/usr/bin/env node
/**
 * Script to automatically add logging to TypeScript files
 * Usage: node scripts/add-logging.js <file-path>
 */

import fs from 'fs';
import path from 'path';

const filePath = process.argv[2];

if (!filePath) {
	console.error('Usage: node scripts/add-logging.js <file-path>');
	process.exit(1);
}

const content = fs.readFileSync(filePath, 'utf-8');
const lines = content.split('\n');

// Check if logger is already imported
const hasLoggerImport = content.includes('getLogger');

let result = lines;

// Add logger import if not exists
if (!hasLoggerImport) {
	// Find the last import statement
	let lastImportIndex = -1;
	for (let i = 0; i < lines.length; i++) {
		if (lines[i].trim().startsWith('import ')) {
			lastImportIndex = i;
		}
	}

	if (lastImportIndex !== -1) {
		// Insert logger import after last import
		result.splice(
			lastImportIndex + 1,
			0,
			"import {getLogger} from '../../logging/Logger.js';",
			'',
			'const logger = getLogger();',
		);
	}
}

// Write back
fs.writeFileSync(filePath, result.join('\n'));

console.log(`Added logging imports to ${filePath}`);
console.log('Note: You still need to add logging calls manually to each function');
