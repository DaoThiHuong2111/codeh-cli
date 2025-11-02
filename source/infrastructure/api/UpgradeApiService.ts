/**
 * Upgrade API Service
 * Handles API calls for upgrade information
 */

import {
	UpgradeInfo,
	UpgradeInfoResponse,
} from '../../core/domain/models/UpgradeInfo';

export class UpgradeApiService {
	private readonly apiUrl =
		'https://68ff9efce02b16d1753eb347.mockapi.io/api/v1/upgrade';

	async fetchUpgradeInfo(): Promise<UpgradeInfo | null> {
		try {
			const response = await fetch(this.apiUrl);

			if (!response.ok) {
				console.warn('Failed to fetch upgrade info:', response.status);
				return null;
			}

			const data = (await response.json()) as UpgradeInfoResponse[];

			if (!Array.isArray(data) || data.length === 0) {
				console.warn('Invalid API response format');
				return null;
			}

			// Take first item from array
			const firstItem = data[0];

			// Check if version or message is not null/empty
			if (
				(firstItem.version !== null && firstItem.version.trim() !== '') ||
				(firstItem.messages !== null && firstItem.messages.trim() !== '')
			) {
				return UpgradeInfo.fromApiResponse(firstItem);
			}

			return null;
		} catch (error: any) {
			console.warn('Error fetching upgrade info:', error.message);
			return null;
		}
	}
}
