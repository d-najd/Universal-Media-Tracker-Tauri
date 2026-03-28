import { PluginConfig } from '@d-najd/universal-media-tracker-sdk'

type LocalPluginConfig = PluginConfig & {
	status: 'enabled' | 'disabled'
	url: string
	/**
	 * ID of the handler this was handled with
	 */
	handlerId: string
	/**
	 * ID of the plugin that the handler belongs to
	 * Planned to be used with plugin-factory to warn the user if the factory is
	 * removed
	 */
	handlerPluginId: string
	loadedFrom: 'plugin-factory' | 'plugin-source'
}

export default LocalPluginConfig
