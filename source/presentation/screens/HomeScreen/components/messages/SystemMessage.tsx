/**
 * SystemMessage component
 * Displays system announcements, errors, warnings, and status updates
 */

import React from 'react';
import {Box, Text} from 'ink';
import {THEME_COLORS} from '../../utils/colors';
import {wrapText} from '../../utils/textUtils';

export type SystemMessageType = 'info' | 'error' | 'warning' | 'success';

export interface SystemMessageProps {
	/** System message text */
	message: string;
	/** Message type (determines icon and color) */
	type?: SystemMessageType;
	/** Terminal width for text wrapping */
	terminalWidth: number;
	/** Optional title */
	title?: string;
}

/**
 * SystemMessage - Display system notifications with type-specific styling
 */
export const SystemMessage: React.FC<SystemMessageProps> = ({
	message,
	type = 'info',
	terminalWidth,
	title,
}) => {
	const config = getSystemMessageConfig(type);

	const contentWidth = terminalWidth - 4;
	const lines = wrapText(message, contentWidth);

	return (
		<Box
			flexDirection="column"
			marginY={1}
			paddingX={2}
			paddingY={1}
			borderStyle="round"
			borderColor={config.color}
		>
			<Box marginBottom={lines.length > 1 ? 1 : 0}>
				<Text color={config.color} bold>
					{config.icon} {title || config.label}
				</Text>
			</Box>

			<Box flexDirection="column">
				{lines.map((line, index) => (
					<Text key={index} color={config.textColor}>
						{line}
					</Text>
				))}
			</Box>
		</Box>
	);
};

/**
 * Configuration for each system message type
 */
interface SystemMessageConfig {
	icon: string;
	label: string;
	color: string;
	textColor: string;
}

function getSystemMessageConfig(type: SystemMessageType): SystemMessageConfig {
	const configs: Record<SystemMessageType, SystemMessageConfig> = {
		info: {
			icon: 'ℹ',
			label: 'Info',
			color: THEME_COLORS.text.accent,
			textColor: THEME_COLORS.text.secondary,
		},
		error: {
			icon: '✖',
			label: 'Error',
			color: THEME_COLORS.text.error,
			textColor: THEME_COLORS.text.error,
		},
		warning: {
			icon: '⚠',
			label: 'Warning',
			color: THEME_COLORS.text.warning,
			textColor: THEME_COLORS.text.warning,
		},
		success: {
			icon: '✓',
			label: 'Success',
			color: THEME_COLORS.text.success,
			textColor: THEME_COLORS.text.success,
		},
	};

	return configs[type];
}
