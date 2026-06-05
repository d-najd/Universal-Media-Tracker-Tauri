import { LocalPluginConfig, Handler } from '@d-najd/universal-media-tracker-sdk'
import AppApi from 'node_modules/@d-najd/universal-media-tracker-sdk/dist/AppApi'
import HandlerRegistry from './HandlerRegistry'
import PluginManagerStore from './PluginManagerStore'

let appApi: AppApi | null = null
export default function getAppApi(): AppApi {
	if (!appApi) {
		appApi = {
			plugin: {
				getLocalPluginConfigs: (): LocalPluginConfig[] =>
					PluginManagerStore.getLocalPluginConfigs(),
				getHandlersMatching: (
					condition: (entry: Handler) => boolean,
				): Handler[] => HandlerRegistry.getHandlersMatching(condition),
				getHandlersMatchingWithPluginId: (
					condition: (entry: [string, Handler]) => boolean,
				): Map<string, Handler[]> =>
					HandlerRegistry.getHandlersMatchingWithPluginId(condition),
				invokeCallbackOnHandler: <T, R>(
					id: string,
					args: T,
				): Promise<R> =>
					HandlerRegistry.invokeCallbackOnHandler(id, args),
			},
		}
	}
	return appApi!
}
