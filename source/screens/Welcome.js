import React from 'react';
import {Box} from 'ink';
import Logo from '../components/Logo.js';
import InfoSection from '../components/InfoSection.js';
import TipsSection from '../components/TipsSection.js';
import {getVersion, getCurrentDirectory} from '../services/system/index.js';
import {getModel} from '../services/config/index.js';

export default function Welcome() {
	const version = getVersion();
	const model = getModel();
	const directory = getCurrentDirectory();

	return (
		<Box flexDirection="column" paddingY={1}>
			<Logo />
			<InfoSection version={version} model={model} directory={directory} />
			<TipsSection />
		</Box>
	);
}
