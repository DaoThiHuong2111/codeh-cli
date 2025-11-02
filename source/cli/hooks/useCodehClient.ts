/**
 * useCodehClient Hook
 * Access CodehClient from DI Container
 */

import { useEffect, useState } from 'react';
import { Container } from '../../core/di/Container';
import { CodehClient } from '../../core/application/CodehClient';

export function useCodehClient(container: Container) {
	const [client, setClient] = useState<CodehClient | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const loadClient = async () => {
			try {
				const resolvedClient = await container.resolve<Promise<CodehClient>>(
					'CodehClient'
				);
				const actualClient = await resolvedClient;
				setClient(actualClient);
			} catch (err: any) {
				setError(err.message || 'Failed to load CodehClient');
				console.error('Failed to load CodehClient:', err);
			} finally {
				setLoading(false);
			}
		};

		loadClient();
	}, [container]);

	return { client, loading, error };
}
