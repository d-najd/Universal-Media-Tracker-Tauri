import PluginParser, {
	ParsePluginResponse
} from '@/lib/plugin/pluginSpecParser'
import Plugin from '@/sdk/pluginSdk'

export default class LocalPluginParser implements PluginParser {
	id = 'localPluginParser'

	async loadPlugin(uri: string): Promise<ParsePluginResponse> {
		if (!uri.startsWith('/src/app/plugins/')) {
			return { status: 'skip' }
		}

		try {
			const module = await import(/* @vite-ignore */ uri)
			const plugin: Plugin = module.default

			if (!plugin) {
				return { status: 'invalid', reason: 'No default export found' }
			}

			return { status: 'valid', plugin: plugin }
		} catch (err: unknown) {
			if (err instanceof Error) {
				return { status: 'invalid', reason: err.message }
			}
			return { status: 'invalid', reason: String(err) }
		}
	}
}
