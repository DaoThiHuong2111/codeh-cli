/**
 * Tests for ReplaceRegexTool
 * Coverage target: 95%
 */

import test from 'ava';
import {ReplaceRegexTool} from '../../../dist/core/tools/ReplaceRegexTool.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

let tmpDir: string;
let tool: ReplaceRegexTool;

test.beforeEach(t => {
	(t.context as any).tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'replace-regex-test-'));
	(t.context as any).tool = new ReplaceRegexTool((t.context as any).tmpDir);
});

test.afterEach(t => {
	const dir = (t.context as any).tmpDir;
	if (dir) {
		fs.rmSync(dir, {recursive: true, force: true});
	}
});

test('validates parameters', t => {
	const tool = (t.context as any).tool;
	t.true(tool.validateParameters({
		filePath: 'test.txt',
		pattern: 'foo',
		replacement: 'bar'
	}));
	t.false(tool.validateParameters({}));
});

test('replaces content matching regex', async t => {
	const tmpDir = (t.context as any).tmpDir;
	const tool = (t.context as any).tool;
	const filePath = path.join(tmpDir, 'test.txt');
	fs.writeFileSync(filePath, 'foo bar foo baz');

	const result = await tool.execute({
		filePath: 'test.txt',
		pattern: 'foo',
		replacement: 'qux'
	});

	t.true(result.success);
	t.is(result.metadata?.matchesReplaced, 2);
	
	const content = fs.readFileSync(filePath, 'utf8');
	t.is(content, 'qux bar qux baz');
});

test('supports capture groups', async t => {
	const tmpDir = (t.context as any).tmpDir;
	const tool = (t.context as any).tool;
	const filePath = path.join(tmpDir, 'test.txt');
	fs.writeFileSync(filePath, 'Hello World');

	const result = await tool.execute({
		filePath: 'test.txt',
		pattern: '(\\w+) (\\w+)',
		replacement: '$2 $1'
	});

	t.true(result.success);
	
	const content = fs.readFileSync(filePath, 'utf8');
	t.is(content, 'World Hello');
});

test('handles regex flags', async t => {
	const tmpDir = (t.context as any).tmpDir;
	const tool = (t.context as any).tool;
	const filePath = path.join(tmpDir, 'test.txt');
	fs.writeFileSync(filePath, 'foo FOO Foo');

	const result = await tool.execute({
		filePath: 'test.txt',
		pattern: 'foo',
		replacement: 'bar',
		flags: 'gi' // global + case-insensitive
	});

	t.true(result.success);
	t.is(result.metadata?.matchesReplaced, 3);
	
	const content = fs.readFileSync(filePath, 'utf8');
	t.is(content, 'bar bar bar');
});

test('returns error if file not found', async t => {
	const tool = (t.context as any).tool;
	const result = await tool.execute({
		filePath: 'nonexistent.txt',
		pattern: 'foo',
		replacement: 'bar'
	});

	t.false(result.success);
	t.true(result.error?.includes('File not found'));
});

test('returns error for invalid regex', async t => {
	const tmpDir = (t.context as any).tmpDir;
	const tool = (t.context as any).tool;
	const filePath = path.join(tmpDir, 'test.txt');
	fs.writeFileSync(filePath, 'content');

	const result = await tool.execute({
		filePath: 'test.txt',
		pattern: '(', // Invalid regex
		replacement: 'bar'
	});

	t.false(result.success);
	t.true(result.error?.includes('Invalid regex pattern'));
});

test('reports no matches found', async t => {
	const tmpDir = (t.context as any).tmpDir;
	const tool = (t.context as any).tool;
	const filePath = path.join(tmpDir, 'test.txt');
	fs.writeFileSync(filePath, 'content');

	const result = await tool.execute({
		filePath: 'test.txt',
		pattern: 'foo',
		replacement: 'bar'
	});

	t.true(result.success);
	t.is(result.metadata?.matchesFound, 0);
	t.true(result.output.includes('No matches found'));
});
