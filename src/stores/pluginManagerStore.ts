import PluginLoader from '@/lib/plugin/pluginLoader'
import LocalPluginLoader from '@/lib/plugin/localPluginLoader'
import PluginDescriptor from '@/types/pluginDescriptor'
import Plugin from '@/sdk/pluginSdk'
import { LoadedPluginDescriptor } from '@/types/LoadedPluginDescriptor'

export default class PluginManagerStore {
	private static loaders: PluginLoader[]
	private static descriptors: PluginDescriptor[]

	static init() {
		this.registerLoader(new LocalPluginLoader())
	}

	static registerLoader(pluginLoader: PluginLoader) {
		const exists = this.loaders.some(
			(loader) => loader.id === pluginLoader.id
		)
		if (!exists) {
			this.loaders.push(pluginLoader)

			// Want to ensure consistent behaviour
			this.loaders.sort((a, b) => a.id.localeCompare(b.id))
		}
	}

	/**
	 * Will load (or register if already loaded) all the passed plugins
	 * @param pluginDescriptors plugin descriptors to be loaded
	 */
	static async loadPlugins(...pluginDescriptors: PluginDescriptor[]) {
		pluginDescriptors.forEach((descriptor) => {
			if (descriptor.status === "error") {
				console.log(`plugin with uri ${descriptor.uri} has state ${descriptor.status}, reload will be attempted`)
			}

			if (descriptor.spec && descriptor.status !== "error") {
				this.addDescriptorIfNotExists({
					...descriptor,
					spec: descriptor.spec
				})

				return
			}

			this.loaders.forEach(async (loader) => {
				const result = await loader.loadPlugin(descriptor.uri)

				switch (result.status) {
					case 'loaded':
						this.addDescriptorIfNotExists({
							uri: descriptor.uri,
							status: descriptor.status === "error" ? "enabled" : descriptor.status,
							spec: result.plugin.getSpec()
						})

						this.descriptors.push(
							{
								uri: descriptor.uri,
								status: "enabled",
								uri: string
							}
						)
						break
				}
			})
		})

		this.loaders.forEach((o) => {
			o.loadPlugin()
		})

		for (loader in this.loaders) {

		}
	}

	private static addDescriptorIfNotExists(descriptor: LoadedPluginDescriptor) {
		this.descriptors.some(o => o.spec?.config.id === descriptor.spec.config.id)
	}
}