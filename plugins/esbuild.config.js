import * as esbuild from 'esbuild'
import * as fs from 'node:fs'
import path from 'path'

// const dir = 'src/app/plugins/ts'
const dir = 'plugins'

for (const folder of fs.readdirSync(dir)) {
	const indexPath = path.join(dir, folder, 'index.ts')
	if (!fs.existsSync(indexPath)) continue

	await esbuild.build({
		entryPoints: [indexPath],
		outfile: path.join('src/app/plugins/js', `${folder}.js`),
		bundle: true,
		external: [
			'@d-najd/universal-media-tracker-sdk',
			'zustand',
			'react',
			'react-dom',
			'react/jsx-runtime'
		],
		platform: 'node',
		jsx: 'automatic',
		format: 'esm',
		sourcemap: false,
		minify: false
	})
}

// const entryPoints = fs.readdirSync(dir)
//     .filter(o => fs.statSync(path.join(dir, o)).isDirectory())
//     .map(o => path.join(dir, o, 'index.ts'))
//     .filter(o => fs.existsSync(o))
//
// await esbuild.build({
// 	entryPoints: entryPoints,
// 	outdir: 'src/app/plugins/js',
// 	bundle: true,
// 	external: ['@d-najd/universal-media-tracker-sdk'],
// 	platform: 'node',
// 	format: 'esm',
// 	sourcemap: false,
// 	minify: false
// })
