/**
 * HomeScreen - Main chat interface
 * Integrates all components with state management
 */

import React from 'react';
import {Box} from 'ink';
import {ChatProvider} from './contexts/ChatContext';
import {SettingsProvider} from './contexts/SettingsContext';
import {HomeScreenContent} from './HomeScreenContent';
import type {IApiClient} from '../../../core/domain/interfaces/IApiClient';
import type {Provider} from './types';

export interface HomeScreenProps {
	/** API client instance */
	apiClient: IApiClient;
	/** Initial provider (default: anthropic) */
	initialProvider?: Provider;
	/** Initial model */
	initialModel?: string;
}

/**
 * HomeScreen - Main entry point for chat interface
 *
 * Wraps content with context providers for state management
 */
export const HomeScreen: React.FC<HomeScreenProps> = ({
	apiClient,
	initialProvider = 'anthropic',
	initialModel,
}) => {
	return (
		<SettingsProvider
			initialProvider={initialProvider}
			initialModel={initialModel}
		>
			<ChatProvider apiClient={apiClient} provider={initialProvider}>
				<HomeScreenContent />
			</ChatProvider>
		</SettingsProvider>
	);
};
