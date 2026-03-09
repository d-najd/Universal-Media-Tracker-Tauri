import PluginConfig from '@/sdk/types/pluginConfig'
import { Handler } from '@/sdk/pluginSdk'

export default interface PluginSpec {
	config: PluginConfig
	handlers: Handler
}