/**
 * Sample TypeScript file for testing code intelligence tools
 */

export interface User {
	id: number;
	name: string;
	email?: string;
}

export class UserService {
	private users: User[] = [];

	async fetchUser(id: number): Promise<User | null> {
		const user = this.users.find(u => u.id === id);
		return user || null;
	}

	async createUser(name: string, email?: string): Promise<User> {
		const newUser: User = {
			id: this.users.length + 1,
			name,
			email,
		};
		this.users.push(newUser);
		return newUser;
	}

	getAllUsers(): User[] {
		return this.users;
	}
}

export async function processUser(userId: number): Promise<void> {
	const service = new UserService();
	const user = await service.fetchUser(userId);

	if (user) {
		console.log(`Processing user: ${user.name}`);
	}
}

export const DEFAULT_USER_NAME = 'Anonymous';
