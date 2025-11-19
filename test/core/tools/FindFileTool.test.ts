/**
 * Tests for FindFile Tool
 * Coverage target: 95%
 */

import test from 'ava';
import {FindFileTool} from '../../../dist/core/tools/FindFileTool.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

function createTempDir(): string {
	const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'find-file-test-'));
	
	fs.writeFileSync(path.join(tmpDir, 'file1.ts'), 'content');
	fs.writeFileSync(path.join(tmpDir, 'file2.js'), 'content');
	fs.writeFileSync(path.join(tmpDir, 'test.txt'), 'content');
	
	fs.mkdirSync(path.join(tmpDir, 'subdir'));
	fs.writeFileSync(path.join(tmpDir, 'subdir', 'nested.ts'), 'content');
	
	return tmpDir;
}

function cleanupTempDir(dir: string) {
	if (fs.existsSync(dir)) {
		fs.rmSync(dir, { recursive: true, force: true });
	}
}

test('finds files by wildcard pattern', async t => {
	const tmpDir = createTempDir();
	
	try {
		const tool = new FindFileTool(tmpDir);
		
		const result = await tool.execute({
			pattern: '*.ts'
		});
		
		t.true(result.success);
		t.is(result.metadata?.found, 2);
		t.true(result.metadata?.files.some((f: string) => f.includes('file1.ts')));
		t.true(result.metadata?.files.some((f: string) => f.includes('nested.ts')));
	} finally {
		cleanupTempDir(tmpDir);
	}
});

test('finds files by exact name', async t => {
	const tmpDir = createTempDir();
	
	try {
		const tool = new FindFileTool(tmpDir);
		
		const result = await tool.execute({
			pattern: 'test.txt'
		});
		
		t.true(result.success);
		t.is(result.metadata?.found, 1);
		t.true(result.metadata?.files[0].includes('test.txt'));
	} finally {
		cleanupTempDir(tmpDir);
	}
});

test('handles no files found', async t => {
	const tmpDir = createTempDir();
	
	try {
		const tool = new FindFileTool(tmpDir);
		
		const result = await tool.execute({
			pattern: '*.nonexistent'
		});
		
		t.true(result.success);
		t.is(result.metadata?.found, 0);
		t.true(result.output.includes('No files found'));
	} finally {
		cleanupTempDir(tmpDir);
	}
});

test('handles directory not found', async t => {
	const tool = new FindFileTool('/tmp');
	
	const result = await tool.execute({
		pattern: '*.ts',
		directory: 'nonexistent-dir-xyz'
	});
	
	t.false(result.success);
	t.true(result.error?.includes('Directory not found'));
});

test('respects maxResults limit', async t => {
	const tmpDir = createTempDir();
	
	try {
		const tool = new FindFileTool(tmpDir);
		
		const result = await tool.execute({
			pattern: '*',
			maxResults: 2
		});
		
		t.true(result.success);
		t.true(result.metadata?.found <= 2);
	} finally {
		cleanupTempDir(tmpDir);
	}
});

test('validates parameters', t => {
	const tool = new FindFileTool('/tmp');
	
	t.true(tool.validateParameters({pattern: '*.ts'}));
	t.false(tool.validateParameters({pattern: 123}));
	t.false(tool.validateParameters({}));
});
