/**
 * usePresenter Hook
 * Generic hook for creating and managing presenters
 */

import { useState, useEffect } from 'react';

type PresenterConstructor<T> = new (...args: any[]) => T;

export function usePresenter<T>(
	PresenterClass: PresenterConstructor<T>,
	...dependencies: any[]
): T | null {
	const [presenter, setPresenter] = useState<T | null>(null);

	useEffect(() => {
		// Check if all dependencies are available
		const allDepsReady = dependencies.every((dep) => dep !== null && dep !== undefined);

		if (allDepsReady) {
			try {
				const instance = new PresenterClass(...dependencies);
				setPresenter(instance);
			} catch (error) {
				console.error('Failed to create presenter:', error);
			}
		}
	}, [...dependencies]);

	return presenter;
}
