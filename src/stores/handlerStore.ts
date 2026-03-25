import PluginManagerStore from '@/stores/pluginManagerStore'
import BaseHandlerArgs from '@d-najd/universal-media-tracker-sdk/dist/types/handler/base/BaseHandlerArgs'
import BaseHandlerResponse from '@d-najd/universal-media-tracker-sdk/dist/types/handler/base/BaseHandlerResponse'

/**
 * Page size will be 20
 */
export default class HandlerStore {
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
