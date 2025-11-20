/**
 * Tests for InsertBeforeSymbolTool
 * Coverage target: 95%
 */

import test from 'ava';
import sinon from 'sinon';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {InsertBeforeSymbolTool} from '../../../dist/core/tools/InsertBeforeSymbolTool.js';
import type {ISymbolAnalyzer} from '../../../dist/core/domain/interfaces/ISymbolAnalyzer.js';

// Mock Symbol class
class MockSymbol {
	public name: string;
	public location: {startLine: number};

	constructor(name: string, startLine: number) {
		this.name = name;
		this.location = {startLine};
	}
}

test.beforeEach(t => {
	(t.context as any).tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'insert-before-test-'));
});

test.afterEach(t => {
	const dir = (t.context as any).tmpDir;
	if (dir) {
		fs.rmSync(dir, {recursive: true, force: true});
	}
});

test('validates parameters', t => {
	const mockAnalyzer = {} as ISymbolAnalyzer;
	const tool = new InsertBeforeSymbolTool('/root', mockAnalyzer);
	
	t.true(tool.validateParameters({
		namePath: 'foo',
		filePath: 'test.ts',
		content: 'bar'
	}));
	t.false(tool.validateParameters({}));
});

test('inserts content before symbol', async t => {
	const tmpDir = (t.context as any).tmpDir;
	const filePath = path.join(tmpDir, 'test.ts');
	const fileContent = `
class Foo {
  method1() {}
}
`.trim();
	fs.writeFileSync(filePath, fileContent);

	const mockAnalyzer = {
		findSymbol: sinon.stub().returns([
			new MockSymbol('method1', 2) // method1 starts at line 2 (1-based)
		])
	} as unknown as ISymbolAnalyzer;

	const tool = new InsertBeforeSymbolTool(tmpDir, mockAnalyzer);
	const result = await tool.execute({
		namePath: 'method1',
		filePath: 'test.ts',
		content: '  // Before method1'
	});

	t.true(result.success);
	
	const newContent = fs.readFileSync(filePath, 'utf8');
	const expectedContent = `
class Foo {
  // Before method1
  method1() {}
}
`.trim();

	// Normalize line endings and whitespace for comparison
	const normalize = (s: string) => s.replace(/\s+/g, ' ').trim();
	t.is(normalize(newContent), normalize(expectedContent));
});

test('fails if symbol not found', async t => {
	const tmpDir = (t.context as any).tmpDir;
	const mockAnalyzer = {
		findSymbol: sinon.stub().returns([])
	} as unknown as ISymbolAnalyzer;

	const tool = new InsertBeforeSymbolTool(tmpDir, mockAnalyzer);
	const result = await tool.execute({
		namePath: 'unknown',
		filePath: 'test.ts',
		content: 'foo'
	});

	t.false(result.success);
	t.true(result.error?.includes('Symbol not found'));
});

test('handles errors gracefully', async t => {
	const tmpDir = (t.context as any).tmpDir;
	const mockAnalyzer = {
		findSymbol: sinon.stub().throws(new Error('Analysis failed'))
	} as unknown as ISymbolAnalyzer;

	const tool = new InsertBeforeSymbolTool(tmpDir, mockAnalyzer);
	const result = await tool.execute({
		namePath: 'error',
		filePath: 'test.ts',
		content: 'foo'
	});

	t.false(result.success);
	t.true(result.error?.includes('Failed to insert before symbol'));
});
