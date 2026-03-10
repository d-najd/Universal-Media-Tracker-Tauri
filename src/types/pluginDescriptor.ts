import PluginSpec from '@/sdk/types/pluginSpec'

type PluginDescriptor =
	| {
			readonly uri: string
			readonly status: 'enabled'
			readonly spec: PluginSpec
	  }
	| {
			readonly uri: string
			readonly status: 'disabled'
			readonly spec?: PluginSpec
	  }
	| { readonly uri: string; readonly status: 'error' }

export default PluginDescriptor
