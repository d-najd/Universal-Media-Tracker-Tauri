import PluginConfig from '@d-najd/universal-media-tracker-sdk/dist/types/PluginConfig'
import Plugin from '@d-najd/universal-media-tracker-sdk/dist/Plugin'
import PluginSourceHandlerResponse from '@d-najd/universal-media-tracker-sdk/dist/types/handler/plugin/source/PluginSourceHandlerResponse'
import PluginSourceHandlerArgs from '@d-najd/universal-media-tracker-sdk/dist/types/handler/plugin/source/PluginSourceHandlerArgs'

const options: PluginConfig = {
	id: 'local-plugin-loader',
	name: 'Local Plugin Loader',
	version: '0.0.1'
}

export const localPluginSourceRelativePath = import.meta.url.replace(
	'file://' + process.cwd() + '/',
	''
)
const plugin = new Plugin(options)

plugin.definePluginSourceHandler({
	async callback(
		args: PluginSourceHandlerArgs
	): Promise<PluginSourceHandlerResponse> {
		const uri = args.uri
		if (!uri.startsWith('/src/app/plugins/')) {
			return { status: 'skip' }
		}

		try {
			const module = await import(/* @vite-ignore */ uri)
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

			const code = await import(/* @vite-ignore */ uri + '?raw')
			const codeStr = code.default as string
			return { status: 'valid', code: codeStr }
		} catch (err: unknown) {
			if (err instanceof Error) {
				return { status: 'invalid', reason: err.message }
			}
			return { status: 'invalid', reason: String(err) }
		}
	}
})

export default plugin
