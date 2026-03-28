import PluginDescriptor from '@/types/PluginDescriptor'
import basePlugins from '@/app/plugins/basePlugins'
import LocalPluginSource from '@/app/plugins/ts/LocalPluginSource'
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
		for (const descriptor of descriptors) {
			if (descriptor.status === 'enabled') {
				console.log(
					`can't re-enable plugin ${descriptor.spec.config.id}`
				)
				continue
			}

			// TODO this should be recursive, if any plugin failed to load and
			// new handler is registered it should try to load the failed plugins
			// with these handlers, both for source and factory
			await this.loadDescriptorFromPluginSource(
				markForLoading,
				descriptor
			)
		}
	}

	private static async loadDescriptorFromPluginSource(
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
						response,
						handler,
						pluginId
					)
				) {
					return true
				}
			}
		}
		return false
	}

	private static async handlePluginSourceResponse(
		markForLoading: boolean,
		descriptor: Extract<PluginDescriptor, { status: 'disabled' | 'error' }>,
		response: PluginSourceHandlerResponse,
		handler: Handler<PluginSourceHandlerArgs, PluginSourceHandlerResponse>,
		pluginId: string
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
					handlerPluginId: pluginId
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
				await storage.list('')

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

	/**
	 * load's locally saved plugins with the flag status enabled
	 */
	static async loadPlugins() {
		// await this.registerPlugins(false, ...descriptors)
		const storage = await getStorage()
		const pluginFolders = await storage.list(pluginPath)

		for (const folder of pluginFolders) {
			if (this.plugins.get(folder.name)?.status === 'enabled') continue

			if (folder.type === 'file') {
				throw Error('File found in plugin folder root????')
			}

			const jsonStr = await storage.read(
				folder.path + '/' + pluginConfigName
			)
			const config = JSON.parse(jsonStr) as LocalPluginConfig

			if (config.status === 'disabled') continue

			const codeStr = await storage.read(
				folder.path + '/' + pluginFileName
			)
			const plugin = await this.loadPluginFromCode(codeStr)
			const spec = (await (plugin! as any).getSpec()) as PluginSpec

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
