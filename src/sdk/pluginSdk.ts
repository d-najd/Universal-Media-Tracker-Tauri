import PluginConfig from '@/sdk/types/pluginConfig'
import CatalogHandlerArgs from '@/sdk/types/catalog/catalogHandlerArgs'
import CatalogHandlerResponse from '@/sdk/types/catalog/catalogHandlerResponse'
import PluginSpec from '@/sdk/types/pluginSpec'

export type Handler = (args: unknown) => Promise<unknown>

export default class Plugin {
	private readonly config: PluginConfig
	private handlers = new Map<string, Handler>()

	constructor(options: PluginConfig) {
		this.config = options
	}

	onLoad() {}

	onUnload() {}

	defineHandler(handler: (args: unknown) => Promise<unknown>, id: string) {
		this.handlers.set(id, handler)
	}

	defineCatalogHandler(
		handler: (args: CatalogHandlerArgs) => Promise<CatalogHandlerResponse>
	) {
		this.defineHandler(
			handler as Handler,
			`${this.config.id}-catalog-handler}`
		)
	}

	getSpec() {
		const spec: PluginSpec = {
			config: this.config,
			handlers: this.handlers,
			onLoad: this.onLoad,
			onUnload: this.onUnload
		}

		return spec
	}
}
