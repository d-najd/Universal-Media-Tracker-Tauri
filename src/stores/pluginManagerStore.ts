import PluginParser from '@/lib/plugin/pluginSpecParser'
import LocalPluginParser from '@/lib/plugin/localPluginParser'
import PluginDescriptor from '@/types/pluginDescriptor'
import basePlugins from '@/app/plugins/basePlugins'
import PluginSpec from '@d-najd/universal-media-tracker-sdk/dist/types/pluginSpec'
import localPluginSource from '@/app/plugins/localPluginSource'

/**
 * Class for storing and managing plugins, the way that plugins, their descriptors
 * and everything is supposed to be loaded is: either first from the sort order
 * and stop if needed or don't
 */
export default class PluginManagerStore {
	/**
	 * key is (PluginSpecParser.id)
	 */
	private static parsers: Map<string, PluginParser> = new Map<
		string,
		PluginParser
	>()
	// TODO this could use some refactoring, maybe use map with uri and another map for loaded specs?
	private static descriptors: PluginDescriptor[] = []
	private static initialized = false

	static async init() {
		if (this.initialized) {
			return
		}
		this.initialized = true

		this.registerParser(new LocalPluginParser())
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

	static registerParser(pluginParser: PluginParser) {
		this.parsers.set(pluginParser.id, pluginParser)
		// ensure consistent behaviour
		// this.parsers = new Map(
		// 	[...this.parsers].sort((a, b) => a[0].localeCompare(b[0]))
		// )
	}

	/**
	 * Registers plugins, their state will be set to disabled or error once registered
	 */
	static async registerPlugins(...pluginDescriptors: PluginDescriptor[]) {
		for (const descriptor of pluginDescriptors) {
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
			for (const [_key, parser] of this.parsers) {
				if (pluginSpecLoaded) return
				await (localPluginSource as any).onLoadCallback()
				const spec = (localPluginSource as any).getSpec() as PluginSpec
				const handlerr = [...spec.handlers.values()].flat()[0]
				const result1 = await handlerr.callback({ uri: descriptor.uri })

				const result = await parser.loadPlugin(descriptor.uri)

				switch (result.status) {
					case 'validOld':
						this.addDescriptorIfNotExists({
							uri: descriptor.uri,
							status: 'disabled',
							plugin: result.plugin
						})
						pluginSpecLoaded = true
						break
					case 'skip':
						break
					case 'invalid':
						console.error(
							`Loading of plugin with uri ${descriptor.uri} and parser by id ${parser.id} failed with result ${result.reason}`
						)
						break
				}
			}
		}
	}

	/**
	 * Will load (or register as well if not already) all the passed plugins
	 * @param pluginDescriptors plugin descriptors to be loaded
	 */
	static async loadPlugins(...pluginDescriptors: PluginDescriptor[]) {
		for (const descriptor of pluginDescriptors) {
			if (
				!this.descriptors.some((o) =>
					this.descriptorsEqual(o, descriptor)
				)
			) {
				await this.registerPlugins(descriptor)

				if (
					!this.descriptors.some((o) =>
						this.descriptorsEqual(o, descriptor)
					)
				) {
					console.error(
						`Can't register plugin with uri ${descriptor.uri}, loading will be skipped`
					)
				}
			}
		}

		for (const descriptor of this.descriptors.filter((o) =>
			pluginDescriptors.some((t) => this.descriptorsEqual(o, t))
		)) {
			if (descriptor.status === 'error') {
				console.error(
					`Errored out plugin with uri ${descriptor.uri} will be skipped from loading`
				)
				continue
			}

			if (descriptor.status === 'enabled') {
				console.log(
					`plugin with uri ${descriptor.uri} and id ${descriptor.spec.config.id} and name ${descriptor.spec.config.name} already enabled`
				)
				continue
			}

			if (!descriptor.plugin) {
				throw Error(
					'Plugin which has not been registered is trying to be loaded????'
				)
			}

			try {
				// eslint-disable-next-line
				await (descriptor.plugin as any).onLoadCallback()
			} catch (e: unknown) {
				console.error(
					`Failed to load plugin with uri ${descriptor.uri} id ${descriptor.plugin.config.id} and name ${descriptor.plugin.config.name}, ${e}`
				)
				continue
			}

			this.descriptors = this.descriptors.map((o) => {
				if (this.descriptorsEqual(o, descriptor)) {
					const descriptorResult: PluginDescriptor = {
						uri: descriptor.uri,
						status: 'enabled',
						// eslint-disable-next-line
						spec: (descriptor.plugin! as any).getSpec(),
						plugin: descriptor.plugin!
					}
					return descriptorResult
				}
				return o
			})
		}
	}

	private static addDescriptorIfNotExists(descriptor: PluginDescriptor) {
		if (descriptor.status === 'error' || !descriptor.plugin) {
			throw Error('Invalid descriptor passed')
		}

		// Stupid edge case
		if (this.descriptors.length === 0) {
			this.descriptors.push(descriptor)
			return
		}

		for (const o of this.descriptors) {
			if (o.status === 'error') {
				return
			}

			// TODO there should be another check here, a descriptors uri can be the same but it's id (or version)
			// different if the plugin developer changed the plugin in some way, in that case the user should be prompted
			if (this.descriptorsEqual(o, descriptor)) {
				return
			}

			this.descriptors.push(descriptor)
		}

		// Ensure consistent behaviour
		this.descriptors.sort((a, b) => a.uri.localeCompare(b.uri))
	}

	private static descriptorsEqual(a: PluginDescriptor, b: PluginDescriptor) {
		if (a.uri === b.uri) return true
		if (a.status === 'error' || b.status === 'error') return false
		if (!a.plugin || !b.plugin) return false
		return a.plugin.config.id === b.plugin.config.id
	}

	private static async loadBasePlugins() {
		const descriptors: PluginDescriptor[] = basePlugins.map((o) => ({
			uri: o,
			status: 'disabled'
		}))

		await this.loadPlugins(...descriptors)
	}
}
