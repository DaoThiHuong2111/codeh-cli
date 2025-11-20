/**
 * Tests for SessionSelector Component
 * Coverage target: 95%
 */

import React from 'react';
import test from 'ava';
import {render} from 'ink-testing-library';
import {SessionSelector} from '../../../../dist/cli/components/organisms/SessionSelector.js';

const sessions = [
	{id: '1', name: 'Session 1', messageCount: 5, updatedAt: new Date(), relativeTime: '2m ago'},
	{id: '2', name: 'Session 2', messageCount: 10, updatedAt: new Date(), relativeTime: '1h ago'}
];

test('renders session list', t => {
	const {lastFrame} = render(
		<SessionSelector 
			sessions={sessions}
			selectedIndex={0}
		/>
	);
	t.true(lastFrame()?.includes('Session 1'));
	t.true(lastFrame()?.includes('Session 2'));
	t.true(lastFrame()?.includes('5 messages'));
});

test('highlights selected session', t => {
	const {lastFrame} = render(
		<SessionSelector 
			sessions={sessions}
			selectedIndex={1}
		/>
	);
	t.true(lastFrame()?.includes('> Session 2'));
	t.false(lastFrame()?.includes('> Session 1'));
});

test('renders empty state', t => {
	const {lastFrame} = render(
		<SessionSelector 
			sessions={[]}
			selectedIndex={0}
		/>
	);
	t.true(lastFrame()?.includes('No saved sessions found'));
});
