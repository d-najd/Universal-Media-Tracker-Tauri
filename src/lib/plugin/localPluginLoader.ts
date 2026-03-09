import PluginLoader, { LoadPluginResponse } from '@/lib/plugin/pluginLoader'

class LocalPluginLoader implements PluginLoader {
	async loadPlugin(uri: string): Promise<LoadPluginResponse> {
		if (!uri.startsWith('@')) {
			return { status: 'skip' }
		}

		try {
			const plugin = await import(uri)

			return { status: 'skip'}
		} catch (err: any) {
			return { status: 'invalid', reason: err.message }
		}
	}
}