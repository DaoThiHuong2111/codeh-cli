/**
 * Tests for Footer Component
 * Coverage target: 95%
 */

import React from 'react';
import test from 'ava';
import {render} from 'ink-testing-library';
import {Footer} from '../../../../dist/cli/components/organisms/Footer.js';

test('renders basic info', (t) => {
	const {lastFrame} = render(
		<Footer 
			model="gpt-4" 
			directory="/test/dir" 
			sessionDuration={65} 
		/>
	);
	t.true(lastFrame()?.includes('gpt-4'));
	t.true(lastFrame()?.includes('/test/dir'));
	t.true(lastFrame()?.includes('01:05')); // Duration formatted
});

test('renders git branch', (t) => {
	const {lastFrame} = render(
		<Footer 
			model="gpt-4" 
			sessionDuration={0} 
			gitBranch="main"
		/>
	);
	t.true(lastFrame()?.includes('Branch: main'));
});

test('renders permission mode', (t) => {
	const {lastFrame} = render(
		<Footer 
			model="gpt-4" 
			sessionDuration={0} 
			permissionMode="mvp"
		/>
	);
	t.true(lastFrame()?.includes('YOLO'));
	
	const {lastFrame: lastFrame2} = render(
		<Footer 
			model="gpt-4" 
			sessionDuration={0} 
			permissionMode="interactive"
		/>
	);
	t.true(lastFrame2()?.includes('Ask before edits'));
});

test('renders sandbox status', (t) => {
	const {lastFrame} = render(
		<Footer 
			model="gpt-4" 
			sessionDuration={0} 
			sandboxAvailable={false}
		/>
	);
	t.true(lastFrame()?.includes('No Sandbox'));
	
	const {lastFrame: lastFrame2} = render(
		<Footer 
			model="gpt-4" 
			sessionDuration={0} 
			sandboxAvailable={true}
			sandboxEnabled={true}
		/>
	);
	t.true(lastFrame2()?.includes('Docker (Isolated)'));
});
