// esbuild-plugin-import-replacer.ts
import { Plugin } from 'esbuild'
import fs from 'fs/promises'

interface ImportReplacement {
	[originalPath: string]: string
}

export function importReplacerPlugin(replacements: ImportReplacement): Plugin {
	return {
		name: 'import-replacer',
		setup(build) {
			build.onLoad(
				{ filter: /\.(js|jsx|ts|tsx|mjs|cjs)$/ },
				async (args) => {
					let contents = await fs.readFile(args.path, 'utf8')
					let modified = false

					for (const [from, to] of Object.entries(replacements)) {
						const regex = new RegExp(
							`(from\\s*['"])${escapeRegex(from)}(['"])`,
							'g',
						)

						const newContents = contents.replace(regex, `$1${to}$2`)
						if (newContents !== contents) {
							contents = newContents
							modified = true
						}
					}

					if (modified) {
						return { contents, loader: 'ts' }
					}

					return null
				},
			)
		},
	}
}

function escapeRegex(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
