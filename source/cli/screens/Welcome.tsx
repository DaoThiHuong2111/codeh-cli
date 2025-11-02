import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import { WelcomePresenter } from '../presenters/WelcomePresenter';
import Logo from '../components/atoms/Logo';

export default function Welcome() {
	const presenter = new WelcomePresenter();
	const [version, setVersion] = useState('');
	const [hasUpdate, setHasUpdate] = useState(false);
	const [latestVersion, setLatestVersion] = useState('');

	useEffect(() => {
		const checkUpdates = async () => {
			const result = await presenter.checkForUpdates();
			setVersion(result.currentVersion);
			setHasUpdate(result.hasUpdate);
			if (result.latestVersion) {
				setLatestVersion(result.latestVersion);
			}
		};

		checkUpdates();
	}, []);

	const message = presenter.getWelcomeMessage();
	const tips = presenter.getQuickTips();

	return (
		<Box flexDirection="column" padding={2}>
			<Logo />

			<Box marginTop={2}>
				<Text bold color="cyan">
					{message}
				</Text>
			</Box>

			<Box marginTop={1}>
				<Text>Version: {version}</Text>
			</Box>

			{hasUpdate && (
				<Box marginTop={1}>
					<Text color="yellow">
						⚠️  New version available: {latestVersion}
					</Text>
				</Box>
			)}

			<Box marginTop={2} flexDirection="column">
				<Text bold>Quick Tips:</Text>
				{tips.map((tip, index) => (
					<Text key={index}>  • {tip}</Text>
				))}
			</Box>

			<Box marginTop={2}>
				<Text dimColor>Press Enter to continue...</Text>
			</Box>
		</Box>
	);
}
