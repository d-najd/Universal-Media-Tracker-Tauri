import PluginConfig from '@/sdk/types/pluginConfig'
import { Handler } from '@/sdk/pluginSdk'

export default interface PluginSpec {
	readonly config: PluginConfig
	readonly onLoad: () => void
	readonly onUnload: () => void
	readonly handlers: Map<string, Handler>
}
