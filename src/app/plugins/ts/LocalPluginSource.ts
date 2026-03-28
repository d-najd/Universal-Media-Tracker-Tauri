import {
	Plugin,
	PluginConfig,
	PluginSourceHandlerArgs,
	PluginSourceHandlerResponse
} from '@d-najd/universal-media-tracker-sdk'

const options: PluginConfig = {
	id: 'local-plugin-loader',
	name: 'Local Plugin Loader',
	version: '0.0.1'
}

const plugin = new Plugin(options)

plugin.definePluginSourceHandler({
	async callback(
		args: PluginSourceHandlerArgs
	): Promise<PluginSourceHandlerResponse> {
		const url = args.url
		if (!url.startsWith('/src/app/plugins/')) {
			return { status: 'skip' }
		}

		try {
			// const module = await import(
			// 	/* @vite-ignore */ pathToFileURL(url).href
			// )
			const first = import.meta.glob('@/app/plugins/js/*.js')
			const module = (await first[url]()) as any
			const plugin: Plugin = module.default

			if (!plugin) {
				return { status: 'invalid', reason: 'No default export found' }
			}

			const config = plugin.config

			if (!config) {
				return {
					status: 'invalid',
					reason: 'failed to read plugin config'
				}
			}

			const code = (await import(/* @vite-ignore */ url + '?raw'))
				.default as string
			return { status: 'valid', code: code }
		} catch (err: unknown) {
			if (err instanceof Error) {
				return { status: 'invalid', reason: err.message }
			}
			return { status: 'invalid', reason: String(err) }
		}
	}
})

async function loadPluginFromCode(code: string): Promise<Plugin> {
	const blob = new Blob([code], {
		type: 'text/javascript'
	})
	const url = URL.createObjectURL(blob)
	const module = await import(/* @vite-ignore */ url)
	URL.revokeObjectURL(url)
	return module.default
}

export default plugin
