import PluginConfig from '@/sdk/types/pluginConfig'
import Handler from '@/sdk/types/catalog/Handler'

export default interface PluginSpec {
	readonly config: PluginConfig
	readonly onLoad: () => Promise<void>
	readonly onUnload: () => Promise<void>
	readonly handlers: Map<string, Handler>
}
