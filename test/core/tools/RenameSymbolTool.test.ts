/**
 * Tests for RenameSymbolTool
 * Coverage target: 95%
 */

import test from 'ava';
import sinon from 'sinon';
import {RenameSymbolTool} from '../../../dist/core/tools/RenameSymbolTool.js';
import type {ISymbolAnalyzer} from '../../../dist/core/domain/interfaces/ISymbolAnalyzer.js';

// Mock Symbol class
class MockSymbol {
	public name: string;
	public namePath: string;
	public kind: string;
	public location: {startLine: number; startColumn: number};

	constructor(
		name: string,
		namePath: string,
		kind: string,
		location: {startLine: number; startColumn: number}
	) {
		this.name = name;
		this.namePath = namePath;
		this.kind = kind;
		this.location = location;
	}
}

test('validates parameters', t => {
	const mockAnalyzer = {} as ISymbolAnalyzer;
	const tool = new RenameSymbolTool('/root', mockAnalyzer);
	
	t.true(tool.validateParameters({
		namePath: 'foo',
		filePath: 'test.ts',
		newName: 'bar'
	}));
	
	t.false(tool.validateParameters({}));
	t.false(tool.validateParameters({namePath: 'foo'}));
});

test('renames symbol correctly', async t => {
	const mockAnalyzer = {
		findSymbol: sinon.stub().returns([
			new MockSymbol('oldName', 'oldName', 'Variable', {startLine: 1, startColumn: 1})
		]),
		renameSymbol: sinon.stub().returns([
			{
				fileName: 'test.ts',
				textSpan: {start: 0, length: 7, line: 0, character: 0},
				contextSnippet: 'const oldName = 1;'
			}
		])
	} as unknown as ISymbolAnalyzer;

	const tool = new RenameSymbolTool('/root', mockAnalyzer);
	const result = await tool.execute({
		namePath: 'oldName',
		filePath: 'test.ts',
		newName: 'newName'
	});

	t.true(result.success);
	t.true(result.output.includes('Renamed "oldName" → "newName"'));
	t.is(result.metadata?.filesAffected, 1);
});

test('fails if symbol not found', async t => {
	const mockAnalyzer = {
		findSymbol: sinon.stub().returns([])
	} as unknown as ISymbolAnalyzer;

	const tool = new RenameSymbolTool('/root', mockAnalyzer);
	const result = await tool.execute({
		namePath: 'unknown',
		filePath: 'test.ts',
		newName: 'newName'
	});

	t.false(result.success);
	t.true(result.error?.includes('Symbol not found'));
});

test('fails if rename locations not found', async t => {
	const mockAnalyzer = {
		findSymbol: sinon.stub().returns([
			new MockSymbol('oldName', 'oldName', 'Variable', {startLine: 1, startColumn: 1})
		]),
		renameSymbol: sinon.stub().returns([])
	} as unknown as ISymbolAnalyzer;

	const tool = new RenameSymbolTool('/root', mockAnalyzer);
	const result = await tool.execute({
		namePath: 'oldName',
		filePath: 'test.ts',
		newName: 'newName'
	});

	t.false(result.success);
	t.true(result.error?.includes('Could not find rename locations'));
});

test('validates new name format', async t => {
	const mockAnalyzer = {} as ISymbolAnalyzer;
	const tool = new RenameSymbolTool('/root', mockAnalyzer);
	
	const result = await tool.execute({
		namePath: 'oldName',
		filePath: 'test.ts',
		newName: '123invalid'
	});

	t.false(result.success);
	t.true(result.error?.includes('Invalid new name'));
});

test('handles errors gracefully', async t => {
	const mockAnalyzer = {
		findSymbol: sinon.stub().throws(new Error('Analysis failed'))
	} as unknown as ISymbolAnalyzer;

	const tool = new RenameSymbolTool('/root', mockAnalyzer);
	const result = await tool.execute({
		namePath: 'error',
		filePath: 'test.ts',
		newName: 'newName'
	});

	t.false(result.success);
	t.true(result.error?.includes('Failed to rename symbol'));
});
