import PluginConfig from '@/sdk/types/pluginConfig'

export default interface PluginDescriptor {
    uri: string,
    enabled: boolean,
    config?: PluginConfig
}