import PluginSpec from '@/sdk/types/pluginSpec'

export default interface PluginLoader {
	id: string,
	loadPlugin(uri: string): Promise<LoadPluginResponse>
}

export type LoadPluginResponse =
	| { status: 'loaded'; spec: PluginSpec }
	| { status: 'skip'; reason?: string }
	| { status: 'invalid'; reason: string }

// export default class PluginLoader {
// 	loadBasePlugins() {
// 		let descriptors: PluginDescriptor[] = uri.map((o) => ({
// 			uri: o,
// 			enabled: true
// 		}))
//
// 		basePlugins.map((o) => new PluginDescriptor())
// 	}
//
// 	loadPluginsFromUris(...uri: string[]) {
// 		let descriptors: PluginDescriptor[] = uri.map((o) => ({
// 			uri: o,
// 			enabled: true
// 		}))
//
// 		this.loadPlugins(...descriptors)
// 	}
//
// 	loadPlugins(...descriptors: PluginDescriptor[]) {
// 		descriptors.forEach((o) => {})
// 	}
//
// 	registerPlugins()
// }