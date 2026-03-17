import PluginManagerStore from '@/stores/pluginManagerStore'
import BaseHandlerArgs from '@/sdk/types/handler/base/baseHandlerArgs'
import BaseHandlerResponse from '@/sdk/types/handler/base/baseHandlerResponse'

/**
 * Page size will be 20
 */
export default class HandlerManagerStore {
	static async getFromMediaHandler<
		T extends BaseHandlerArgs,
		R extends BaseHandlerResponse
	>(id: string, args: T) {
		const specs = PluginManagerStore.getLoadedPluginSpecs()
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
