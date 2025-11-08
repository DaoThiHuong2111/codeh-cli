import React from 'react';
import {Container} from '../core/di/Container.js';
import Navigation from './components/organisms/Navigation.js';

interface AppProps {
	container: Container;
}

export default function App({ container }: AppProps) {
	return <Navigation container={container} />;
}
