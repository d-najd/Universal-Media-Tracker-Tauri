import PluginSpec from '@/sdk/types/pluginSpec'
import Plugin from '@/sdk/pluginSdk'

type PluginDescriptor =
	| {
			readonly uri: string
			readonly status: 'enabled'
			readonly plugin: Plugin
			readonly spec: PluginSpec
	  }
	| {
			readonly uri: string
			readonly status: 'disabled'
			readonly plugin?: Plugin
	  }
	| { readonly uri: string; readonly status: 'error' }

export default PluginDescriptor
