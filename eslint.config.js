import xo from 'xo/config';
import xoReact from 'eslint-config-xo-react';

export default [
	...xo,
	...xoReact,
	{
		rules: {
			'react/prop-types': 'off',
			'unicorn/expiring-todo-comments': 'off',
			'capitalized-comments': 'warn',
			'unicorn/better-regex': 'warn',
			'no-useless-escape': 'warn',
			'unicorn/switch-case-braces': 'warn',
			'unicorn/no-zero-fractions': 'warn',
			'unicorn/no-array-for-each': 'warn',
			'object-shorthand': 'warn',
			'default-case': 'warn',
			'no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
				},
			],
		},
	},
];
