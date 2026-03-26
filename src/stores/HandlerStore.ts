import PluginManagerStore from '@/stores/PluginManagerStore'
import { Handler } from '@d-najd/universal-media-tracker-sdk'

/**
 * Page size will be 20
 */
export default class HandlerStore {
	static getHandlersMatching(
		condition: (entry: [string, Handler]) => boolean
	): Handler[] {
		// Key is the id of the handler, this is to prevent duplicates
		const result: Map<string, Handler> = new Map<string, Handler>()

		for (const entry of PluginManagerStore.getLoadedPluginSpecs()) {
			const handlers = entry.handlers
			for (const handler of handlers) {
				result.set(handler[0], handler[1])
			}
		}

		// Filtering is done last to ensure consistent behavior
		return [...result.values()].filter((o) => condition([o.id, o]))
	}

	static async invokeCallbackOnHandler<T, R>(id: string, args: T) {
		const specs = PluginManagerStore.getLoadedPluginSpecsOld()
		const handler = specs
			.flatMap((o) => [...o.handlers.values()].flat())
			.find((o) => o.id === id)
		if (!handler) {
			throw Error("Handler with requested id doesn't exist")
		}

		const callback = handler.callback as (args: T) => Promise<R>
		return await callback(args)
	}
}
