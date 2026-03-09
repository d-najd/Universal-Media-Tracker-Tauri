import PluginOptions from '@/assets/plugin/pluginOptions'
import CatalogHandlerResponse from '@/assets/plugin/catalogHandlerResponse'
import CatalogHandlerArgs from '@/assets/plugin/catalogHandlerArgs'

type Handler = (args: unknown) => Promise<unknown>

export default class Plugin {
    options: PluginOptions
    private handlers = new Map<string, Handler>

    constructor(options: PluginOptions) {
        this.options = options
    }

    defineCatalogHandler(
        handler: (args: CatalogHandlerArgs) => Promise<CatalogHandlerResponse>
    ) {
        this.handlers.set("catalog", handler as Handler)
    }

    getPluginSpec() {
        return {
            options: this.options,
            handlers: this.handlers
        }
    }
}