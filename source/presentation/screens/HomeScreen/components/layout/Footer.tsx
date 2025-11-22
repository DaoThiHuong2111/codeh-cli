/**
 * Footer component
 * Status bar with connection info and shortcuts
 */

import React from 'react';
import {Box, Text} from 'ink';
import {THEME_COLORS} from '../../utils/colors';

export type ConnectionStatus = 'connected' | 'disconnected' | 'streaming';

export interface FooterProps {
	/** Connection status */
	status: ConnectionStatus;
	/** Current model name */
	model?: string;
	/** Total token count for session */
	tokenCount?: number;
	/** Terminal width */
	terminalWidth: number;
	/** Permission mode (mvp or interactive) */
	permissionMode?: 'mvp' | 'interactive';
}

/**
 * Footer - Status bar with connection info and keyboard shortcuts
 */
export const Footer: React.FC<FooterProps> = ({
	status,
	model,
	tokenCount,
	terminalWidth,
	permissionMode = 'mvp',
}) => {
	const statusConfig = getStatusConfig(status);
	const modeConfig = getModeConfig(permissionMode);

	return (
		<Box
			flexDirection="row"
			justifyContent="space-between"
			paddingX={1}
			borderStyle="single"
			borderTop
			borderColor={THEME_COLORS.ui.border}
		>
			<Box>
				<Text color={statusConfig.color} bold>
					{statusConfig.icon}
				</Text>
				<Text color={THEME_COLORS.text.muted}> {statusConfig.label}</Text>
			</Box>

			{model && (
				<Box>
					<Text color={THEME_COLORS.text.muted}>Model: </Text>
					<Text color={THEME_COLORS.text.secondary}>{model}</Text>
				</Box>
			)}

			{tokenCount !== undefined && (
				<Box>
					<Text color={THEME_COLORS.text.muted}>Tokens: </Text>
					<Text color={THEME_COLORS.text.secondary}>
						{formatNumber(tokenCount)}
					</Text>
				</Box>
			)}

			<Box>
				<Text color={modeConfig.color} bold>
					{modeConfig.icon}
				</Text>
				<Text color={THEME_COLORS.text.muted}> {modeConfig.label}</Text>
				<Text color={THEME_COLORS.text.muted} dimColor>
					{' '}
					(Shift+Tab)
				</Text>
			</Box>
		</Box>
	);
};

/**
 * Status configuration
 */
interface StatusConfig {
	icon: string;
	label: string;
	color: string;
}

function getStatusConfig(status: ConnectionStatus): StatusConfig {
	const configs: Record<ConnectionStatus, StatusConfig> = {
		connected: {
			icon: '●',
			label: 'Connected',
			color: THEME_COLORS.text.success,
		},
		disconnected: {
			icon: '○',
			label: 'Disconnected',
			color: THEME_COLORS.text.error,
		},
		streaming: {
			icon: '◉',
			label: 'Streaming',
			color: THEME_COLORS.text.accent,
		},
	};

	return configs[status];
}

/**
 * Format number with thousands separator
 */
function formatNumber(num: number): string {
	return num.toLocaleString();
}

/**
 * Mode configuration
 */
interface ModeConfig {
	icon: string;
	label: string;
	color: string;
}

function getModeConfig(mode: 'mvp' | 'interactive'): ModeConfig {
	const configs: Record<'mvp' | 'interactive', ModeConfig> = {
		mvp: {
			icon: '🚀',
			label: 'MVP',
			color: THEME_COLORS.text.accent,
		},
		interactive: {
			icon: '🔒',
			label: 'Interactive',
			color: THEME_COLORS.text.success,
		},
	};

	return configs[mode];
}
