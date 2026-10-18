import { LocalPluginConfig, Handler } from "@d-najd/universal-media-tracker-sdk"
import AppApi from "node_modules/@d-najd/universal-media-tracker-sdk/dist/AppApi"
import HandlerRegistry from "./HandlerRegistry"
import PluginManagerStore from "./PluginManagerStore"
import { getStorage } from "@/lib/storage"

let appApi: AppApi | null = null
export default async function getAppApi(): Promise<AppApi> {
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
			storage: await getStorage(),
		}
	}
	return appApi!
}
