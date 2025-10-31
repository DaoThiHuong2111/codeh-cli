import React from 'react';
import {Box, Text} from 'ink';

const STATUS_CONFIG = {
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

export default function StatusIndicator({
	status = 'info',
	text,
	showText = true,
}) {
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
export const SuccessStatus = ({text}) => (
	<StatusIndicator status="success" text={text} />
);
export const ErrorStatus = ({text}) => (
	<StatusIndicator status="error" text={text} />
);
export const WarningStatus = ({text}) => (
	<StatusIndicator status="warning" text={text} />
);
export const InfoStatus = ({text}) => (
	<StatusIndicator status="info" text={text} />
);
export const LoadingStatus = ({text}) => (
	<StatusIndicator status="loading" text={text} />
);
