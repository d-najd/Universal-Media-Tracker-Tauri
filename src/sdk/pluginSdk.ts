import PluginConfig from '@/sdk/types/pluginConfig'
import CatalogHandlerArgs from '@/sdk/types/catalog/catalogHandlerArgs'
import CatalogHandlerResponse from '@/sdk/types/catalog/catalogHandlerResponse'

export type Handler = (args: unknown) => Promise<unknown>

export default class Plugin {
    private readonly config: PluginConfig
    private handlers = new Map<string, Handler>

    constructor(options: PluginConfig) {
        this.config = options
    }

    defineCatalogHandler(
        handler: (args: CatalogHandlerArgs) => Promise<CatalogHandlerResponse>
    ) {
        this.handlers.set("catalog", handler as Handler)
    }

    getSpec() {
        return {
            config: this.config,
            handlers: this.handlers
        }
    }
}