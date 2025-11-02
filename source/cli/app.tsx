import React from 'react';
import { Container } from '../core/di/Container';
import Navigation from './components/organisms/Navigation';

interface AppProps {
	container: Container;
}

export default function App({ container }: AppProps) {
	return <Navigation container={container} />;
}
