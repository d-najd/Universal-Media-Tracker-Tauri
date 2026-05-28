import * as esbuild from 'esbuild'
import * as fs from 'node:fs'
import path from 'path'
import { globalExternals } from '@fal-works/esbuild-plugin-global-externals'
import { match } from 'node:assert/strict'

// const dir = 'src/app/plugins/ts'
const dir = 'plugins'

function importReplacerPlugin(replacements) {
	return {
		name: 'import-replacer',
		setup(build) {
			build.onLoad({ filter: /\.(js|jsx|ts|tsx|mjs|cjs)$/ }, (args) => {
				let contents = fs.readFileSync(args.path, 'utf8')

				for (const [from, to] of Object.entries(replacements)) {
					const importRegex = new RegExp(
						`import\\s+?(?:(?:(?:[\\w*\\s{},]*)\\s+from\\s+?)|)(?:(?:"${from}")|(?:'${from}'))[\\s]*?(?:;|$|)`,
						'g',
					)
					console.log(importRegex)

					const matches = contents.match(importRegex)
					// contents = contents.replace(importRegex, 'TEST')
					console.log('match ' + matches)
					// contents = contents.

					// const matchesArray = Array.from(matches)
					// matchesArray.forEach((match) => {
					// 	const stre = match.toString()
					// 	console.log('HELLo')
					// 	console.log(stre)
					//
					// 	const replacement = match
					// 		.toString()
					// 		.replace(`"${from}"`, to)
					// 	console.log(match)
					// 	console.log(`"${from}"`)
					// 	console.log(replacement)
					// 	// const replacement = match.replace(`"${from}"`, to)
					//
					// 	contents = contents.replace(match, replacement)
					// })
					// for (const match of matches) {
					// 	const replacement = match.replace(`"${from}"`, to)
					//
					// 	contents = contents.replace(match, replacement)
					// }
					// contents = contents.replaceAll(
					// 	importRegex,
					// 	(match, importedItems) => {
					// 		console.log('MATCH')
					// 		console.log(match)
					// 		console.log('IMPORTED')
					// 		console.log(importedItems)
					//
					// 		return `import ${importedItems} from "${to}"`
					// 	},
					// )
				}

				return { contents, loader: 'text' }

				// console.log('TEST')
				// let contents = fs.readFileSync(args.path, 'utf8')
				// let modified = false
				//
				// for (const [from, to] of Object.entries(replacements)) {
				// 	// Match: from 'original-package' or from "original-package"
				// 	const regex = new RegExp(
				// 		`(from\\s*['"])${escapeRegex(from)}(['"])`,
				// 		'g',
				// 	)
				//
				// 	const newContents = contents.replace(regex, `from ${to}`)
				// 	if (newContents !== contents) {
				// 		contents = newContents
				// 		modified = true
				// 	}
				// }
				//
				// if (modified) {
				// 	console.log(contents)
				// 	return {
				// 		contents,
				// 		loader: path.extname(args.path).slice(1) || 'ts',
				// 	}
				// }
				// return { contents, loader: 'ts' }
			})
			// build.onEnd((result) => {
			// 	if (result.errors.length > 0) {
			// 		console.log(
			// 			`⚠️ Suppressed ${result.errors.length} error(s)`,
			// 		)
			// 		result.errors = [] // Clear all errors
			// 	}
			// 	return result
			// })
		},
	}
}

for (const folder of fs.readdirSync(dir)) {
	const indexPath = path.join(dir, folder, 'index.ts')
	if (!fs.existsSync(indexPath)) continue

	await esbuild.build({
		// plugins: [
		// 	importReplacerPlugin({
		// 		// react: 'React',
		// 		// 'lucide-react': 'LucideReact',
		// 		// 'radix-ui': 'RadixUi',
		// 		// '@radix-ui/react-slot': 'RadixUi',
		// 		'@d-najd/universal-media-tracker-sdk': 'MelancholySdk',
		// 	}),
		// ],
		// plugins: [
		// 	globalExternals({
		// 		react: {
		// 			varName: 'React',
		// 			namedExports: [
		// 				'useState',
		// 				'useEffect',
		// 				'createElement',
		// 				'Fragment',
		// 				'useRef',
		// 				'useCallback',
		// 				'useLayoutEffect',
		// 			],
		// 		},
		// 		'lucide-react': {
		// 			varName: 'LucideReact',
		// 			namedExports: [
		// 				'Filter',
		// 				'LayoutGrid',
		// 				'LibraryBig',
		// 				'MoreVertical',
		// 				'Search',
		// 				'Settings',
		// 			],
		// 		},
		// 		'radix-ui': {
		// 			varName: 'RadixUi',
		// 			namedExports: ['Slot'],
		// 		},
		// 		'@radix-ui/react-slot': {
		// 			varName: 'RadixUi',
		// 			namedExports: ['Slot'],
		// 		},
		// 		'@d-najd/universal-media-tracker-sdk': {
		// 			varname: 'Reacte',
		// 			namedExports: ['Plugin'],
		// 		},
		// 	}),
		// ],
		entryPoints: [indexPath],
		outfile: path.join('src/app/plugins/js', `${folder}.js`),
		bundle: true,
		external: [
			'@d-najd/universal-media-tracker-sdk',
			'zustand',
			'react',
			'react-dom',
			'lucide-react',
			'radix-ui',
			'@radix-ui/react-slot',
			// 'react/jsx-runtime'
		],
		globals: {
			react: 'React', // Maps to window.React
		},
		platform: 'node',
		format: 'esm',
		sourcemap: false,
		minify: false,
		jsx: 'transform',
	})
}
