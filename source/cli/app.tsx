import React from 'react';
import {Container} from '../core/di/Container.js';
import Navigation from './components/organisms/Navigation.js';
import {useExitConfirmation} from './hooks/useExitConfirmation.js';
import {ShortcutProvider} from '../core/input/index.js';

interface AppProps {
	container: Container;
}

// Inner component that uses hooks requiring ShortcutProvider
function AppContent({container}: AppProps) {
	// Global exit confirmation logic (must be inside ShortcutProvider)
	const {exitConfirmation} = useExitConfirmation();

	return <Navigation container={container} exitConfirmation={exitConfirmation} />;
}

// Main App component with ShortcutProvider wrapper
export default function App({container}: AppProps) {
	return (
		<ShortcutProvider debug={false}>
			<AppContent container={container} />
		</ShortcutProvider>
	);
}
