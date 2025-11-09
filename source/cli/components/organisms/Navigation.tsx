import React from 'react';
import {Container} from '../../../core';
import NavigationProvider from '../../providers/NavigationProvider';

interface NavigationProps {
	container: Container;
}

export default function Navigation({container}: NavigationProps) {
	// NavigationProvider handles all navigation logic
	return <NavigationProvider container={container} />;
}
