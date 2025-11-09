import React from 'react';
import {Box, Text} from 'ink';

type StatusType = 'success' | 'error' | 'warning' | 'info' | 'loading';

interface StatusConfig {
	symbol: string;
	color: string;
}

const STATUS_CONFIG: Record<StatusType, StatusConfig> = {
	success: {
		symbol: '✓',
		color: 'green',
	},
	error: {
		symbol: '✗',
		color: 'red',
	},
	warning: {
		symbol: '⚠',
		color: 'yellow',
	},
	info: {
		symbol: 'ℹ',
		color: 'blue',
	},
	loading: {
		symbol: '⏳',
		color: 'cyan',
	},
};

interface StatusIndicatorProps {
	status?: StatusType;
	text?: string;
	showText?: boolean;
}

export default function StatusIndicator({
	status = 'info',
	text,
	showText = true,
}: StatusIndicatorProps) {
	const config = STATUS_CONFIG[status] || STATUS_CONFIG.info;

	return (
		<Box>
			<Text color={config.color} bold>
				{config.symbol}
			</Text>
			{showText && text && (
				<Box marginLeft={1}>
					<Text color={config.color}>{text}</Text>
				</Box>
			)}
		</Box>
	);
}

// Export predefined status components
export const SuccessStatus: React.FC<{text?: string}> = ({text}) => (
	<StatusIndicator status="success" text={text} />
);
export const ErrorStatus: React.FC<{text?: string}> = ({text}) => (
	<StatusIndicator status="error" text={text} />
);
export const WarningStatus: React.FC<{text?: string}> = ({text}) => (
	<StatusIndicator status="warning" text={text} />
);
export const InfoStatus: React.FC<{text?: string}> = ({text}) => (
	<StatusIndicator status="info" text={text} />
);
export const LoadingStatus: React.FC<{text?: string}> = ({text}) => (
	<StatusIndicator status="loading" text={text} />
);
