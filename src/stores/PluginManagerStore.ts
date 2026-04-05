import PluginDescriptor from '@/types/PluginDescriptor'
import basePlugins from '@/app/plugins/basePlugins'
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
	PluginFactoryHandlerArgs,
	PluginFactoryHandlerResponse,
	PluginSourceHandlerArgs,
	PluginSourceHandlerResponse,
	PluginSpec
} from '@d-najd/universal-media-tracker-sdk'
import DirEntry from '@/lib/storage/DirEntry'
import LocalPluginSource from '@/app/plugins/LocalPluginSource'

/**
 * Class for storing and managing plugins, the way that plugins, their descriptors
 * and everything is supposed to be loaded is: either first from the sort order
 * and stop if needed or don't
 */
export default class PluginManagerStore {
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
		await this.loadBasePlugins()
	}

	/**
	 * @param markForLoading if true when loadPluginFromCode is called it will load this,
	 * plugin since it will be marked as "load"
	 * @param descriptors
	 */
	static async registerPlugins(
		markForLoading = true,
		...descriptors: PluginDescriptor[]
	) {
		const descriptorsFailedLoading: PluginDescriptor[] = []
		for (const descriptor of descriptors) {
			if (descriptor.status === 'enabled') {
				console.log(
					`can't re-enable plugin ${descriptor.spec.config.id}`
				)
				// edge case
				descriptorsFailedLoading.push(descriptor)
				continue
			}

			if (
				await this.registerDescriptorFromPluginSource(
					markForLoading,
					descriptor
				)
			) {
				if (markForLoading) await this.loadPlugins()
				continue
			}

			if (
				await this.registerDescriptorFromPluginFactory(
					markForLoading,
					descriptor
				)
			) {
				if (markForLoading) await this.loadPlugins()
				continue
			}

			descriptorsFailedLoading.push(descriptor)
		}

		// Recursively try to load plugins if atleast one plugin more managed to load
		if (descriptorsFailedLoading.length !== descriptors.length) {
			await this.registerPlugins(
				markForLoading,
				...descriptorsFailedLoading
			)
		}
	}

	/**
	 * load's locally saved plugins with the flag status enabled
	 */
	static async loadPlugins() {
		const storage = await getStorage()
		const pluginFolders = await storage.list(pluginPath)
		const pluginFactoryConfigs: LocalPluginConfig[] = []

		for (const folder of pluginFolders) {
			if (this.plugins.get(folder.name)?.status === 'enabled') continue

			if (folder.type === 'file') {
				console.error('File found in plugin folder root????')
				continue
			}

			const jsonStr = await storage.read(
				folder.path + '/' + pluginConfigName
			)
			const config = JSON.parse(jsonStr) as LocalPluginConfig
			if (config.status === 'disabled') continue

			switch (config.loadedFrom) {
				case 'plugin-source': {
					await this.loadPluginUsingPluginSource(folder, config)
					break
				}
				case 'plugin-factory': {
					pluginFactoryConfigs.push(config)
					break
				}
				default:
					throw Error('Unhandled')
			}
		}

		await this.loadPluginsUsingPluginFactoryRecursive(pluginFactoryConfigs)
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

	private static async registerDescriptorFromPluginSource(
		markForLoading: boolean,
		descriptor: Extract<PluginDescriptor, { status: 'disabled' | 'error' }>
	): Promise<boolean> {
		const pluginSourceHandlers =
			HandlerStore.getHandlersMatchingWithPluginId(
				([, handler]) => handler.type === 'plugin-source'
			) as Map<
				string,
				Handler<PluginSourceHandlerArgs, PluginSourceHandlerResponse>[]
			>

		for (const [pluginId, handlers] of pluginSourceHandlers.entries()) {
			for (const handler of handlers) {
				const args: PluginSourceHandlerArgs = {
					url: descriptor.url
				}
				const response = await handler.callback(args)

				if (
					await this.handlePluginSourceResponse(
						markForLoading,
						descriptor,
						pluginId,
						response,
						handler
					)
				) {
					return true
				}
			}
		}
		return false
	}

	private static async registerDescriptorFromPluginFactory(
		markForLoading: boolean,
		descriptor: Extract<PluginDescriptor, { status: 'disabled' | 'error' }>
	): Promise<boolean> {
		const pluginFactoryHandlers =
			HandlerStore.getHandlersMatchingWithPluginId(
				([, handler]) => handler.type === 'plugin-factory'
			) as Map<
				string,
				Handler<
					PluginFactoryHandlerArgs,
					PluginFactoryHandlerResponse
				>[]
			>

		for (const [pluginId, handlers] of pluginFactoryHandlers.entries()) {
			for (const handler of handlers) {
				const args: PluginFactoryHandlerArgs = {
					url: descriptor.url
				}
				const response = await handler.callback(args)

				if (
					await this.handlePluginFactoryResponse(
						markForLoading,
						descriptor,
						pluginId,
						response,
						handler
					)
				) {
					return true
				}
			}
		}
		return false
	}

	private static async handlePluginFactoryResponse(
		markForLoading: boolean,
		descriptor: Extract<PluginDescriptor, { status: 'disabled' | 'error' }>,
		pluginId: string,
		response: PluginFactoryHandlerResponse,
		handler: Handler<PluginFactoryHandlerArgs, PluginFactoryHandlerResponse>
	): Promise<boolean> {
		switch (response.status) {
			case 'valid': {
				const plugin = response.plugin
				const spec = (await (plugin! as any).getSpec()) as PluginSpec
				const config = plugin.config
				await spec.onUnload()

				const localConfig: LocalPluginConfig = {
					...config,
					status: markForLoading ? 'enabled' : 'disabled',
					url: descriptor.url,
					handlerId: handler.id,
					handlerPluginId: pluginId,
					loadedFrom: 'plugin-factory'
				}

				const storage = await getStorage()
				const curPluginPath = pluginPath + '/' + spec.config.id
				await storage.write(
					curPluginPath + '/' + pluginConfigName,
					JSON.stringify(localConfig)
				)

				const newDescriptor: PluginDescriptor = {
					url: descriptor.url,
					status: 'disabled'
				}
				this.plugins.set(config.id, newDescriptor)
				return true
			}
			case 'skip':
				return false
			case 'invalid':
				console.error(
					`Registering of plugin with uri ${descriptor.url} and handler by id ${handler.id} failed with result ${response.reason}`
				)
				return false
		}
	}

	private static async handlePluginSourceResponse(
		markForLoading: boolean,
		descriptor: Extract<PluginDescriptor, { status: 'disabled' | 'error' }>,
		pluginId: string,
		response: PluginSourceHandlerResponse,
		handler: Handler<PluginSourceHandlerArgs, PluginSourceHandlerResponse>
	): Promise<boolean> {
		switch (response.status) {
			case 'valid': {
				// Validate plugin
				const plugin = await this.loadPluginFromCode(response.code)
				const spec = (await (plugin! as any).getSpec()) as PluginSpec
				const config = plugin.config
				await spec.onUnload()

				// Store plugin
				const localConfig: LocalPluginConfig = {
					...config,
					status: markForLoading ? 'enabled' : 'disabled',
					url: descriptor.url,
					handlerId: handler.id,
					handlerPluginId: pluginId,
					loadedFrom: 'plugin-source'
				}
				const storage = await getStorage()
				const curPluginPath = pluginPath + '/' + spec.config.id
				await storage.write(
					curPluginPath + '/' + pluginFileName,
					response.code
				)
				await storage.write(
					curPluginPath + '/' + pluginConfigName,
					JSON.stringify(localConfig)
				)

				const newDescriptor: PluginDescriptor = {
					url: descriptor.url,
					status: 'disabled'
				}
				this.plugins.set(config.id, newDescriptor)
				return true
			}
			case 'skip':
				return false
			case 'invalid':
				console.error(
					`Registering of plugin with uri ${descriptor.url} and handler by id ${handler.id} failed with result ${response.reason}`
				)
				return false
		}
	}

	private static async loadPluginUsingPluginSource(
		folder: DirEntry,
		config: LocalPluginConfig
	) {
		const storage = await getStorage()
		const codeStr = await storage.read(folder.path + '/' + pluginFileName)
		const plugin = await this.loadPluginFromCode(codeStr)
		const spec = (await (plugin! as any).getSpec()) as PluginSpec

		const descriptor: PluginDescriptor = {
			status: 'enabled',
			plugin: plugin,
			spec: spec
		}
		this.plugins.set(config.id, descriptor)
	}

	private static async loadPluginsUsingPluginFactoryRecursive(
		pluginConfigs: LocalPluginConfig[]
	) {
		const failedToLoadPluginConfigs: LocalPluginConfig[] = []
		for (const config of pluginConfigs) {
			const handlers = HandlerStore.getHandlersMatching(
				(o) => o.id === config.handlerId
			)
			if (handlers.length === 0) {
				// Can't find handler now, maybe next recursion when more factories load?
				failedToLoadPluginConfigs.push(config)
				continue
			}

			const handler = handlers[0]
			if (handler.type !== 'plugin-factory') {
				throw Error(`Handler ${handler.id} is not a factory?`)
			}
			const callback = (
				handler as Handler<
					PluginFactoryHandlerArgs,
					PluginFactoryHandlerResponse
				>
			).callback

			const args: PluginFactoryHandlerArgs = {
				url: config.url
			}
			const response = await callback(args)
			if (response.status !== 'valid') {
				throw Error(
					`Handler ${handler.id} that was used to load plugin ${config.id} failed now?`
				)
			}
			const plugin = response.plugin
			const spec = (await (plugin! as any).getSpec()) as PluginSpec

			const descriptor: PluginDescriptor = {
				status: 'enabled',
				plugin: plugin,
				spec: spec
			}
			this.plugins.set(config.id, descriptor)
		}

		if (pluginConfigs.length === 0) {
			return
		} else if (failedToLoadPluginConfigs.length === pluginConfigs.length) {
			console.error(
				`Failed to load plugins: ${pluginConfigs.length} using factory`
			)
			console.error(pluginConfigs)
		} else {
			await this.loadPluginsUsingPluginFactoryRecursive(
				failedToLoadPluginConfigs
			)
		}
	}

	private static async loadBasePlugins() {
		const descriptors: PluginDescriptor[] = basePlugins.map((o) => ({
			url: o,
			status: 'disabled'
		}))

		// stremio addon testing
		descriptors.push({
			url: 'https://anime-kitsu.strem.fun/manifest.json',
			status: 'disabled'
		})

		await this.loadLocalPluginSource()
		await this.registerPlugins(true, ...descriptors)
		await this.loadPlugins()
	}

	private static async loadLocalPluginSource() {
		try {
			const plugin = LocalPluginSource
			const spec = (await (plugin as any).getSpec()) as PluginSpec
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

	private static async loadPluginFromCode(code: string): Promise<Plugin> {
		const blob = new Blob([code], {
			type: 'text/javascript'
		})
		const url = URL.createObjectURL(blob)
		const module = await import(/* @vite-ignore */ url)
		URL.revokeObjectURL(url)
		return module.default
	}
}
