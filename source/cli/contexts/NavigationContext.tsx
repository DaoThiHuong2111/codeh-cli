/**
 * Navigation Context
 * Provides navigation functions to child components
 */

import React, { createContext, useContext } from 'react';

export type ScreenType = 'welcome' | 'home' | 'config';

export interface NavigationContextType {
	currentScreen: ScreenType;
	navigateTo: (screen: ScreenType) => void;
}

export const NavigationContext = createContext<NavigationContextType | null>(null);

export function useNavigation(): NavigationContextType {
	const context = useContext(NavigationContext);
	if (!context) {
		throw new Error('useNavigation must be used within a NavigationProvider');
	}
	return context;
}