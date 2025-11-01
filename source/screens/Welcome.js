import React, {useState, useEffect} from 'react';
import {Box, Text} from 'ink';
import Logo from '../components/Logo.js';
import InfoSection from '../components/InfoSection.js';
import TipsSection from '../components/TipsSection.js';
import {getVersion, getCurrentDirectory} from '../services/system/index.js';
import {getModel} from '../services/config/index.js';

export default function Welcome() {
	const version = getVersion();
	const model = getModel();
	const directory = getCurrentDirectory();
	const [updateAvailable, setUpdateAvailable] = useState(false);
	const [latestVersion, setLatestVersion] = useState(null);
	const [checkingUpdate, setCheckingUpdate] = useState(true);

	useEffect(() => {
		checkForUpdates();
	}, []);

	const checkForUpdates = async () => {
		try {
			const response = await fetch(
				'https://68ff9efce02b16d1753eb347.mockapi.io/api/v1/upgrade',
			);
			const data = await response.json();

			if (data.version && data.version !== version) {
				setUpdateAvailable(true);
				setLatestVersion(data.version);
			}
		} catch (error) {
			// Silent fail - don't block UI
			console.error('Failed to check for updates:', error);
		} finally {
			setCheckingUpdate(false);
		}
	};

	return (
		<Box flexDirection="column" paddingY={1}>
			{updateAvailable && (
				<Box
					borderStyle="round"
					borderColor="yellow"
					paddingX={2}
					paddingY={1}
					marginBottom={1}
				>
					<Box flexDirection="column">
						<Text color="yellow" bold>
							⚠️ New version available: {latestVersion}
						</Text>
						<Text color="gray" dimColor>
							Current version: {version}
						</Text>
						<Text color="green">Run: npm update -g codeh-cli</Text>
					</Box>
				</Box>
			)}

			<Logo />
			<InfoSection version={version} model={model} directory={directory} />
			<TipsSection />
		</Box>
	);
}
