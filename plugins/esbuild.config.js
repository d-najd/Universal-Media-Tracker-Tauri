import * as esbuild from 'esbuild'
import * as fs from 'node:fs'
import path from 'path'
import { globalExternals } from '@fal-works/esbuild-plugin-global-externals'

// const dir = 'src/app/plugins/ts'
const dir = 'plugins'

function replaceTest(text, replacements) {
	let result = text
	for (const [from, to] of Object.entries(replacements)) {
		const importRegex = new RegExp(
			`import\\s+?(?:(?:(?:[\\w*\\s{},]*)\\s+from\\s+?)|)(?:(?:"${from}")|(?:'${from}'))[\\s]*?(?:;|$|)`,
			'g',
		)
		console.log(importRegex)

		result = result.replace(importRegex, (fullMatch) => {
			// Replace just the package name with quotes removed
			const replacedPackage = fullMatch.replace(
				new RegExp(`["']${from}["']`),
				to,
			)

			return replacedPackage.replace(/^import/, 'var')
		})
	}
	return result
}

function replaceTest2(text) {
	return text.replace(
		/module\.exports = void 0/g,
		'module.exports = MelancholySdk',
	)
}

for (const folder of fs.readdirSync(dir)) {
	const indexPath = path.join(dir, folder, 'index.ts')
	if (!fs.existsSync(indexPath)) continue

	const buildResult = await esbuild.build({
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
					varName: 'RadixUi',
					type: 'cjs',
				},
				'@d-najd/universal-media-tracker-sdk': {
					varname: 'MelancholySdk',
					type: 'cjs',
				},
				'react/jsx-runtime': {
					varName: 'React',
					type: 'cjs',
				},
			}),
		],
		entryPoints: [indexPath],
		bundle: true,
		platform: 'node',
		format: 'esm',
		sourcemap: false,
		minify: false,
		jsx: 'transform',
		write: false,
	})

	let text = buildResult.outputFiles[0].text
	text = replaceTest2(text)

	fs.mkdirSync('src/app/plugins/js', { recursive: true })
	fs.writeFileSync(path.join('src/app/plugins/js', `${folder}.js`), text, {})
}
