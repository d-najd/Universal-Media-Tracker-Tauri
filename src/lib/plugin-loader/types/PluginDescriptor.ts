import {
	LocalPluginConfig,
	Plugin,
	PluginSpec,
} from '@d-najd/universal-media-tracker-sdk'

type PluginDescriptor =
	| {
			// readonly url: string
			readonly status: 'enabled'
			readonly plugin: Plugin
			// TODO if this is LocalPluginSpec then it would be much better since I could get rid of the api for getting LocalPluginSpecs!
			readonly spec: PluginSpec
			readonly config: LocalPluginConfig
	  }
	| {
			readonly url: string
			readonly status: 'disabled'
			// readonly pluginId?: string
			// readonly plugin?: Plugin
	  }
	| { readonly url: string; readonly status: 'error' }

export default PluginDescriptor
