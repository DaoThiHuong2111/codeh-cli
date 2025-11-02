import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { Container } from '../../../core';
import Welcome from '../../screens/Welcome';
import Home from '../../screens/Home';
import Config from '../../screens/Config';

interface NavigationProps {
	container: Container;
}

enum Screen {
	WELCOME = 'welcome',
	HOME = 'home',
	CONFIG = 'config',
}

export default function Navigation({ container }: NavigationProps) {
	const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.HOME);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const checkConfig = async () => {
			try {
				const { ConfigLoader } = await import('../../../infrastructure/config/ConfigLoader.js');
				const loader = new ConfigLoader();
				const exists = await loader.exists();

				setCurrentScreen(exists ? Screen.HOME : Screen.CONFIG);
			} catch (error) {
				console.error('Config check failed:', error);
				setCurrentScreen(Screen.CONFIG);
			} finally {
				setLoading(false);
			}
		};

		checkConfig();
	}, []);

	useInput((input: string, key: any) => {
		if (key.ctrl && input === 'c') {
			process.exit(0);
		}

		if (currentScreen === Screen.WELCOME) {
			if (key.return) {
				setCurrentScreen(Screen.HOME);
			} else if (input === 'c') {
				setCurrentScreen(Screen.CONFIG);
			}
		} else if (currentScreen === Screen.CONFIG) {
			if (key.ctrl && input === 'h') {
				setCurrentScreen(Screen.HOME);
			}
		}
	});

	if (loading) {
		return (
			<Box>
				<Text>Loading...</Text>
			</Box>
		);
	}

	const renderScreen = () => {
		switch (currentScreen) {
			case Screen.WELCOME:
				return <Welcome />;
			case Screen.HOME:
				return <Home container={container} />;
			case Screen.CONFIG:
				return (
					<Config
						onConfigComplete={() => setCurrentScreen(Screen.HOME)}
						container={container}
					/>
				);
			default:
				return (
					<Box>
						<Text>Unknown screen</Text>
					</Box>
				);
		}
	};

	return <Box flexDirection="column">{renderScreen()}</Box>;
}
