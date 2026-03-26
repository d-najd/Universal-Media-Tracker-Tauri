import Plugin from '@d-najd/universal-media-tracker-sdk/Plugin'
import PluginSpec from '@d-najd/universal-media-tracker-sdk/types/PluginSpec'

type PluginDescriptor =
	| {
			// readonly uri: string
			readonly status: 'enabled'
			readonly plugin: Plugin
			readonly spec: PluginSpec
	  }
	| {
			readonly url: string
			readonly status: 'disabled'
			readonly pluginId?: string
			// readonly plugin?: Plugin
	  }
	| { readonly url: string; readonly status: 'error' }

export default PluginDescriptor
