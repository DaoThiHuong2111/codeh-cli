import React from 'react';
import {Container} from '../../../core';
import NavigationProvider from '../../providers/NavigationProvider';

interface NavigationProps {
	container: Container;
	exitConfirmation?: boolean;
}

export default function Navigation({container, exitConfirmation}: NavigationProps) {
	return <NavigationProvider container={container} exitConfirmation={exitConfirmation} />;
}
