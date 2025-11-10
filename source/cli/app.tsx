import React from 'react';
import {Container} from '../core/di/Container.js';
import Navigation from './components/organisms/Navigation.js';
import {useExitConfirmation} from './hooks/useExitConfirmation.js';

interface AppProps {
	container: Container;
}

export default function App({container}: AppProps) {
	// Global exit confirmation logic
	const {exitConfirmation} = useExitConfirmation();

	return <Navigation container={container} exitConfirmation={exitConfirmation} />;
}
