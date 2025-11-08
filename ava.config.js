export default {
	files: ['test/**/*.test.ts', 'test/**/*.test.tsx'],
	extensions: {
		ts: 'module',
		tsx: 'module',
	},
	nodeArguments: ['--loader=@esbuild-kit/esm-loader'],
};
