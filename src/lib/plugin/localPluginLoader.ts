import PluginLoader, { LoadPluginResponse } from '@/lib/plugin/pluginLoader'

export default class LocalPluginLoader implements PluginLoader {
	id = 'localPluginLoader'

	async loadPlugin(uri: string): Promise<LoadPluginResponse> {
		if (!uri.startsWith('src/app/plugins/')) {
			return { status: 'skip' }
		}

		try {
			const module = await import(/* @vite-ignore */ uri)
			const plugin = module.default

			if (!plugin) {
				return { status: 'invalid', reason: 'No default export found' }
			}

			return { status: 'loaded', spec: plugin }
		} catch (err: unknown) {
			if (err instanceof Error) {
				return { status: 'invalid', reason: err.message }
			}
			return { status: 'invalid', reason: String(err) }
		}
	}
}
