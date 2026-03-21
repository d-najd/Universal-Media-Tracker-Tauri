import Plugin from '@d-najd/universal-media-tracker-sdk/dist/index'
import PluginSpec from '@d-najd/universal-media-tracker-sdk/dist/types/pluginSpec'

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
