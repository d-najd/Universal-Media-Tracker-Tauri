import PluginManagerStore from '@/stores/pluginManagerStore'

/**
 * Page size will be 20
 */
export default class HandlerManagerStore {
	static async getFromHandler<T, R>(id: string, args: T, limit: number = 20) {
		const specs = PluginManagerStore.getLoadedPluginSpecs()
		const handler = specs
			.flatMap((o) => [...o.handlers.values()].flat())
			.find((o) => o.id.localeCompare(id))
		if (!handler) {
			throw Error("Handler with requested id doesn't exist")
		}

		const result = await handler.callback(args)
		return result as R
	}
}
