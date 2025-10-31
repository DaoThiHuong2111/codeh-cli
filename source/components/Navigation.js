import React, {useState, useEffect} from 'react';
import {Box, Text, useInput} from 'ink';
import Welcome from '../screens/Welcome.js';
import Home from '../screens/Home.js';
import Config from '../screens/Config.js';
import {checkConfiguration} from '../utils/configChecker.js';

const SCREENS = {
	WELCOME: 'welcome',
	HOME: 'home',
	CONFIG: 'config',
};

export default function Navigation() {
	// Check initial configuration immediately
	const initialConfigStatus = checkConfiguration();
	const initialScreen = !initialConfigStatus.isConfigured ? SCREENS.CONFIG : SCREENS.HOME;

	const [currentScreen, setCurrentScreen] = useState(initialScreen);
	const [configChecked, setConfigChecked] = useState(true);

	// Double-check configuration on component mount (in case config changes)
	useEffect(() => {
		const configStatus = checkConfiguration();

		// If not configured, redirect to config screen
		// If configured, redirect to home screen (step 5 in flow)
		if (!configStatus.isConfigured) {
			setCurrentScreen(SCREENS.CONFIG);
		} else {
			setCurrentScreen(SCREENS.HOME);
		}
	}, []);

	useInput((input, key) => {
		if (key.ctrl && input === 'c') {
			process.exit(0);
		}

		if (!configChecked) return; // Don't handle input before config check

		if (currentScreen === SCREENS.WELCOME) {
			if (key.return) {
				setCurrentScreen(SCREENS.HOME);
			} else if (input === 'c') {
				setCurrentScreen(SCREENS.CONFIG);
			}
		} else if (currentScreen === SCREENS.HOME) {
			if (key.ctrl && input === 'h') {
				setCurrentScreen(SCREENS.WELCOME);
			} else if (input === 'c') {
				setCurrentScreen(SCREENS.CONFIG);
			}
		} else if (currentScreen === SCREENS.CONFIG) {
			if (key.ctrl && input === 'h') {
				setCurrentScreen(SCREENS.HOME);
			} else if (key.return) {
				// Check if configuration is complete, then go to home screen
				const configStatus = checkConfiguration();
				if (configStatus.isConfigured) {
					setCurrentScreen(SCREENS.HOME);
				}
				// If not configured, stay in config screen
			}
		}
	});

	const renderScreen = () => {
		switch (currentScreen) {
			case SCREENS.WELCOME:
				return <Welcome />;
			case SCREENS.HOME:
				return <Home />;
			case SCREENS.CONFIG:
				return <Config onConfigComplete={() => {
					const configStatus = checkConfiguration();
					if (configStatus.isConfigured) {
						setCurrentScreen(SCREENS.HOME);
					}
				}} />;
			default:
				return <Welcome />;
		}
	};

	const renderHelp = () => {
		switch (currentScreen) {
			case SCREENS.WELCOME:
				return (
					<Box marginTop={1}>
						<Text color="gray">Enter: Home | C: Config | Ctrl+C: Thoát</Text>
					</Box>
				);
			case SCREENS.HOME:
				return (
					<Box marginTop={1}>
						<Text color="gray">Ctrl+H: Welcome | C: Config | ESC: Thoát</Text>
					</Box>
				);
			case SCREENS.CONFIG:
				return (
					<Box marginTop={1}>
						<Text color="gray">Ctrl+H: Home | Enter: Welcome | ESC: Thoát</Text>
					</Box>
				);
			default:
				return null;
		}
	};

	return (
		<Box flexDirection="column">
			{renderScreen()}
			{renderHelp()}
		</Box>
	);
}
