/**
 * Navigation Provider
 * Manages navigation state and provides navigation functions
 */

import React, {useState, useEffect} from 'react';
import {Box, Text} from 'ink';
import {
	NavigationContext,
	ScreenType,
	NavigationContextType,
} from '../contexts/NavigationContext';
import {Container} from '../../core';
import Welcome from '../screens/Welcome';
import Home from '../screens/Home';
import Config from '../screens/Config';

interface NavigationProviderProps {
	container: Container;
	exitConfirmation?: boolean;
}

export default function NavigationProvider({
	container,
	exitConfirmation,
}: NavigationProviderProps) {
	const [currentScreen, setCurrentScreen] = useState<ScreenType>('home');
	const [loading, setLoading] = useState(true);

	// Navigation context value
	const navigationValue: NavigationContextType = {
		currentScreen,
		navigateTo: setCurrentScreen,
	};

	useEffect(() => {
		// Always start with Welcome screen
		setCurrentScreen('welcome');
		setLoading(false);
	}, []);

	if (loading) {
		return (
			<Box>
				<Text>Loading...</Text>
			</Box>
		);
	}

	const renderScreen = () => {
		switch (currentScreen) {
			case 'welcome':
				return <Welcome />;
			case 'home':
				return <Home container={container} exitConfirmation={exitConfirmation} />;
			case 'config':
				return (
					<Config
						onConfigComplete={() => setCurrentScreen('home')}
						container={container}
						exitConfirmation={exitConfirmation}
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

	return (
		<NavigationContext.Provider value={navigationValue}>
			<Box flexDirection="column">{renderScreen()}</Box>
		</NavigationContext.Provider>
	);
}
