export default {
	files: ['test/**/*.test.ts', 'test/**/*.test.tsx'],
	extensions: {
		ts: 'module',
		tsx: 'module',
	},
	nodeArguments: ['--import=tsx'],
};
