import PluginConfig from '@/sdk/types/pluginConfig'
import Plugin from '@/sdk/pluginSdk'
import PluginSpec from '@/sdk/types/pluginSpec'

export type LoadPluginResponse =
	| { status: 'loaded'; plugin: Plugin }
	| { status: 'skip'; reason?: string }
	| { status: 'invalid'; reason: string }

export default interface PluginDescriptor {
    uri: string
    status: "enabled" | "disabled" | "error"
	spec?: PluginSpec
}