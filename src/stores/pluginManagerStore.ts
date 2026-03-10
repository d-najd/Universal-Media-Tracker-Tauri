import PluginSpecLoader from '@/lib/plugin/pluginSpecLoader'
import LocalPluginSpecLoader from '@/lib/plugin/localPluginSpecLoader'
import PluginDescriptor from '@/types/pluginDescriptor'
import basePlugins from '@/app/plugins/basePlugins'
import PluginSpec from '@/sdk/types/pluginSpec'

export default class PluginManagerStore {
	private static loaders: PluginSpecLoader[] = []
	private static descriptors: PluginDescriptor[] = []
	private static initialized = false

	static async init() {
		if (this.initialized) {
			return
		}
		this.initialized = true

		this.registerLoader(new LocalPluginSpecLoader())
		await this.loadBasePlugins()
	}

	static getDescriptors(): PluginDescriptor[] {
		return this.descriptors
	}

	static getLoadedPluginSpecs(): PluginSpec[] {
		return this.descriptors
			.filter((o) => o.status === 'enabled')
			.map((o) => o.spec)
	}

	static registerLoader(pluginLoader: PluginSpecLoader) {
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
	 * Registers plugins, their state will be set to disabled or error once registered
	 */
	static async registerPlugins(...pluginDescriptors: PluginDescriptor[]) {
		pluginDescriptors.forEach((descriptor) => {
			if (descriptor.status === 'error') {
				console.log(
					`plugin with uri ${descriptor.uri} has state ${descriptor.status}, reload will be attempted`
				)
			}

			/* Forcing reload seems smarter
			if (descriptor.status !== 'error' && descriptor.spec) {
				this.addDescriptorIfNotExists({
					uri: descriptor.uri,
					status: "disabled",
					spec: descriptor.spec
				})
				return
			}
			 */

			let pluginSpecLoaded = false
			this.loaders.forEach(async (loader) => {
				if (pluginSpecLoaded) return
				const result = await loader.loadPluginSpec(descriptor.uri)

				switch (result.status) {
					case 'loaded':
						this.addDescriptorIfNotExists({
							uri: descriptor.uri,
							status: 'disabled',
							spec: result.spec
						})
						pluginSpecLoaded = true
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

	/**
	 * Will load (or register as well if not already) all the passed plugins
	 * @param pluginDescriptors plugin descriptors to be loaded
	 */
	static async loadPlugins(...pluginDescriptors: PluginDescriptor[]) {
		pluginDescriptors.forEach((descriptor) => {
			if (
				!this.descriptors.some((o) =>
					this.descriptorsEqual(o, descriptor)
				)
			) {
				this.registerPlugins(descriptor)

				if (
					!this.descriptors.some((o) =>
						this.descriptorsEqual(o, descriptor)
					)
				) {
					console.error(
						`Can't register plugin with uri ${descriptor.uri}, loading will be skipped`
					)
					return
				}
			}
		})

		pluginDescriptors
			.filter((o) =>
				this.descriptors.some((t) => this.descriptorsEqual(o, t))
			)
			.forEach((descriptor) => {
				if (descriptor.status === 'error') {
					console.error(
						`Errored out plugin with uri ${descriptor.uri} will be skipped from loading`
					)
					return
				}

				if (descriptor.status === 'enabled') {
					console.log(
						`plugin with uri ${descriptor.uri} and id ${descriptor.spec.config.id} and name ${descriptor.spec.config.name} already enabled`
					)
					return
				}

				if (!descriptor.spec) {
					throw Error(
						'Plugin which has not been registered is trying to be loaded????'
					)
				}

				try {
					descriptor.spec.onLoad()
				} catch (e: unknown) {
					console.error(
						`Failed to load plugin with uri ${descriptor.uri} id ${descriptor.spec.config.id} and name ${descriptor.spec.config.name}, ${e}`
					)
					return
				}

				this.descriptors = this.descriptors
					.filter((o) => {
						if (this.descriptorsEqual(o, descriptor)) {
							return {
								uri: descriptor.uri,
								status: 'enabled',
								spec: descriptor.spec
							}
						}
						return o
					})
					.sort((a, b) => a.uri.localeCompare(b.uri))
			})
	}

	private static addDescriptorIfNotExists(descriptor: PluginDescriptor) {
		if (descriptor.status === 'error' || !descriptor.spec) {
			throw Error('Invalid descriptor passed')
		}

		this.descriptors.forEach((o) => {
			if (o.status === 'error') {
				return
			}

			// TODO there should be another check here, a descriptors uri can be the same but it's id (or version)
			// different if the plugin developer changed the plugin in some way, in that case the user should be prompted
			if (this.descriptorsEqual(o, descriptor)) {
				return
			}

			this.descriptors.push(descriptor)
		})

		// Ensure consistent behaviour
		this.descriptors.sort((a, b) => a.uri.localeCompare(b.uri))
	}

	private static descriptorsEqual(a: PluginDescriptor, b: PluginDescriptor) {
		if (a.uri === b.uri) return true
		if (a.status === 'error' || b.status === 'error') return false
		if (!a.spec || !b.spec) return false
		return a.spec.config.id === b.spec.config.id
	}

	private static async loadBasePlugins() {
		const descriptors: PluginDescriptor[] = basePlugins.map((o) => ({
			uri: o,
			status: 'disabled'
		}))

		await this.loadPlugins(...descriptors)
	}
}
