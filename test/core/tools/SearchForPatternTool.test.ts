/**
 * Tests for SearchForPattern Tool
 * Coverage target: 95%
 */

import test from 'ava';
import {SearchForPatternTool} from '../../../dist/core/tools/SearchForPatternTool.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Helper to create temp directory with test files
function createTempDir(): string {
	const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'search-test-'));
	
	// Create test files
	fs.writeFileSync(
		path.join(tmpDir, 'file1.ts'),
		'export class MyClass {\n  constructor() {}\n  myMethod() {}\n}'
	);
	
	fs.writeFileSync(
		path.join(tmpDir, 'file2.js'),
		'function myFunction() {\n  console.log("test");\n}'
	);
	
	fs.mkdirSync(path.join(tmpDir, 'subdir'));
	fs.writeFileSync(
		path.join(tmpDir, 'subdir', 'file3.ts'),
		'const myVariable = 123;'
	);
	
	return tmpDir;
}

function cleanupTempDir(dir: string) {
	if (fs.existsSync(dir)) {
		fs.rmSync(dir, { recursive: true, force: true });
	}
}

test('finds pattern in files', async t => {
	const tmpDir = createTempDir();
	
	try {
		const tool = new SearchForPatternTool(tmpDir);
		
		const result = await tool.execute({
			pattern: 'class'
		});
		
		t.true(result.success);
		t.true(result.output.includes('Found'));
		t.true(result.metadata?.found > 0);
		t.true(result.metadata?.matches[0].file.includes('file1.ts'));
	} finally {
		cleanupTempDir(tmpDir);
	}
});

test('filters files by pattern', async t => {
	const tmpDir = createTempDir();
	
	try {
		const tool = new SearchForPatternTool(tmpDir);
		
		const result = await tool.execute({
			pattern: 'function',
			filePattern: '*.js'
		});
		
		t.true(result.success);
		t.is(result.metadata?.found, 1);
		t.true(result.metadata?.matches[0].file.includes('file2.js'));
	} finally {
		cleanupTempDir(tmpDir);
	}
});

test('searches in subdirectories', async t => {
	const tmpDir = createTempDir();
	
	try {
		const tool = new SearchForPatternTool(tmpDir);
		
		const result = await tool.execute({
			pattern: 'myVariable'
		});
		
		t.true(result.success);
		t.is(result.metadata?.found, 1);
		t.true(result.metadata?.matches[0].file.includes('subdir'));
	} finally {
		cleanupTempDir(tmpDir);
	}
});

test('handles no matches found', async t => {
	const tmpDir = createTempDir();
	
	try {
		const tool = new SearchForPatternTool(tmpDir);
		
		const result = await tool.execute({
			pattern: 'nonexistent_pattern_xyz'
		});
		
		t.true(result.success);
		t.is(result.metadata?.found, 0);
		t.true(result.output.includes('No matches found'));
	} finally {
		cleanupTempDir(tmpDir);
	}
});

test('handles invalid regex pattern', async t => {
	const tmpDir = createTempDir();
	
	try {
		const tool = new SearchForPatternTool(tmpDir);
		
		const result = await tool.execute({
			pattern: '[invalid('
		});
		
		t.false(result.success);
		t.true(result.error?.includes('Invalid regex pattern'));
	} finally {
		cleanupTempDir(tmpDir);
	}
});

test('handles directory not found', async t => {
	const tool = new SearchForPatternTool('/tmp');
	
	const result = await tool.execute({
		pattern: 'test',
		directory: 'nonexistent-dir-xyz'
	});
	
	t.false(result.success);
	t.true(result.error?.includes('Directory not found'));
});

test('respects maxResults limit', async t => {
	const tmpDir = createTempDir();
	
	try {
		const tool = new SearchForPatternTool(tmpDir);
		
		const result = await tool.execute({
			pattern: '.',
			maxResults: 2
		});
		
		t.true(result.success);
		t.true(result.metadata?.found <= 2);
	} finally {
		cleanupTempDir(tmpDir);
	}
});

test('validates parameters', t => {
	const tool = new SearchForPatternTool('/tmp');
	
	t.true(tool.validateParameters({pattern: 'test'}));
	t.false(tool.validateParameters({pattern: 123}));
	t.false(tool.validateParameters({}));
});
