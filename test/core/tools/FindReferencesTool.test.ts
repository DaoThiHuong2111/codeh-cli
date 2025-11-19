/**
 * Tests for FindReferences Tool
 * Coverage target: 95%
 */

import test from 'ava';
import sinon from 'sinon';
import {FindReferencesTool} from '../../../dist/core/tools/FindReferencesTool.js';

test('finds references correctly', async t => {
	const mockAnalyzer = {
		findReferences: sinon.stub().returns([
			{
				getFilePath: () => 'src/file.ts',
				line: 10,
				symbol: { namePath: 'MyClass/method' },
				getHighlightedLine: () => 'const x = new MyClass();',
				toJSON: () => ({ file: 'src/file.ts', line: 10 })
			}
		])
	};

	const tool = new FindReferencesTool('/root', mockAnalyzer as any);
	
	const result = await tool.execute({
		namePath: 'MyClass',
		filePath: 'src/MyClass.ts'
	});
	
	t.true(mockAnalyzer.findReferences.calledWith('MyClass', 'src/MyClass.ts'));
	t.true(result.success);
	t.is(result.metadata?.count, 1);
	t.true(result.output.includes('Found 1 reference(s)'));
	t.true(result.output.includes('src/file.ts:10'));
});

test('handles no references found', async t => {
	const mockAnalyzer = {
		findReferences: sinon.stub().returns([])
	};

	const tool = new FindReferencesTool('/root', mockAnalyzer as any);
	
	const result = await tool.execute({
		namePath: 'Unknown',
		filePath: 'src/file.ts'
	});
	
	t.true(result.success);
	t.is(result.output, 'No references found');
});

test('handles errors gracefully', async t => {
	const mockAnalyzer = {
		findReferences: sinon.stub().throws(new Error('Analysis failed'))
	};

	const tool = new FindReferencesTool('/root', mockAnalyzer as any);
	
	const result = await tool.execute({
		namePath: 'MyClass',
		filePath: 'src/MyClass.ts'
	});
	
	t.false(result.success);
	t.true(result.error?.includes('Failed to find references'));
});

test('validates parameters', t => {
	const tool = new FindReferencesTool('/root');
	
	t.true(tool.validateParameters({namePath: 'name', filePath: 'path'}));
	t.false(tool.validateParameters({namePath: '', filePath: 123}));
	t.false(tool.validateParameters({}));
});
