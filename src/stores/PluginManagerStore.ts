import PluginParser from '@/lib/plugin/PluginSpecParser'
import LocalPluginParser from '@/lib/plugin/LocalPluginParser'
import PluginDescriptor from '@/types/PluginDescriptor'
import basePlugins from '@/app/plugins/basePlugins'
import PluginSpec from '@d-najd/universal-media-tracker-sdk/dist/types/PluginSpec'
import LocalPluginSource from '@/app/plugins/LocalPluginSource'
import HandlerStore from '@/stores/HandlerStore'
import PluginSourceHandlerArgs from '@d-najd/universal-media-tracker-sdk/dist/types/handler/plugin/source/PluginSourceHandlerArgs'
import PluginSourceHandlerResponse from '@d-najd/universal-media-tracker-sdk/dist/types/handler/plugin/source/PluginSourceHandlerResponse'
import Handler from '@d-najd/universal-media-tracker-sdk/dist/types/handler/base/Handler'
import Plugin from '@d-najd/universal-media-tracker-sdk/dist/Plugin'
import { getStorage } from '@/lib/storage'
import {
	pluginConfigName,
	pluginFileName,
	pluginPath
} from '@/lib/storage/StoragePaths'
import LocalPluginConfig from '@/types/LocalPluginConfig'

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
	/**
	 * Key is the plugin id
	 */
	private static plugins: Map<string, PluginDescriptor> = new Map<
		string,
		PluginDescriptor
	>()
	private static initialized = false

	static async init() {
		if (this.initialized) {
			return
		}
		this.initialized = true

		this.registerParser(new LocalPluginParser())
		await this.loadBasePlugins()
	}

	static getLoadedPluginSpecs(): PluginSpec[] {
		const result: PluginSpec[] = []

		for (const entry of this.plugins.values()) {
			if (entry.status !== 'enabled') {
				continue
			}

			result.push(entry.spec)
		}

		return result
	}

	static getDescriptors(): PluginDescriptor[] {
		return this.descriptors
	}

	static getLoadedPluginSpecsOld(): PluginSpec[] {
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
	static async registerPluginsOld(...pluginDescriptors: PluginDescriptor[]) {
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
			for (const [, parser] of this.parsers) {
				if (pluginSpecLoaded) return
				/*
				await localPluginSource.onLoad()
				const spec = (localPluginSource as any).getSpec() as PluginSpec
				const handlerr = [...spec.handlers.values()].flat()[0]
				const result1 = await handlerr.callback({ uri: descriptor.uri })
				 */

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
	 * @param markForLoading if true when loadPlugin is called it will load this,
	 * plugin since it will be marked as "load"
	 * @param descriptors
	 */
	static async registerPlugins(
		markForLoading = true,
		...descriptors: PluginDescriptor[]
	) {
		for (const descriptor of descriptors) {
			if (descriptor.status === 'error') {
				console.log(
					`plugin with uri ${descriptor.uri} has state ${descriptor.status}, re-register will be attempted`
				)
			}

			if (descriptor.status === 'enabled') {
				console.log(
					`can't re-enable plugin ${descriptor.spec.config.id}`
				)
				continue
			}

			// TODO this should be recursive, if any plugin failed to load and
			// new handler is registered it should try to load the failed plugins
			// with these handlers, both for source and factory
			const pluginSourceHandlers = HandlerStore.getHandlersMatching(
				([, handler]) => handler.type === 'plugin-source'
			) as Handler<PluginSourceHandlerArgs, PluginSourceHandlerResponse>[]

			let pluginSpecLoaded = false
			for (const handler of pluginSourceHandlers) {
				if (pluginSpecLoaded) return

				const args: PluginSourceHandlerArgs = {
					uri: descriptor.uri
				}

				const result = await handler.callback(args)
				switch (result.status) {
					case 'valid': {
						pluginSpecLoaded = true

						// Validate plugin
						const module = await import(
							/* @vite-ignore */
							`data:text/javascript,${result.code}`
						)
						const plugin: Plugin = module.default
						await (plugin as any).onLoadCallback()
						const spec = (plugin! as any).getSpec() as PluginSpec
						const config = plugin.config
						await spec.onUnload()

						// Store plugin
						const localConfig: LocalPluginConfig = {
							...config,
							status: markForLoading ? 'enabled' : 'disabled'
						}
						const storage = await getStorage()
						const curPluginPath = pluginPath + spec.config.id
						await storage.write(
							curPluginPath + '/' + pluginFileName,
							result.code
						)
						await storage.write(
							curPluginPath + '/' + pluginConfigName,
							JSON.stringify(localConfig)
						)
						await storage.list('')

						const newDescriptor: PluginDescriptor = {
							uri: descriptor.uri,
							status: 'disabled'
						}
						this.plugins.set(config.id, newDescriptor)
						break
					}
					case 'skip':
						break
					case 'invalid':
						console.error(
							`Registering of plugin with uri ${descriptor.uri} and parser by id ${handler.id} failed with result ${result.reason}`
						)
						break
				}
			}
		}
	}

	/**
	 * load's locally saved plugins with the flag status enabled
	 */
	static async loadPlugins() {
		// await this.registerPlugins(false, ...descriptors)
		const storage = await getStorage()
		const pluginFolders = await storage.list(pluginPath)

		for (const folder of pluginFolders) {
			if (folder.type === 'file') {
				throw Error('File found in plugin folder root????')
			}

			const jsonStr = await storage.read(
				folder.path + '/' + pluginConfigName
			)
			const config = JSON.parse(jsonStr) as LocalPluginConfig
			if (config.status === 'disabled') {
				continue
			}

			const codeStr = await storage.read(
				folder.path + '/' + pluginFileName
			)
			const module = await import(
				/* @vite-ignore */
				`data:text/javascript,${codeStr}`
			)
			const plugin: Plugin = module.default
			await (plugin as any).onLoadCallback()
			const spec = (plugin! as any).getSpec() as PluginSpec

			const descriptor: PluginDescriptor = {
				status: 'enabled',
				plugin: plugin,
				spec: spec
			}
			this.plugins.set(config.id, descriptor)
		}
	}

	/**
	 * Will load (or register as well if not already) all the passed plugins
	 * @param pluginDescriptors plugin descriptors to be loaded
	 */
	static async loadPluginsOld(...pluginDescriptors: PluginDescriptor[]) {
		for (const descriptor of pluginDescriptors) {
			if (
				!this.descriptors.some((o) =>
					this.descriptorsEqual(o, descriptor)
				)
			) {
				await this.registerPluginsOld(descriptor)

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

		await this.loadLocalPluginSource()
		await this.loadPluginsOld(...descriptors)
	}

	static async loadLocalPluginSource() {
		try {
			const plugin = LocalPluginSource
			await (plugin as any).onLoadCallback()
			const spec = (plugin as any).getSpec() as PluginSpec
			const descriptor: PluginDescriptor = {
				// uri: localPluginSourceRelativePath,
				status: 'enabled',
				plugin: plugin,
				spec: spec
			}

			this.plugins.set(spec.config.id, descriptor)
		} catch (e) {
			console.error(e)
			throw e
		}
	}
}
