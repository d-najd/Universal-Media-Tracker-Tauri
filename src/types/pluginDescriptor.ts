import PluginConfig from '@/sdk/types/pluginConfig'

export default interface PluginDescriptor {
    pluginUri: string,
    enabled: boolean,
    config?: PluginConfig
}