import React from 'react';
import {Container} from '../core/di/Container.js';
import Navigation from './components/organisms/Navigation.js';
import {useExitConfirmation} from './hooks/useExitConfirmation.js';
import {ShortcutProvider} from '../core/input/index.js';

interface AppProps {
	container: Container;
}

function AppContent({container}: AppProps) {
	const {exitConfirmation} = useExitConfirmation();

	return <Navigation container={container} exitConfirmation={exitConfirmation} />;
}

export default function App({container}: AppProps) {
	return (
		<ShortcutProvider debug={false}>
			<AppContent container={container} />
		</ShortcutProvider>
	);
}
