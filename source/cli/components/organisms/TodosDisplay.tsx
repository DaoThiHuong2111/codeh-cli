/**
 * Todos Display Component
 * Shows task list with progress tracking
 */

import {Box, Text} from 'ink';
import React from 'react';
import {Todo, TodoStatus} from '../../../core/domain/models/Todo.js';
import ProgressBar from '../atoms/ProgressBar.js';

export interface TodosDisplayProps {
	todos: Todo[];
	showProgress?: boolean;
	maxHeight?: number;
}

// Status icon and color mapping
const STATUS_CONFIG: Record<
	TodoStatus,
	{icon: string; color: string; label: string}
> = {
	pending: {icon: '○', color: 'gray', label: 'Pending'},
	in_progress: {icon: '◐', color: 'yellow', label: 'In Progress'},
	completed: {icon: '●', color: 'green', label: 'Completed'},
};

const TodoItem: React.FC<{todo: Todo}> = ({todo}) => {
	const config = STATUS_CONFIG[todo.status];

	return (
		<Box>
			<Text color={config.color}>{config.icon}</Text>
			<Box marginLeft={1}>
				<Text color={config.color} dimColor={todo.isCompleted()}>
					{todo.content}
				</Text>
			</Box>
		</Box>
	);
};

export const TodosDisplay: React.FC<TodosDisplayProps> = ({
	todos,
	showProgress = true,
	maxHeight,
}) => {
	const total = todos.length;
	const completed = todos.filter(t => t.isCompleted()).length;
	const inProgress = todos.filter(t => t.isInProgress()).length;
	const pending = todos.filter(t => t.isPending()).length;

	if (total === 0) {
		return null;
	}

	const inProgressTodos = todos.filter(t => t.isInProgress());
	const pendingTodos = todos.filter(t => t.isPending());
	const completedTodos = todos.filter(t => t.isCompleted());

	return (
		<Box
			flexDirection="column"
			borderStyle="single"
			borderColor="blue"
			paddingX={1}
			marginY={1}
		>
			<Box>
				<Text bold color="blue">
					📋 Tasks
				</Text>
				<Box marginLeft={1}>
					<Text dimColor>
						({completed}/{total} completed)
					</Text>
				</Box>
			</Box>

			{showProgress && total > 0 && (
				<Box marginTop={1}>
					<ProgressBar
						current={completed}
						total={total}
						width={30}
						showPercentage={true}
						color="green"
					/>
				</Box>
			)}

			<Box flexDirection="column" marginTop={1}>
				{inProgressTodos.length > 0 && (
					<Box flexDirection="column">
						<Text bold color="yellow">
							⚡ {STATUS_CONFIG.in_progress.label} ({inProgress})
						</Text>
						<Box flexDirection="column" marginLeft={2}>
							{inProgressTodos.map(todo => (
								<TodoItem key={todo.id} todo={todo} />
							))}
						</Box>
					</Box>
				)}

				{pendingTodos.length > 0 && (
					<Box
						flexDirection="column"
						marginTop={inProgressTodos.length > 0 ? 1 : 0}
					>
						<Text bold color="gray">
							⏳ {STATUS_CONFIG.pending.label} ({pending})
						</Text>
						<Box flexDirection="column" marginLeft={2}>
							{pendingTodos.map(todo => (
								<TodoItem key={todo.id} todo={todo} />
							))}
						</Box>
					</Box>
				)}

				{completedTodos.length > 0 && (
					<Box flexDirection="column" marginTop={1}>
						<Text bold color="green" dimColor>
							✓ {STATUS_CONFIG.completed.label} ({completed})
						</Text>
						<Box flexDirection="column" marginLeft={2}>
							{completedTodos.map(todo => (
								<TodoItem key={todo.id} todo={todo} />
							))}
						</Box>
					</Box>
				)}
			</Box>
		</Box>
	);
};
