/**
 * Upgrade Info Model
 * Represents API response for upgrade information
 */

export interface UpgradeInfoResponse {
	version: string; // API field name
	messages: string; // API field name
	id: string;
}

export class UpgradeInfo {
	constructor(
		public readonly version: string,
		public readonly message: string,
		public readonly id: string,
	) {}

	static fromApiResponse(data: UpgradeInfoResponse): UpgradeInfo {
		return new UpgradeInfo(
			data.version, // API field
			data.messages, // API field
			data.id,
		);
	}

	hasValidContent(): boolean {
		return (
			(this.version !== null &&
				this.version !== undefined &&
				this.version.trim() !== '') ||
			(this.message !== null &&
				this.message !== undefined &&
				this.message.trim() !== '')
		);
	}

	isValid(): boolean {
		return (
			this.version !== null &&
			this.version !== undefined &&
			this.version.trim() !== '' &&
			this.message !== null &&
			this.message !== undefined &&
			this.message.trim() !== ''
		);
	}
}
