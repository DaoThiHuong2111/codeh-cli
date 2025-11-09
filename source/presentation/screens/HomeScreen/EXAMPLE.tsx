/**
 * HomeScreen Usage Example
 *
 * This example demonstrates how to integrate HomeScreen into your application
 */

import React from 'react';
import {render} from 'ink';
import {HomeScreen} from './index';
import {AnthropicClient} from '../../../infrastructure/api/clients/AnthropicClient';
import {OpenAIClient} from '../../../infrastructure/api/clients/OpenAIClient';
import {OllamaClient} from '../../../infrastructure/api/clients/OllamaClient';
import type {IApiClient} from '../../../core/domain/interfaces/IApiClient';

// ==========================================
// Example 1: Basic Usage with Anthropic
// ==========================================

function Example1_Basic() {
	const apiClient: IApiClient = new AnthropicClient(
		process.env.ANTHROPIC_API_KEY || ''
	);

	return (
		<HomeScreen
			apiClient={apiClient}
			initialProvider="anthropic"
			initialModel="claude-3-5-sonnet-20241022"
		/>
	);
}

// ==========================================
// Example 2: Custom Configuration
// ==========================================

function Example2_CustomConfig() {
	const apiClient: IApiClient = new AnthropicClient(
		process.env.ANTHROPIC_API_KEY || ''
	);

	return (
		<HomeScreen
			apiClient={apiClient}
			initialProvider="anthropic"
			initialModel="claude-3-5-sonnet-20241022"
		/>
	);
}

// ==========================================
// Example 3: Provider Switching
// ==========================================

function Example3_ProviderSwitching() {
	// In a real app, you'd implement provider switching logic
	// This example shows the concept

	const providers = {
		anthropic: new AnthropicClient(
			process.env.ANTHROPIC_API_KEY || ''
		),
		openai: new OpenAIClient(
			process.env.OPENAI_API_KEY || ''
		),
		ollama: new OllamaClient(
			'http://localhost:11434'
		),
	};

	// Start with Anthropic
	const currentProvider: keyof typeof providers = 'anthropic';
	const apiClient = providers[currentProvider];

	return (
		<HomeScreen
			apiClient={apiClient}
			initialProvider={currentProvider}
		/>
	);
}

// ==========================================
// Running Examples
// ==========================================

// Run specific example:
// const app = render(<Example1_Basic />);

// Default: Run Example 1
const app = render(<Example1_Basic />);

app.waitUntilExit().then(() => {
	process.exit(0);
});

// ==========================================
// Keyboard Shortcuts
// ==========================================
/*
 * Ctrl+C: Exit application
 * Ctrl+L: Clear chat history
 * Esc: Cancel streaming
 * Enter: Send message
 */

// ==========================================
// Environment Variables Required
// ==========================================
/*
 * ANTHROPIC_API_KEY: Your Anthropic API key
 * OPENAI_API_KEY: Your OpenAI API key
 * (Ollama runs locally, no API key needed)
 */

// ==========================================
// Features Demonstrated
// ==========================================
/*
 * ✓ Real-time streaming responses
 * ✓ Markdown rendering with syntax highlighting
 * ✓ Provider-specific branding (icons, colors)
 * ✓ Token usage tracking
 * ✓ Connection status indicators
 * ✓ Chat history management
 * ✓ Keyboard shortcuts
 * ✓ Responsive terminal UI
 * ✓ Error handling
 */
