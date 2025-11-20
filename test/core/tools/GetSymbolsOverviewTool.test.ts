/**
 * Tests for GetSymbolsOverviewTool
 * Coverage target: 95%
 */

import test from 'ava';
import sinon from 'sinon';
import {GetSymbolsOverviewTool} from '../../../dist/core/tools/GetSymbolsOverviewTool.js';
import type {ISymbolAnalyzer} from '../../../dist/core/domain/interfaces/ISymbolAnalyzer.js';

// Mock Symbol class
class MockSymbol {
	public name: string;
	public kind: string;
	public location: {startLine: number};
	public signature: string;

	constructor(
		name: string,
		kind: string,
		location: {startLine: number},
		signature: string
	) {
		this.name = name;
		this.kind = kind;
		this.location = location;
		this.signature = signature;
	}

	getKindName() { return this.kind; }
	getSignature() { return this.signature; }
	toJSON() { return { name: this.name, kind: this.kind }; }
}

test('validates parameters', t => {
	const tool = new GetSymbolsOverviewTool('/root');
	t.true(tool.validateParameters({filePath: 'test.ts'}));
	t.false(tool.validateParameters({}));
});

test('gets symbols overview correctly', async t => {
	const mockAnalyzer = {
		getSymbolsOverview: sinon.stub().returns([
			new MockSymbol('MyClass', 'Class', {startLine: 10}, 'class MyClass'),
			new MockSymbol('myFunc', 'Function', {startLine: 20}, 'function myFunc()')
		])
	} as unknown as ISymbolAnalyzer;

	const tool = new GetSymbolsOverviewTool('/root', mockAnalyzer);
	const result = await tool.execute({filePath: 'test.ts'});

	t.true(result.success);
	t.true(result.output.includes('MyClass'));
	t.true(result.output.includes('myFunc'));
	t.true(result.output.includes('Class'));
	t.true(result.output.includes('Function'));
	t.is(result.metadata?.count, 2);
});

test('handles empty symbols list', async t => {
	const mockAnalyzer = {
		getSymbolsOverview: sinon.stub().returns([])
	} as unknown as ISymbolAnalyzer;

	const tool = new GetSymbolsOverviewTool('/root', mockAnalyzer);
	const result = await tool.execute({filePath: 'empty.ts'});

	t.true(result.success);
	t.true(result.output.includes('No symbols found'));
});

test('handles errors gracefully', async t => {
	const mockAnalyzer = {
		getSymbolsOverview: sinon.stub().throws(new Error('Analysis failed'))
	} as unknown as ISymbolAnalyzer;

	const tool = new GetSymbolsOverviewTool('/root', mockAnalyzer);
	const result = await tool.execute({filePath: 'error.ts'});

	t.false(result.success);
	t.false(result.success);
	t.true(result.error?.includes('Failed to get symbols overview'));
	t.true(result.error?.includes('Analysis failed'));
});
