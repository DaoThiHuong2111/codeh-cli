/**
 * Tests for GetCallHierarchy Tool
 * Coverage target: 95%
 */

import test from 'ava';
import sinon from 'sinon';
import {GetCallHierarchyTool} from '../../../dist/core/tools/GetCallHierarchyTool.js';

test('gets incoming calls correctly', async t => {
	const mockAnalyzer = {
		findReferences: sinon.stub().returns([
			{
				symbol: { name: 'CallerFunction', location: { relativePath: 'src/Caller.ts' } },
				line: 15,
				contentAroundReference: 'targetFunction();'
			}
		])
	};

	const tool = new GetCallHierarchyTool('/root', mockAnalyzer as any);
	
	const result = await tool.execute({
		filePath: 'src/Target.ts',
		symbolName: 'targetFunction',
		direction: 'incoming'
	});
	
	t.true(mockAnalyzer.findReferences.calledWith('targetFunction', 'src/Target.ts'));
	t.true(result.success);
	t.is(result.metadata?.incomingCalls.length, 1);
	t.is(result.metadata?.incomingCalls[0].symbol, 'CallerFunction');
});

test('gets outgoing calls (empty for now)', async t => {
	const mockAnalyzer = {
		findReferences: sinon.stub()
	};

	const tool = new GetCallHierarchyTool('/root', mockAnalyzer as any);
	
	const result = await tool.execute({
		filePath: 'src/Target.ts',
		symbolName: 'targetFunction',
		direction: 'outgoing'
	});
	
	t.true(mockAnalyzer.findReferences.notCalled);
	t.true(result.success);
	t.deepEqual(result.metadata?.outgoingCalls, []);
});

test('handles errors gracefully', async t => {
	const mockAnalyzer = {
		findReferences: sinon.stub().throws(new Error('Analysis failed'))
	};

	const tool = new GetCallHierarchyTool('/root', mockAnalyzer as any);
	
	const result = await tool.execute({
		filePath: 'src/Target.ts',
		symbolName: 'targetFunction'
	});
	
	t.false(result.success);
	t.true(result.output.includes('Error getting call hierarchy'));
});
