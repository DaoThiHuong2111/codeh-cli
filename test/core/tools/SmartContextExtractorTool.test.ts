/**
 * Tests for SmartContextExtractorTool
 * Coverage target: 95%
 */

import test from 'ava';
import sinon from 'sinon';
import {SmartContextExtractorTool} from '../../../dist/core/tools/SmartContextExtractorTool.js';
import type {ISymbolAnalyzer} from '../../../dist/core/domain/interfaces/ISymbolAnalyzer.js';

// Mock Symbol class
class MockSymbol {
	public name: string;
	public kind: string;
	public location: {relativePath: string; startLine: number};
	public body?: string;
	public children: any[] = [];

	constructor(
		name: string,
		kind: string,
		location: {relativePath: string; startLine: number},
		body?: string
	) {
		this.name = name;
		this.kind = kind;
		this.location = location;
		this.body = body;
	}
}

test('validates parameters', t => {
	const mockAnalyzer = {} as ISymbolAnalyzer;
	const tool = new SmartContextExtractorTool('/root', mockAnalyzer);
	
	t.true(tool.validateParameters({}));
});

test('extracts context successfully', async t => {
	const mockSymbol = new MockSymbol('Foo', 'Class', {relativePath: 'test.ts', startLine: 1}, 'class Foo {}');
	const mockAnalyzer = {
		findSymbol: sinon.stub().returns([mockSymbol]),
		findReferences: sinon.stub().returns([
			{
				symbol: new MockSymbol('bar', 'Function', {relativePath: 'other.ts', startLine: 10}),
				line: 12,
				contentAroundReference: 'new Foo()'
			}
		]),
		getTypeInformation: sinon.stub().returns({
			typeString: 'Foo',
			isOptional: false,
			isAsync: false,
			signature: 'class Foo'
		})
	} as unknown as ISymbolAnalyzer;

	const tool = new SmartContextExtractorTool('/root', mockAnalyzer);
	const result = await tool.execute({
		filePath: 'test.ts',
		symbolName: 'Foo'
	});

	t.true(result.success);
	t.truthy(result.metadata?.definition);
	t.is(result.metadata?.definition.name, 'Foo');
	t.truthy(result.metadata?.callers);
	t.is(result.metadata?.callers.length, 1);
	t.truthy(result.metadata?.typeInfo);
	t.is(result.metadata?.typeInfo.type, 'Foo');
});

test('handles symbol not found', async t => {
	const mockAnalyzer = {
		findSymbol: sinon.stub().returns([])
	} as unknown as ISymbolAnalyzer;

	const tool = new SmartContextExtractorTool('/root', mockAnalyzer);
	const result = await tool.execute({
		filePath: 'test.ts',
		symbolName: 'Unknown'
	});

	t.false(result.success);
	t.true(result.output.includes('Symbol "Unknown" not found'));
});

test('handles errors gracefully', async t => {
	const mockAnalyzer = {
		findSymbol: sinon.stub().throws(new Error('Analysis failed'))
	} as unknown as ISymbolAnalyzer;

	const tool = new SmartContextExtractorTool('/root', mockAnalyzer);
	const result = await tool.execute({
		filePath: 'test.ts',
		symbolName: 'Error'
	});

	t.false(result.success);
	t.true(result.output.includes('Error extracting context'));
});

test('respects include options', async t => {
	const mockSymbol = new MockSymbol('Foo', 'Class', {relativePath: 'test.ts', startLine: 1});
	const mockAnalyzer = {
		findSymbol: sinon.stub().returns([mockSymbol]),
		findReferences: sinon.stub().returns([]),
		getTypeInformation: sinon.stub().returns({})
	} as unknown as ISymbolAnalyzer;

	const tool = new SmartContextExtractorTool('/root', mockAnalyzer);
	const result = await tool.execute({
		filePath: 'test.ts',
		symbolName: 'Foo',
		includeCallers: false,
		includeTypes: false
	});

	t.true(result.success);
	t.is(result.metadata?.callers.length, 0);
	t.is(result.metadata?.typeInfo, null);
	t.true((mockAnalyzer.findReferences as sinon.SinonStub).notCalled);
	t.true((mockAnalyzer.getTypeInformation as sinon.SinonStub).notCalled);
});
