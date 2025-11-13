/**
 * User Service - Manages user operations
 */

export interface User {
	id: string;
	name: string;
	email: string;
	age?: number;
}

export class UserService {
	private users: Map<string, User> = new Map();

	/**
	 * Create a new user
	 */
	createUser(name: string, email: string): User {
		const user: User = {
			id: this.generateId(),
			name,
			email,
		};
		this.users.set(user.id, user);
		return user;
	}

	/**
	 * Find user by ID
	 */
	findById(id: string): User | undefined {
		return this.users.get(id);
	}

	/**
	 * Update user information
	 */
	updateUser(id: string, updates: Partial<User>): User | undefined {
		const user = this.users.get(id);
		if (!user) {
			return undefined;
		}

		const updated = {...user, ...updates};
		this.users.set(id, updated);
		return updated;
	}

	/**
	 * Delete user by ID
	 */
	deleteUser(id: string): boolean {
		return this.users.delete(id);
	}

	/**
	 * Get all users
	 */
	getAllUsers(): User[] {
		return Array.from(this.users.values());
	}

	/**
	 * Generate unique ID
	 */
	private generateId(): string {
		return `user_${Date.now()}_${Math.random()}`;
	}
}
