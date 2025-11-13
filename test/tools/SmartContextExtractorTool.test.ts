import test from 'ava';
import * as path from 'path';
import {SmartContextExtractorTool} from '../../source/core/tools/SmartContextExtractorTool';
import {TypeScriptSymbolAnalyzer} from '../../source/infrastructure/typescript/TypeScriptSymbolAnalyzer';

const fixturesPath = path.resolve(process.cwd(), 'test/fixtures');

test('SmartContextExtractorTool: should extract full context', async t => {
	const analyzer = new TypeScriptSymbolAnalyzer(fixturesPath);
	const tool = new SmartContextExtractorTool(fixturesPath, analyzer);

	const result = await tool.execute({
		filePath: path.join(fixturesPath, 'sample.ts'),
		symbolName: 'fetchUser',
		includeCallers: true,
		includeTypes: true,
		maxDepth: 2,
	});

	t.true(result.success);
	t.truthy(result.metadata);
	t.truthy(result.metadata.definition);
	t.truthy(result.metadata.definition.name);
});

test('SmartContextExtractorTool: should include callers when requested', async t => {
	const analyzer = new TypeScriptSymbolAnalyzer(fixturesPath);
	const tool = new SmartContextExtractorTool(fixturesPath, analyzer);

	const result = await tool.execute({
		filePath: path.join(fixturesPath, 'sample.ts'),
		symbolName: 'fetchUser',
		includeCallers: true,
		includeTypes: false,
		maxDepth: 2,
	});

	t.true(result.success);
	t.truthy(result.metadata.callers);
	t.true(Array.isArray(result.metadata.callers));
});

test('SmartContextExtractorTool: should include type info when requested', async t => {
	const analyzer = new TypeScriptSymbolAnalyzer(fixturesPath);
	const tool = new SmartContextExtractorTool(fixturesPath, analyzer);

	const result = await tool.execute({
		filePath: path.join(fixturesPath, 'sample.ts'),
		symbolName: 'fetchUser',
		includeCallers: false,
		includeTypes: true,
		maxDepth: 1,
	});

	t.true(result.success);
	t.truthy(result.metadata.typeInfo);
	t.truthy(result.metadata.typeInfo.type);
});

test('SmartContextExtractorTool: should limit callers to 10', async t => {
	const analyzer = new TypeScriptSymbolAnalyzer(fixturesPath);
	const tool = new SmartContextExtractorTool(fixturesPath, analyzer);

	const result = await tool.execute({
		filePath: path.join(fixturesPath, 'sample.ts'),
		symbolName: 'fetchUser',
		includeCallers: true,
		includeTypes: true,
		maxDepth: 3,
	});

	t.true(result.success);

	if (result.metadata.callers) {
		t.true(result.metadata.callers.length <= 10);
	}
});

test('SmartContextExtractorTool: should include children symbols', async t => {
	const analyzer = new TypeScriptSymbolAnalyzer(fixturesPath);
	const tool = new SmartContextExtractorTool(fixturesPath, analyzer);

	const result = await tool.execute({
		filePath: path.join(fixturesPath, 'sample.ts'),
		symbolName: 'UserService',
		includeCallers: false,
		includeTypes: false,
		maxDepth: 1,
	});

	t.true(result.success);
	t.truthy(result.metadata.children);
	t.true(Array.isArray(result.metadata.children));
	t.true(result.metadata.children.length > 0); // Should have methods
});

test('SmartContextExtractorTool: should handle symbol not found', async t => {
	const analyzer = new TypeScriptSymbolAnalyzer(fixturesPath);
	const tool = new SmartContextExtractorTool(fixturesPath, analyzer);

	const result = await tool.execute({
		filePath: path.join(fixturesPath, 'sample.ts'),
		symbolName: 'nonExistentSymbol',
		includeCallers: true,
		includeTypes: true,
		maxDepth: 2,
	});

	t.false(result.success);
});

test('SmartContextExtractorTool: should validate parameters', t => {
	const analyzer = new TypeScriptSymbolAnalyzer(fixturesPath);
	const tool = new SmartContextExtractorTool(fixturesPath, analyzer);

	// Valid parameters
	t.true(
		tool.validateParameters({
			filePath: 'test.ts',
			symbolName: 'foo',
			includeCallers: true,
			includeTypes: true,
			maxDepth: 2,
		}),
	);

	// Missing required parameters
	t.false(
		tool.validateParameters({
			filePath: 'test.ts',
		}),
	);

	// Invalid maxDepth
	t.false(
		tool.validateParameters({
			filePath: 'test.ts',
			symbolName: 'foo',
			includeCallers: true,
			includeTypes: true,
			maxDepth: 0,
		}),
	);
});
