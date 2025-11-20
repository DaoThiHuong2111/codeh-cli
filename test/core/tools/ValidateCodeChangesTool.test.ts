/**
 * Tests for ValidateCodeChangesTool
 * Coverage target: 95%
 */

import test from 'ava';
import sinon from 'sinon';
import {ValidateCodeChangesTool} from '../../../dist/core/tools/ValidateCodeChangesTool.js';
import type {ISymbolAnalyzer} from '../../../dist/core/domain/interfaces/ISymbolAnalyzer.js';
import * as ts from 'typescript';

// Mock Diagnostic
function createMockDiagnostic(
	message: string,
	category: ts.DiagnosticCategory,
	fileName?: string,
	line: number = 1,
	character: number = 1
): any {
	return {
		messageText: message,
		category,
		code: 1234,
		start: 0,
		length: 10,
		file: fileName ? {
			fileName,
			getLineAndCharacterOfPosition: () => ({line: line - 1, character: character - 1}),
			text: 'file content'
		} : undefined
	};
}

test('validates parameters', t => {
	const mockAnalyzer = {} as ISymbolAnalyzer;
	const tool = new ValidateCodeChangesTool('/root', mockAnalyzer);
	
	t.true(tool.validateParameters({}));
});

test('reports valid code when no diagnostics', async t => {
	const mockAnalyzer = {
		invalidateAll: sinon.stub(),
		getDiagnostics: sinon.stub().returns([])
	} as unknown as ISymbolAnalyzer;

	const tool = new ValidateCodeChangesTool('/root', mockAnalyzer);
	const result = await tool.execute({});

	t.true(result.success);
	t.true(result.output.includes('Code validation passed'));
	t.is(result.metadata?.errorCount, 0);
	t.is(result.metadata?.warningCount, 0);
});

test('reports errors and warnings', async t => {
	const mockAnalyzer = {
		invalidateAll: sinon.stub(),
		getDiagnostics: sinon.stub().returns([
			createMockDiagnostic('Syntax error', ts.DiagnosticCategory.Error, 'file1.ts'),
			createMockDiagnostic('Unused variable', ts.DiagnosticCategory.Warning, 'file2.ts')
		])
	} as unknown as ISymbolAnalyzer;

	const tool = new ValidateCodeChangesTool('/root', mockAnalyzer);
	const result = await tool.execute({});

	t.true(result.success);
	t.true(result.output.includes('Code validation failed'));
	t.is(result.metadata?.errorCount, 1);
	t.is(result.metadata?.warningCount, 1);
	t.is(result.metadata?.errors[0].file, 'file1.ts');
});

test('filters diagnostics by file', async t => {
	const mockAnalyzer = {
		invalidateAll: sinon.stub(),
		getDiagnostics: sinon.stub().returns([])
	} as unknown as ISymbolAnalyzer;

	const tool = new ValidateCodeChangesTool('/root', mockAnalyzer);
	await tool.execute({files: ['file1.ts']});

	t.true((mockAnalyzer.getDiagnostics as sinon.SinonStub).calledWith(['file1.ts']));
});

test('handles errors gracefully', async t => {
	const mockAnalyzer = {
		invalidateAll: sinon.stub(),
		getDiagnostics: sinon.stub().throws(new Error('Validation failed'))
	} as unknown as ISymbolAnalyzer;

	const tool = new ValidateCodeChangesTool('/root', mockAnalyzer);
	const result = await tool.execute({});

	t.false(result.success);
	t.true(result.output.includes('Error validating code'));
});
