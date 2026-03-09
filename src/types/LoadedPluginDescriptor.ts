import PluginConfig from '@/sdk/types/pluginConfig'
import Plugin from '@/sdk/pluginSdk'
import PluginDescriptor from '@/types/pluginDescriptor'
import PluginSpec from '@/sdk/types/pluginSpec'

export interface LoadedPluginDescriptor extends PluginDescriptor {
	spec: PluginSpec
}
