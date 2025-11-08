/**
 * useCodehClient Hook
 * Lazy loads CodehClient when needed (not during app startup)
 */

import { useCallback, useState } from 'react';
import { Container } from '../../core/di/Container';
import { CodehClient } from '../../core/application/CodehClient';
import { createCodehClient } from '../../core/di/setup';

export function useCodehClient(container: Container) {
	const [client, setClient] = useState<CodehClient | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	/**
	 * Lazy load the client when first needed
	 * Returns the client if successful, null if error
	 */
	const initializeClient = useCallback(async (): Promise<CodehClient | null> => {
		// If already loaded, return it
		if (client) {
			return client;
		}

		setLoading(true);
		setError(null);

		try {
			const newClient = await createCodehClient(container);
			setClient(newClient);
			return newClient;
		} catch (err: any) {
			const errorMessage = err.message || 'Failed to load CodehClient';
			setError(errorMessage);
			console.error('Failed to load CodehClient:', err);
			return null;
		} finally {
			setLoading(false);
		}
	}, [container, client]);

	return { client, loading, error, initializeClient };
}
