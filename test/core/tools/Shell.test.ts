/**
 * Tests for Shell Tool
 * Coverage target: 95%
 */

import test from 'ava';
import sinon from 'sinon';
import {ShellTool} from '../../../dist/core/tools/Shell.js';

test('executes command on host when sandbox is disabled', async t => {
	const mockHostExecutor = {
		execute: sinon.stub().resolves({
			success: true,
			stdout: 'output',
			exitCode: 0,
			duration: 100
		})
	};
	const mockDockerExecutor = {
		execute: sinon.stub()
	};
	const mockSandboxManager = {
		isEnabled: sinon.stub().returns(false)
	};

	const tool = new ShellTool(mockHostExecutor, mockDockerExecutor, mockSandboxManager as any);
	
	const result = await tool.execute({command: 'ls'});
	
	t.true(mockHostExecutor.execute.calledWith('ls'));
	t.true(mockDockerExecutor.execute.notCalled);
	t.true(result.success);
	t.is(result.output, 'output');
});

test('executes command in docker when sandbox is enabled', async t => {
	const mockHostExecutor = {
		execute: sinon.stub()
	};
	const mockDockerExecutor = {
		execute: sinon.stub().resolves({
			success: true,
			stdout: 'docker output',
			exitCode: 0,
			duration: 100
		})
	};
	const mockSandboxManager = {
		isEnabled: sinon.stub().returns(true)
	};

	const tool = new ShellTool(mockHostExecutor, mockDockerExecutor, mockSandboxManager as any);
	
	const result = await tool.execute({command: 'ls'});
	
	t.true(mockDockerExecutor.execute.calledWith('ls'));
	t.true(mockHostExecutor.execute.notCalled);
	t.is(result.output, 'docker output');
});

test('handles execution error', async t => {
	const mockHostExecutor = {
		execute: sinon.stub().resolves({
			success: false,
			stdout: '',
			stderr: 'error message',
			exitCode: 1,
			duration: 100
		})
	};
	const mockDockerExecutor = { execute: sinon.stub() };
	const mockSandboxManager = { isEnabled: sinon.stub().returns(false) };

	const tool = new ShellTool(mockHostExecutor, mockDockerExecutor, mockSandboxManager as any);
	
	const result = await tool.execute({command: 'fail'});
	
	t.false(result.success);
	t.is(result.error, 'error message');
});

test('handles exception during execution', async t => {
	const mockHostExecutor = {
		execute: sinon.stub().rejects(new Error('System error'))
	};
	const mockDockerExecutor = { execute: sinon.stub() };
	const mockSandboxManager = { isEnabled: sinon.stub().returns(false) };

	const tool = new ShellTool(mockHostExecutor, mockDockerExecutor, mockSandboxManager as any);
	
	const result = await tool.execute({command: 'crash'});
	
	t.false(result.success);
	t.is(result.error, 'System error');
});

test('validates parameters', t => {
	const tool = new ShellTool({}, {}, {} as any);
	
	t.true(tool.validateParameters({command: 'ls'}));
	t.false(tool.validateParameters({command: ''}));
	t.false(tool.validateParameters({}));
});
