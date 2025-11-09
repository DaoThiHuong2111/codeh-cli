/**
 * SettingsContext - Global settings management
 */

import React, {createContext, useContext, useState, ReactNode} from 'react';
import type {Provider} from '../types';

/**
 * Settings context value
 */
export interface SettingsContextValue {
	/** Current AI provider */
	provider: Provider;
	/** Current model */
	model: string;
	/** Temperature for generation (0-1) */
	temperature: number;
	/** Maximum tokens to generate */
	maxTokens: number;
	/** System prompt (optional) */
	systemPrompt?: string;
	/** Set provider */
	setProvider: (provider: Provider) => void;
	/** Set model */
	setModel: (model: string) => void;
	/** Set temperature */
	setTemperature: (temperature: number) => void;
	/** Set max tokens */
	setMaxTokens: (maxTokens: number) => void;
	/** Set system prompt */
	setSystemPrompt: (prompt: string | undefined) => void;
}

/**
 * Settings context
 */
const SettingsContext = createContext<SettingsContextValue | undefined>(
	undefined,
);

/**
 * Settings provider props
 */
export interface SettingsProviderProps {
	/** Initial provider */
	initialProvider?: Provider;
	/** Initial model */
	initialModel?: string;
	/** Initial temperature */
	initialTemperature?: number;
	/** Initial max tokens */
	initialMaxTokens?: number;
	/** Initial system prompt */
	initialSystemPrompt?: string;
	/** Children components */
	children: ReactNode;
}

/**
 * SettingsProvider - Provides settings state and methods
 */
export const SettingsProvider: React.FC<SettingsProviderProps> = ({
	initialProvider = 'anthropic',
	initialModel = 'claude-3-5-sonnet-20241022',
	initialTemperature = 0.7,
	initialMaxTokens = 4096,
	initialSystemPrompt,
	children,
}) => {
	const [provider, setProvider] = useState<Provider>(initialProvider);
	const [model, setModel] = useState(initialModel);
	const [temperature, setTemperature] = useState(initialTemperature);
	const [maxTokens, setMaxTokens] = useState(initialMaxTokens);
	const [systemPrompt, setSystemPrompt] = useState<string | undefined>(
		initialSystemPrompt,
	);

	const value: SettingsContextValue = {
		provider,
		model,
		temperature,
		maxTokens,
		systemPrompt,
		setProvider,
		setModel,
		setTemperature,
		setMaxTokens,
		setSystemPrompt,
	};

	return (
		<SettingsContext.Provider value={value}>
			{children}
		</SettingsContext.Provider>
	);
};

/**
 * useSettings hook - Access settings context
 */
export function useSettings(): SettingsContextValue {
	const context = useContext(SettingsContext);

	if (!context) {
		throw new Error('useSettings must be used within SettingsProvider');
	}

	return context;
}
