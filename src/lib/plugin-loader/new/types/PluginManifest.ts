type PluginManifest = {
	version: 1
	/** The order at which plugins are loaded, may be changed by the user */
	loadOrder: string[]
	basePluginsInitialized: boolean
}

export default PluginManifest
