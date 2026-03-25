import PluginConfig from '@d-najd/universal-media-tracker-sdk/dist/types/PluginConfig'

type LocalPluginConfig = PluginConfig & {
	status: 'enabled' | 'disabled'
}

export default LocalPluginConfig
