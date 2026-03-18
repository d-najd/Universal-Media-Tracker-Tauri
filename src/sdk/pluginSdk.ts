import PluginConfig from '@/sdk/types/pluginConfig'
import PluginSpec from '@/sdk/types/pluginSpec'
import Handler from '@/sdk/types/handler/base/handler'
import CreateResourceHandler from '@/sdk/types/handler/media/createResourceHandler'
import CreateCatalogHandler from '@/sdk/types/handler/media/catalog/createCatalogHandler'
import ResourceHandler from '@/sdk/types/handler/media/resourceHandler'

export default class Plugin {
	readonly config: PluginConfig
	private handlers = new Map<string, Handler>()

	private counter = 0
	private loaded = false

	constructor(options: PluginConfig) {
		this.config = options
	}

	/**
	 * Don't define handlers here, they are part of the spec
	 */
	onLoad(callback: () => Promise<void>) {
		this.onLoadCallback = async () => {
			await callback()
			this.loaded = true
		}
	}

	onUnload(callback: () => Promise<void>) {
		this.onUnloadCallback = async () => {
			await callback()
			this.loaded = false
		}
	}

	/*
	defineResourceHandler(
		// eslint-disable-next-line
		callback: (args: any) => Promise<any>,
		name: string,
		type: ResourceHandlerTypes | string,
		id: string = `${this.config.id}-custom-${this.counter++}`
	): string {
		const handler: ResourceHandler = {
			id: id,
			type: type,
			name: name,
			callback: callback
		}

		this.handlers.set(id, handler)
		return id
	}
	 */

	/**
	 * @see Handler
	 */
	defineResourceHandler(handler: CreateResourceHandler): string {
		const newHandler: ResourceHandler = {
			id: `${this.config.id}-custom-${this.counter++}`,
			name: `${this.config.name}`,
			...handler
		}

		this.handlers.set(newHandler.id, newHandler)
		return newHandler.id
	}

	/**
	 * Defines or overrides if a catalog handler has already been defined, if
	 * you use multiple catalog handlers use `defineMediaHandler` instead
	 * @see defineResourceHandler
	 */
	defineCatalogHandler(handler: CreateCatalogHandler): string {
		const newHandler: CreateResourceHandler = {
			id: `${this.config.id}-catalog-handler`,
			...handler,
			type: 'catalog-request'
		}

		return this.defineResourceHandler(newHandler)
	}

	// Used internally, private since its internal api
	// noinspection JSUnusedLocalSymbols
	private getSpec(): PluginSpec {
		if (!this.loaded) {
			throw Error("The plugin must be loaded before getting it's spec")
		}

		return {
			config: this.config,
			handlers: this.handlers,
			onLoad: this.onLoadCallback,
			onUnload: this.onUnloadCallback
		}
	}

	private onLoadCallback: () => Promise<void> = async () => {
		this.loaded = true
	}

	private onUnloadCallback: () => Promise<void> = async () => {
		this.loaded = false
	}
}
