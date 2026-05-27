import * as esbuild from 'esbuild'
import * as fs from 'node:fs'
import path from 'path'
import { globalExternals } from '@fal-works/esbuild-plugin-global-externals'

// const dir = 'src/app/plugins/ts'
const dir = 'plugins'

for (const folder of fs.readdirSync(dir)) {
	const indexPath = path.join(dir, folder, 'index.ts')
	if (!fs.existsSync(indexPath)) continue

	await esbuild.build({
		plugins: [
			globalExternals({
				react: {
					varName: 'React',
					namedExports: [
						'useState',
						'useEffect',
						'createElement',
						'Fragment',
						'useRef',
						'useCallback',
						'useLayoutEffect',
					],
				},
				'lucide-react': {
					varName: 'LucideReact',
					namedExports: [
						'Filter',
						'LayoutGrid',
						'LibraryBig',
						'MoreVertical',
						'Search',
						'Settings',
					],
					defaultExport: true,
				},
				'radix-ui': {
					varName: 'RadixUi',
					namedExports: ['Slot'],
				},
				'@radix-ui/react-slot': {
					varName: 'RadixUi',
					namedExports: ['Slot'],
				},
			}),
		],
		entryPoints: [indexPath],
		outfile: path.join('src/app/plugins/js', `${folder}.js`),
		bundle: true,
		external: [
			'@d-najd/universal-media-tracker-sdk',
			'zustand',
			'react',
			'react-dom',
			'lucide-react',
			// 'react/jsx-runtime'
		],
		platform: 'node',
		format: 'esm',
		sourcemap: false,
		minify: false,
		jsx: 'transform',
	})
}
