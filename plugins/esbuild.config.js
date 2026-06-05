import * as esbuild from 'esbuild'
import * as fs from 'node:fs'
import path from 'path'
import { globalExternals } from '@fal-works/esbuild-plugin-global-externals'

const dir = 'plugins'

for (const folder of fs.readdirSync(dir)) {
	const indexPath = path.join(dir, folder, 'index.ts')
	if (!fs.existsSync(indexPath)) continue

	await esbuild.build({
		plugins: [
			globalExternals({
				react: {
					varName: 'React',
					type: 'cjs',
				},
				'lucide-react': {
					varName: 'LucideReact',
					type: 'cjs',
				},
				'radix-ui': {
					varName: 'RadixUi',
					type: 'cjs',
				},
				'@radix-ui/react-slot': {
					varName: 'RadixUiReactSlot',
					type: 'cjs',
				},
				'@d-najd/universal-media-tracker-sdk': {
					varName: 'MelancholySdk',
					type: 'cjs',
				},
				'react/jsx-runtime': {
					varName: 'ReactJSXRuntime',
					type: 'cjs',
				},
				'react-router': {
					varName: 'ReactRouter',
					type: 'cjs',
				},
			}),
		],
		define: {
			'process.env.NODE_ENV': '"development"', // or '"development"'
		},
		entryPoints: [indexPath],
		bundle: true,
		platform: 'node',
		format: 'esm',
		sourcemap: false,
		minify: true,
		outfile: path.join('src/app/plugins/js', `${folder}.js`),
		jsx: 'transform',
	})
}
