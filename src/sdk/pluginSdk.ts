import PluginConfig from '@/sdk/types/pluginConfig'
import CatalogHandlerArgs from '@/sdk/types/catalog/catalogHandlerArgs'
import CatalogHandlerResponse from '@/sdk/types/catalog/catalogHandlerResponse'
import PluginSpec from '@/sdk/types/pluginSpec'
import BaseHandlerTypes from '@/sdk/types/baseHandlerTypes'
import Handler from '@/sdk/types/catalog/Handler'

export default class Plugin {
	private readonly config: PluginConfig

	private handlers = new Map<string, Handler>()
	private counter = 0

	constructor(options: PluginConfig) {
		this.config = options
	}

	onLoad(callback: () => Promise<void>) {
		this.onLoadCallback = callback
	}

	onUnload(callback: () => Promise<void>) {
		this.onUnloadCallback = callback
	}

	/**
	 * @see Handler
	 */
	defineHandler(
		// eslint-disable-next-line
		callback: (args: any) => Promise<any>,
		type: BaseHandlerTypes | string,
		id: string = `${this.config.id}-custom-${this.counter++}`
	): string {
		this.handlers.set(id, {
			id: id,
			type: type,
			callback: callback
		})
		return id
	}

	/**
	 * @see defineHandler
	 */
	defineCatalogHandler(
		callback: (args: CatalogHandlerArgs) => Promise<CatalogHandlerResponse>
	): string {
		const id = `${this.config.id}-catalog-handler}`
		this.defineHandler(callback, 'catalog-request', id)
		return id
	}

	getSpec(): PluginSpec {
		return {
			config: this.config,
			handlers: this.handlers,
			onLoad: this.onLoadCallback,
			onUnload: this.onUnloadCallback
		}
	}

	private onLoadCallback: () => Promise<void> = async () => {}

	private onUnloadCallback: () => Promise<void> = async () => {}
}
