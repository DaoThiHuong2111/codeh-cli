/**
 * Tests for FindImplementations Tool
 * Coverage target: 95%
 */

import test from 'ava';
import sinon from 'sinon';
import {FindImplementationsTool} from '../../../dist/core/tools/FindImplementationsTool.js';

test('finds implementations correctly', async t => {
	const mockAnalyzer = {
		findReferences: sinon.stub().returns([
			{
				symbol: { name: 'MyClass', location: { relativePath: 'src/MyClass.ts' } },
				line: 10,
				contentAroundReference: 'export class MyClass implements MyInterface {'
			},
			{
				symbol: { name: 'OtherClass', location: { relativePath: 'src/OtherClass.ts' } },
				line: 5,
				contentAroundReference: 'export class OtherClass extends MyInterface {'
			},
			{
				symbol: { name: 'Usage', location: { relativePath: 'src/Usage.ts' } },
				line: 20,
				contentAroundReference: 'const x: MyInterface = new MyClass();'
			}
		])
	};

	const tool = new FindImplementationsTool('/root', mockAnalyzer as any);
	
	const result = await tool.execute({
		filePath: 'src/MyInterface.ts',
		interfaceName: 'MyInterface'
	});
	
	t.true(mockAnalyzer.findReferences.calledWith('MyInterface', 'src/MyInterface.ts'));
	t.true(result.success);
	t.is(result.metadata?.count, 2);
	t.is(result.metadata?.implementations[0].className, 'MyClass');
	t.is(result.metadata?.implementations[1].className, 'OtherClass');
});

test('handles errors gracefully', async t => {
	const mockAnalyzer = {
		findReferences: sinon.stub().throws(new Error('Analysis failed'))
	};
	const tool = new FindImplementationsTool('/root', mockAnalyzer as any);
	
	const result = await tool.execute({
		filePath: 'src/MyInterface.ts',
		interfaceName: 'MyInterface'
	});
	
	t.false(result.success);
	t.true(result.output.includes('Error finding implementations'));
});
