import * as esbuild from 'esbuild'
import * as fs from 'node:fs'
import path from 'path'

const dir = 'src/app/plugins/ts'

const entryPoints = fs
	.readdirSync(dir)
	.filter((f) => f.endsWith('.ts') && f !== 'LocalPluginSource.ts')
	.map((f) => path.join(dir, f))

await esbuild.build({
	entryPoints: entryPoints,
	outdir: 'src/app/plugins/js',
	bundle: true,
	// external: ['@d-najd/universal-media-tracker-sdk'],
	platform: 'node',
	format: 'esm',
	sourcemap: false,
	minify: false
})
