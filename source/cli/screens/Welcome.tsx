import React from 'react';
import {Box, Text} from 'ink';
import {useNavigation} from '../contexts/NavigationContext';
import {useWelcomeLogic} from '../hooks/useWelcomeLogic';
import Logo from '../components/atoms/Logo';

export default function Welcome() {
	const {navigateTo} = useNavigation();

	// Business logic hook
	const {loading, shouldShowWelcome, displayMessage, displayVersion} =
		useWelcomeLogic({
			onNavigateHome: () => navigateTo('home'),
			onNavigateConfig: () => navigateTo('config'),
		});

	// Show loading state
	if (loading) {
		return (
			<Box flexDirection="column" padding={2}>
				<Logo />
				<Box marginTop={2}>
					<Text>Loading...</Text>
				</Box>
			</Box>
		);
	}

	// If we shouldn't show welcome, don't render anything (navigation will happen)
	if (!shouldShowWelcome) {
		return null;
	}

	return (
		<Box flexDirection="column" padding={2}>
			<Logo />

			<Box marginTop={2}>
				<Text bold color="cyan">
					{displayMessage}
				</Text>
			</Box>

			{displayVersion && (
				<Box marginTop={1}>
					<Text>
						Version:{' '}
						<Text bold color="green">
							{displayVersion}
						</Text>
					</Text>
				</Box>
			)}

			<Box marginTop={2}>
				<Text dimColor>Press Enter to start or 'c' to configure</Text>
			</Box>
		</Box>
	);
}
