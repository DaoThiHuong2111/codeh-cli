/**
 * Tests for SymbolSearchTool
 * Coverage target: 95%
 */

import test from 'ava';
import sinon from 'sinon';
import {SymbolSearchTool} from '../../../dist/core/tools/SymbolSearchTool.js';
import type {ISymbolAnalyzer} from '../../../dist/core/domain/interfaces/ISymbolAnalyzer.js';

// Mock Symbol class
class MockSymbol {
	public name: string;
	public namePath: string;
	public kind: string;
	public location: {relativePath: string; startLine: number};
	public body?: string;
	public children: any[] = [];

	constructor(
		name: string,
		namePath: string,
		kind: string,
		location: {relativePath: string; startLine: number},
		body?: string
	) {
		this.name = name;
		this.namePath = namePath;
		this.kind = kind;
		this.location = location;
		this.body = body;
	}

	getKindName() {
		return this.kind;
	}

	toJSON() {
		return {
			name: this.name,
			namePath: this.namePath,
			kind: this.kind,
			location: this.location,
			body: this.body
		};
	}
}

test('validates parameters', t => {
	const mockAnalyzer = {} as ISymbolAnalyzer;
	const tool = new SymbolSearchTool('/root', mockAnalyzer);
	
	t.true(tool.validateParameters({namePattern: 'foo'}));
	t.false(tool.validateParameters({}));
});

test('searches symbols successfully', async t => {
	const mockAnalyzer = {
		findSymbol: sinon.stub().returns([
			new MockSymbol('Foo', 'Foo', 'Class', {relativePath: 'test.ts', startLine: 1})
		])
	} as unknown as ISymbolAnalyzer;

	const tool = new SymbolSearchTool('/root', mockAnalyzer);
	const result = await tool.execute({namePattern: 'Foo'});

	t.true(result.success);
	t.is(result.metadata?.count, 1);
	t.true(result.output.includes('Foo'));
	t.true(result.output.includes('Class'));
	t.true(result.output.includes('test.ts:1'));
});

test('searches symbols with options', async t => {
	const mockAnalyzer = {
		findSymbol: sinon.stub().returns([
			new MockSymbol('Foo', 'Foo', 'Class', {relativePath: 'test.ts', startLine: 1}, 'class Foo {}')
		])
	} as unknown as ISymbolAnalyzer;

	const tool = new SymbolSearchTool('/root', mockAnalyzer);
	const result = await tool.execute({
		namePattern: 'Foo',
		filePath: 'test.ts',
		includeBody: true,
		depth: 1,
		substringMatching: true
	});

	t.true(result.success);
	t.true((mockAnalyzer.findSymbol as sinon.SinonStub).calledWith('Foo', {
		filePath: 'test.ts',
		includeBody: true,
		depth: 1,
		substringMatching: true
	}));
	t.true(result.output.includes('Preview: class Foo {}'));
});

test('handles no symbols found', async t => {
	const mockAnalyzer = {
		findSymbol: sinon.stub().returns([])
	} as unknown as ISymbolAnalyzer;

	const tool = new SymbolSearchTool('/root', mockAnalyzer);
	const result = await tool.execute({namePattern: 'Unknown'});

	t.true(result.success);
	t.is(result.metadata?.count, 0);
	t.true(result.output.includes('No symbols found'));
});

test('handles errors gracefully', async t => {
	const mockAnalyzer = {
		findSymbol: sinon.stub().throws(new Error('Analysis failed'))
	} as unknown as ISymbolAnalyzer;

	const tool = new SymbolSearchTool('/root', mockAnalyzer);
	const result = await tool.execute({namePattern: 'Error'});

	t.false(result.success);
	t.true(result.error?.includes('Failed to search symbols'));
});
