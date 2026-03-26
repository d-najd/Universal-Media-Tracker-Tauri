import PluginParser from '@/lib/plugin/PluginSpecParser'
import LocalPluginParser from '@/lib/plugin/LocalPluginParser'
import PluginDescriptor from '@/types/PluginDescriptor'
import basePlugins from '@/app/plugins/basePlugins'
import LocalPluginSource from '@/app/plugins/LocalPluginSource'
import HandlerStore from '@/stores/HandlerStore'
import { getStorage } from '@/lib/storage'
import {
	pluginConfigName,
	pluginFileName,
	pluginPath
} from '@/lib/storage/StoragePaths'
import LocalPluginConfig from '@/types/LocalPluginConfig'
import {
	Handler,
	Plugin,
	PluginSourceHandlerArgs,
	PluginSourceHandlerResponse,
	PluginSpec
} from '@d-najd/universal-media-tracker-sdk'

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
					`plugin with uri ${descriptor.url} has state ${descriptor.status}, re-register will be attempted`
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
					url: descriptor.url
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
							status: markForLoading ? 'enabled' : 'disabled',
							url: descriptor.url,
							handlerId: handler.id
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
							url: descriptor.url,
							status: 'disabled'
						}
						this.plugins.set(config.id, newDescriptor)
						break
					}
					case 'skip':
						break
					case 'invalid':
						console.error(
							`Registering of plugin with uri ${descriptor.url} and parser by id ${handler.id} failed with result ${result.reason}`
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

	private static async loadBasePlugins() {
		const descriptors: PluginDescriptor[] = basePlugins.map((o) => ({
			url: o,
			status: 'disabled'
		}))

		await this.loadLocalPluginSource()
		await this.registerPlugins(true, ...descriptors)
		await this.loadPlugins()
		// await this.loadPluginsOld(...descriptors)
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
