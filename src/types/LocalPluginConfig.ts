import { PluginConfig } from '@d-najd/universal-media-tracker-sdk'

type LocalPluginConfig = PluginConfig & {
	status: 'enabled' | 'disabled'
	url: string
	/**
	 * Id of the handler this was handled with
	 */
	handlerId: string
}

export default LocalPluginConfig
