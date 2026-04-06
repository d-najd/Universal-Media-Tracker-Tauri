import PluginManagerStore from '@/stores/PluginManagerStore'
import { Handler } from '@d-najd/universal-media-tracker-sdk'

/**
 * Page size will be 20
 */
export default class HandlerRegistry {
	static getHandlersMatching(
		condition: (entry: Handler) => boolean,
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
		return [...result.values()].filter((o) => condition(o))
	}

	/**
	 * key is id of the plugin
	 * @param condition key is pluginId, value is handler
	 */
	static getHandlersMatchingWithPluginId(
		condition: (entry: [string, Handler]) => boolean,
	): Map<string, Handler[]> {
		// Key is the id of the handler, this is to prevent duplicates
		const filteringMap: Map<
			string,
			{ handler: Handler; pluginId: string }
		> = new Map<string, { handler: Handler; pluginId: string }>()

		for (const entry of PluginManagerStore.getLoadedPluginSpecs()) {
			const handlers = entry.handlers
			for (const handler of handlers) {
				filteringMap.set(handler[0], {
					handler: handler[1],
					pluginId: entry.config.id,
				})
			}
		}

		const result: Map<string, Handler[]> = new Map<string, Handler[]>()
		const filtered = [...filteringMap.values()].filter((o) =>
			condition([o.pluginId, o.handler]),
		)

		for (const entry of filtered) {
			if (result.has(entry.pluginId)) {
				result.get(entry.pluginId)!.push(entry.handler)
			}
			result.set(entry.pluginId, [entry.handler])
		}

		return result
	}

	static async invokeCallbackOnHandler<T, R>(id: string, args: T) {
		const handler = this.getHandlersMatching(
			(handler) => handler.id === id,
		)[0]
		if (!handler) {
			throw Error("Handler with requested id doesn't exist")
		}

		const callback = handler.callback as (args: T) => Promise<R>
		return await callback(args)
	}

	/**
	 * All the other methods work with overriding handlerId if another plugin
	 * of higher priority registers handler with the same id, except this one,
	 * This method should be avoided if possible
	 */
	// static async getHandlerNoOverrides(handlerId: string, pluginId: string): Promise<Handler> {
	// 	for (const entry of PluginManagerStore.getLoadedPluginSpecs()) {
	// 		if (entry.config.id !== pluginId) continue
	//
	// 		const handler = entry.handlers.get(handlerId)
	//
	// 		if (handler !== undefined) {
	// 			return handler
	// 		}
	// 	}
	// 	throw Error(
	// 		`Handler with id ${handlerId} and pluginId ${pluginId} doesn't exist!`
	// 	)
	// }
}
