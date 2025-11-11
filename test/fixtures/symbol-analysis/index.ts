/**
 * Main entry point - exports all services
 */

export {UserService, User} from './UserService';
export {Calculator} from './Calculator';
export {ProductRepository} from './ProductRepository';

// Re-export types
export type {Product} from './ProductRepository';
