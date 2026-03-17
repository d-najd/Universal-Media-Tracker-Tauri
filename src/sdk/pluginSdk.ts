import PluginConfig from '@/sdk/types/pluginConfig'
import CatalogHandlerArgs from '@/sdk/types/handler/media/catalog/catalogHandlerArgs'
import CatalogHandlerResponse from '@/sdk/types/handler/media/catalog/catalogHandlerResponse'
import PluginSpec from '@/sdk/types/pluginSpec'
import MediaHandlerTypes from '@/sdk/types/handler/media/mediaHandlerTypes'
import Handler from '@/sdk/types/handler/base/handler'
import MediaHandler from '@/sdk/types/handler/media/mediaHandler'

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

	/**
	 * @see Handler
	 */
	defineMediaHandler(
		// eslint-disable-next-line
		callback: (args: any) => Promise<any>,
		name: string,
		type: MediaHandlerTypes | string,
		id: string = `${this.config.id}-custom-${this.counter++}`
	): string {
		const handler: MediaHandler = {
			id: id,
			type: type,
			name: name,
			callback: callback
		}

		this.handlers.set(id, handler)
		return id
	}

	/**
	 * Defines or overrides if a catalog handler has already been defined, if
	 * you use multiple catalog handlers use `defineMediaHandler` instead
	 * @see defineMediaHandler
	 */
	defineCatalogHandler(
		callback: (args: CatalogHandlerArgs) => Promise<CatalogHandlerResponse>,
		name: string = this.config.name
	): string {
		const id = `${this.config.id}-catalog-handler`
		this.defineMediaHandler(callback, name, 'catalog-request', id)
		return id
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
