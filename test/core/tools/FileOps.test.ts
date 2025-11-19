/**
 * Tests for FileOps Tool
 * Coverage target: 95%
 */

import test from 'ava';
import sinon from 'sinon';
import {FileOpsTool} from '../../../dist/core/tools/FileOps.js';

test('reads file content', async t => {
	const mockFileOps = {
		readFile: sinon.stub().returns('file content')
	};
	const tool = new FileOpsTool(mockFileOps);
	
	const result = await tool.execute({
		operation: 'read',
		path: '/test/file.txt'
	});
	
	t.true(mockFileOps.readFile.calledWith('/test/file.txt'));
	t.true(result.success);
	t.is(result.output, 'file content');
});

test('writes file content', async t => {
	const mockFileOps = {
		writeFile: sinon.stub()
	};
	const tool = new FileOpsTool(mockFileOps);
	
	const result = await tool.execute({
		operation: 'write',
		path: '/test/file.txt',
		content: 'new content'
	});
	
	t.true(mockFileOps.writeFile.calledWith('/test/file.txt', 'new content'));
	t.true(result.success);
	t.true(result.output.includes('File written'));
});

test('requires content for write operation', async t => {
	const mockFileOps = {
		writeFile: sinon.stub()
	};
	const tool = new FileOpsTool(mockFileOps);
	
	const result = await tool.execute({
		operation: 'write',
		path: '/test/file.txt'
	});
	
	t.false(result.success);
	t.true(result.error.includes('Content parameter required'));
});

test('lists directory', async t => {
	const mockFileOps = {
		listDirectory: sinon.stub().returns([
			{name: 'file1.txt', isFile: true, isDirectory: false},
			{name: 'dir1', isFile: false, isDirectory: true}
		])
	};
	const tool = new FileOpsTool(mockFileOps);
	
	const result = await tool.execute({
		operation: 'list',
		path: '/test/dir'
	});
	
	t.true(mockFileOps.listDirectory.calledWith('/test/dir'));
	t.true(result.success);
	t.true(result.output.includes('📄 file1.txt'));
	t.true(result.output.includes('📁 dir1'));
});

test('checks file existence', async t => {
	const mockFileOps = {
		exists: sinon.stub().returns(true)
	};
	const tool = new FileOpsTool(mockFileOps);
	
	const result = await tool.execute({
		operation: 'exists',
		path: '/test/file.txt'
	});
	
	t.true(mockFileOps.exists.calledWith('/test/file.txt'));
	t.true(result.success);
	t.is(result.output, 'File exists');
	t.true(result.metadata?.exists);
});

test('handles unknown operation', async t => {
	const mockFileOps = {};
	const tool = new FileOpsTool(mockFileOps);
	
	const result = await tool.execute({
		operation: 'unknown',
		path: '/test/file.txt'
	});
	
	t.false(result.success);
	t.true(result.error.includes('Unknown operation'));
});

test('handles error during operation', async t => {
	const mockFileOps = {
		readFile: sinon.stub().throws(new Error('Read failed'))
	};
	const tool = new FileOpsTool(mockFileOps);
	
	const result = await tool.execute({
		operation: 'read',
		path: '/test/file.txt'
	});
	
	t.false(result.success);
	t.is(result.error, 'Read failed');
});

test('validates parameters', t => {
	const tool = new FileOpsTool({});
	
	t.true(tool.validateParameters({operation: 'read', path: 'path'}));
	t.false(tool.validateParameters({operation: '', path: 'path'}));
	t.false(tool.validateParameters({operation: 'read', path: ''}));
	t.false(tool.validateParameters({operation: 'invalid', path: 'path'}));
});
