import PluginSpecLoader, {
	LoadPluginSpecResponse
} from '@/lib/plugin/pluginSpecLoader'

export default class LocalPluginSpecLoader implements PluginSpecLoader {
	id = 'localPluginSpecLoader'

	async loadPluginSpec(uri: string): Promise<LoadPluginSpecResponse> {
		if (!uri.startsWith('/src/app/plugins/')) {
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
