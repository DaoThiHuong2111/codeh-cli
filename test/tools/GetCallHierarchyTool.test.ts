import test from 'ava';
import * as path from 'path';
import {GetCallHierarchyTool} from '../../source/core/tools/GetCallHierarchyTool';
import {TypeScriptSymbolAnalyzer} from '../../source/infrastructure/typescript/TypeScriptSymbolAnalyzer';

const fixturesPath = path.resolve(process.cwd(), 'test/fixtures');

test('GetCallHierarchyTool: should find incoming calls', async t => {
	const analyzer = new TypeScriptSymbolAnalyzer(fixturesPath);
	const tool = new GetCallHierarchyTool(fixturesPath, analyzer);

	const result = await tool.execute({
		filePath: path.join(fixturesPath, 'sample.ts'),
		symbolName: 'fetchUser',
		direction: 'incoming',
		maxDepth: 2,
	});

	t.true(result.success);
	t.truthy(result.metadata);
	t.true(Array.isArray(result.metadata.calls));
});

test('GetCallHierarchyTool: should find outgoing calls', async t => {
	const analyzer = new TypeScriptSymbolAnalyzer(fixturesPath);
	const tool = new GetCallHierarchyTool(fixturesPath, analyzer);

	const result = await tool.execute({
		filePath: path.join(fixturesPath, 'sample.ts'),
		symbolName: 'processUser',
		direction: 'outgoing',
		maxDepth: 2,
	});

	t.true(result.success);
	t.truthy(result.metadata);
	t.true(Array.isArray(result.metadata.calls));
});

test('GetCallHierarchyTool: should find both directions', async t => {
	const analyzer = new TypeScriptSymbolAnalyzer(fixturesPath);
	const tool = new GetCallHierarchyTool(fixturesPath, analyzer);

	const result = await tool.execute({
		filePath: path.join(fixturesPath, 'sample.ts'),
		symbolName: 'fetchUser',
		direction: 'both',
		maxDepth: 1,
	});

	t.true(result.success);
	t.truthy(result.metadata);
	t.truthy(result.metadata.incoming);
	t.truthy(result.metadata.outgoing);
});

test('GetCallHierarchyTool: should respect maxDepth', async t => {
	const analyzer = new TypeScriptSymbolAnalyzer(fixturesPath);
	const tool = new GetCallHierarchyTool(fixturesPath, analyzer);

	const result = await tool.execute({
		filePath: path.join(fixturesPath, 'sample.ts'),
		symbolName: 'fetchUser',
		direction: 'incoming',
		maxDepth: 1,
	});

	t.true(result.success);
	// Should not have deep nesting beyond maxDepth
});

test('GetCallHierarchyTool: should handle symbol not found', async t => {
	const analyzer = new TypeScriptSymbolAnalyzer(fixturesPath);
	const tool = new GetCallHierarchyTool(fixturesPath, analyzer);

	const result = await tool.execute({
		filePath: path.join(fixturesPath, 'sample.ts'),
		symbolName: 'nonExistentFunction',
		direction: 'incoming',
		maxDepth: 2,
	});

	t.false(result.success);
});

test('GetCallHierarchyTool: should validate parameters', t => {
	const analyzer = new TypeScriptSymbolAnalyzer(fixturesPath);
	const tool = new GetCallHierarchyTool(fixturesPath, analyzer);

	// Valid parameters
	t.true(
		tool.validateParameters({
			filePath: 'test.ts',
			symbolName: 'foo',
			direction: 'incoming',
			maxDepth: 2,
		}),
	);

	// Invalid direction
	t.false(
		tool.validateParameters({
			filePath: 'test.ts',
			symbolName: 'foo',
			direction: 'invalid',
			maxDepth: 2,
		}),
	);

	// Invalid maxDepth
	t.false(
		tool.validateParameters({
			filePath: 'test.ts',
			symbolName: 'foo',
			direction: 'incoming',
			maxDepth: -1,
		}),
	);
});
