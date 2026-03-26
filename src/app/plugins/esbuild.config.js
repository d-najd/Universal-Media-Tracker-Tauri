import * as esbuild from 'esbuild'

await esbuild.build({
	entryPoints: ['src/app/plugins/ts/*.ts'],
	outdir: 'src/app/plugins/js',
	bundle: true,
	// external: ['@d-najd/universal-media-tracker-sdk'],
	platform: 'node',
	format: 'esm',
	sourcemap: false,
	minify: false
})
