import PluginLoader from '@/lib/plugin/pluginLoader'
import LocalPluginLoader from '@/lib/plugin/localPluginLoader'
import PluginDescriptor from '@/types/pluginDescriptor'
import basePlugins from '@/app/plugins/basePlugins'

export default class PluginManagerStore {
	private static loaders: PluginLoader[]
	private static descriptors: PluginDescriptor[]

	static async init() {
		this.registerLoader(new LocalPluginLoader())
		await this.loadBasePlugins()
	}

	static registerLoader(pluginLoader: PluginLoader) {
		const exists = this.loaders.some(
			(loader) => loader.id === pluginLoader.id
		)
		if (!exists) {
			this.loaders.push(pluginLoader)
			// ensure consistent behaviour
			this.loaders.sort((a, b) => a.id.localeCompare(b.id))
		}
	}

	/**
	 * Will load (or register if already loaded) all the passed plugins
	 * @param pluginDescriptors plugin descriptors to be loaded
	 */
	static async loadPlugins(...pluginDescriptors: PluginDescriptor[]) {
		pluginDescriptors.forEach((descriptor) => {
			if (descriptor.status === 'error') {
				console.log(
					`plugin with uri ${descriptor.uri} has state ${descriptor.status}, reload will be attempted`
				)
			}

			if (descriptor.status !== 'error' && descriptor.spec) {
				this.addDescriptorIfNotExists(descriptor)
				return
			}

			this.loaders.forEach(async (loader) => {
				const result = await loader.loadPlugin(descriptor.uri)

				switch (result.status) {
					case 'loaded':
						this.addDescriptorIfNotExists({
							uri: descriptor.uri,
							status:
								descriptor.status === 'error'
									? 'enabled'
									: descriptor.status,
							spec: result.spec
						})
						break
					case 'skip':
						break
					case 'invalid':
						console.error(
							`Loading of plugin with uri ${descriptor.uri} and loader by id ${loader.id} failed with result ${result.reason}`
						)
						break
				}
			})
		})
	}

	private static addDescriptorIfNotExists(descriptor: PluginDescriptor) {
		if (descriptor.status === 'error' || !descriptor.spec) {
			throw Error('Invalid descriptor passed')
		}

		let matches = this.descriptors.some((o) => {
			if (o.status === 'error') {
				return false
			}
			return o.spec?.config.id === descriptor.spec!!.config.id
		})

		if (!matches) {
			this.descriptors.push(descriptor)
			// ensure consistent behaviour
			this.descriptors.sort((a, b) => a.uri.localeCompare(b.uri))
		}
	}

	private static async loadBasePlugins() {
		let descriptors: PluginDescriptor[] = basePlugins.map((o) => ({
			uri: o,
			status: 'enabled'
		}))

		await this.loadPlugins(...descriptors)
	}
}