/**
 * useCodehChat Hook
 * Access CodehChat from DI Container
 */

import { useEffect, useState } from 'react';
import { Container } from '../../core/di/Container';
import { CodehChat } from '../../core/application/CodehChat';

export function useCodehChat(container: Container) {
	const [chat, setChat] = useState<CodehChat | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const loadChat = async () => {
			try {
				const resolvedChat = container.resolve<CodehChat>('CodehChat');
				setChat(resolvedChat);
			} catch (err: any) {
				setError(err.message || 'Failed to load CodehChat');
				console.error('Failed to load CodehChat:', err);
			} finally {
				setLoading(false);
			}
		};

		loadChat();
	}, [container]);

	return { chat, loading, error };
}
