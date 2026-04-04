import globals from 'globals'
import pluginJs from '@eslint/js'
import tseslint from 'typescript-eslint'
import pluginReact from 'eslint-plugin-react'
import eslintConfigPrettier from 'eslint-config-prettier'

export default [
	{ files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'] },
	{ ignores: ['**/components/ui', '**/src-tauri'] },
	{ languageOptions: { globals: globals.browser } },
	pluginJs.configs.recommended,
	...tseslint.configs.recommended,
	{
		settings: {
			react: {
				version: 'detect'
			}
		}
	},
	pluginReact.configs.flat.recommended,
	eslintConfigPrettier,
	{
		rules: {
			// 'react/react-in-jsx-scope': 'off',
			'@typescript-eslint/no-unused-vars': ['warn'],
			'@typescript-eslint/no-explicit-any': 'warn',
			'react/jsx-uses-react': 'off',
			'react/react-in-jsx-scope': 'off',
			'@typescript-eslint/no-empty-object-type': 'off'
		}
	}
]
