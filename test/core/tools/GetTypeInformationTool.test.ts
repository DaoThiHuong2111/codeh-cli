/**
 * Tests for GetTypeInformationTool
 * Coverage target: 95%
 */

import test from 'ava';
import sinon from 'sinon';
import {GetTypeInformationTool} from '../../../dist/core/tools/GetTypeInformationTool.js';
import type {ISymbolAnalyzer} from '../../../dist/core/domain/interfaces/ISymbolAnalyzer.js';

test('validates parameters', t => {
	const mockAnalyzer = {} as ISymbolAnalyzer;
	const tool = new GetTypeInformationTool('/root', mockAnalyzer);
	
	t.true(tool.validateParameters({filePath: 'test.ts', symbolName: 'foo'}));
	t.false(tool.validateParameters({filePath: 'test.ts'})); // Missing symbolName
	t.false(tool.validateParameters({symbolName: 'foo'})); // Missing filePath
});

test('gets type information correctly', async t => {
	const mockAnalyzer = {
		getTypeInformation: sinon.stub().returns({
			typeString: 'string',
			kind: 'variable',
			isOptional: false,
			isAsync: false,
			documentation: 'A test variable',
			signature: 'const foo: string'
		})
	} as unknown as ISymbolAnalyzer;

	const tool = new GetTypeInformationTool('/root', mockAnalyzer);
	const result = await tool.execute({filePath: 'test.ts', symbolName: 'foo'});

	t.true(result.success);
	t.is(result.metadata?.typeString, 'string');
	t.is(result.metadata?.kind, 'variable');
	t.is(result.metadata?.documentation, 'A test variable');
});

test('handles symbol not found', async t => {
	const mockAnalyzer = {
		getTypeInformation: sinon.stub().returns(null)
	} as unknown as ISymbolAnalyzer;

	const tool = new GetTypeInformationTool('/root', mockAnalyzer);
	const result = await tool.execute({filePath: 'test.ts', symbolName: 'unknown'});

	t.false(result.success);
	t.true(result.output.includes('Type information not found'));
});

test('handles errors gracefully', async t => {
	const mockAnalyzer = {
		getTypeInformation: sinon.stub().throws(new Error('Type check failed'))
	} as unknown as ISymbolAnalyzer;

	const tool = new GetTypeInformationTool('/root', mockAnalyzer);
	const result = await tool.execute({filePath: 'test.ts', symbolName: 'error'});

	t.false(result.success);
	t.true(result.output.includes('Error getting type information'));
	t.true(result.output.includes('Type check failed'));
});
