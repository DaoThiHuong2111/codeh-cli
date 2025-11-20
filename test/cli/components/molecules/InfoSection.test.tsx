/**
 * Tests for InfoSection Component
 * Coverage target: 95%
 */

import React from 'react';
import test from 'ava';
import {render} from 'ink-testing-library';
import InfoSection from '../../../../dist/cli/components/molecules/InfoSection.js';

test('renders all info', (t) => {
	const {lastFrame} = render(
		<InfoSection 
			version="1.0.0" 
			model="gpt-4" 
			directory="/test/dir" 
		/>
	);
	t.true(lastFrame()?.includes('Version: 1.0.0'));
	t.true(lastFrame()?.includes('Model: gpt-4'));
	t.true(lastFrame()?.includes('Directory: /test/dir'));
});

test('renders partial info', (t) => {
	const {lastFrame} = render(
		<InfoSection 
			version="1.0.0" 
		/>
	);
	t.true(lastFrame()?.includes('Version: 1.0.0'));
	t.false(lastFrame()?.includes('Model:'));
	t.false(lastFrame()?.includes('Directory:'));
});

test('handles empty model', (t) => {
	const {lastFrame} = render(
		<InfoSection 
			model="" 
		/>
	);
	t.true(lastFrame()?.includes('Model: (not configured)'));
});
