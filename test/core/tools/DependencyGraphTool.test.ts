/**
 * Tests for DependencyGraphTool
 * Coverage target: 95%
 */

import test from 'ava';
import {DependencyGraphTool} from '../../../dist/core/tools/DependencyGraphTool.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

let tmpDir: string;
let tool: DependencyGraphTool;

test.beforeEach(t => {
	(t.context as any).tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dep-graph-test-'));
	(t.context as any).tool = new DependencyGraphTool((t.context as any).tmpDir);
});

test.afterEach(t => {
	const dir = (t.context as any).tmpDir;
	if (dir) {
		fs.rmSync(dir, {recursive: true, force: true});
	}
});

test('validates parameters', t => {
	const tool = (t.context as any).tool;
	t.true(tool.validateParameters({}));
});

test('returns error if no file or module provided', async t => {
	const tool = (t.context as any).tool;
	const result = await tool.execute({});
	t.false(result.success);
	t.true(result.output.includes('Please provide either filePath or module'));
});

test('returns error if file not found', async t => {
	const tmpDir = (t.context as any).tmpDir;
	const tool = (t.context as any).tool;
	const result = await tool.execute({filePath: path.join(tmpDir, 'nonexistent.ts')});
	t.false(result.success);
	t.true(result.output.includes('Path not found'));
});

test('analyzes imports correctly', async t => {
	const tmpDir = (t.context as any).tmpDir;
	const tool = (t.context as any).tool;
	const filePath = path.join(tmpDir, 'test.ts');
	const content = `
		import { Foo } from './foo';
		import * as bar from './bar';
		import 'polyfills';
	`;
	fs.writeFileSync(filePath, content);

	const result = await tool.execute({filePath});

	t.true(result.success);
	t.is(result.metadata?.imports.length, 3);
	t.true(result.metadata?.imports.includes('./foo'));
	t.true(result.metadata?.imports.includes('./bar'));
	t.true(result.metadata?.imports.includes('polyfills'));
});

test('analyzes exports correctly', async t => {
	const tmpDir = (t.context as any).tmpDir;
	const tool = (t.context as any).tool;
	const filePath = path.join(tmpDir, 'test.ts');
	const content = `
		export const a = 1;
		export function b() {}
		export class C {}
		const d = 2;
	`;
	fs.writeFileSync(filePath, content);

	const result = await tool.execute({filePath});

	t.true(result.success);
	t.true(result.metadata?.exports.includes('b'));
	t.true(result.metadata?.exports.includes('C'));
});

test('analyzes named exports', async t => {
	const tmpDir = (t.context as any).tmpDir;
	const tool = (t.context as any).tool;
	const filePath = path.join(tmpDir, 'test.ts');
	const content = `
		const a = 1;
		const b = 2;
		export { a, b };
	`;
	fs.writeFileSync(filePath, content);

	const result = await tool.execute({filePath});

	t.true(result.success);
	t.true(result.metadata?.exports.includes('a'));
	t.true(result.metadata?.exports.includes('b'));
});

test('handles module path correctly', async t => {
	const tmpDir = (t.context as any).tmpDir;
	const tool = (t.context as any).tool;
	const moduleDir = path.join(tmpDir, 'src/auth');
	fs.mkdirSync(moduleDir, {recursive: true});
	const filePath = path.join(moduleDir, 'index.ts');
	fs.writeFileSync(filePath, 'import "./login";');

	const result = await tool.execute({module: 'src/auth/index.ts'});
	
	t.true(result.success);
	t.is(result.metadata?.imports.length, 1);
});
