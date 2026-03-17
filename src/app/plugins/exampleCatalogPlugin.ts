import Plugin from '@/sdk/pluginSdk'
import CatalogHandlerResponse from '@/sdk/types/catalog/catalogHandlerResponse'
import CatalogHandlerArgs from '@/sdk/types/catalog/catalogHandlerArgs'
import MetaPreview from '@/sdk/types/catalog/metaPreview'
import PluginConfig from '@/sdk/types/pluginConfig'

const options: PluginConfig = {
	id: 'example-plugin',
	name: 'Example Plugin',
	version: '0.0.1'
}

const plugin = new Plugin(options)

plugin.defineCatalogHandler(
	async (args: CatalogHandlerArgs): Promise<CatalogHandlerResponse> => {
		const searchTerm = args.search ?? ''

		const metas: MetaPreview[] = [
			{
				id: 'tt1234567',
				type: 'movie',
				name: `Example Movie: ${searchTerm}`,
				poster: 'https://example.com/poster.jpg'
			},
			{
				id: 'tt11',
				type: 'movie',
				name: `Example Movie2: ${searchTerm}`,
				poster: 'https://example.com/poster.jpg'
			}
		]

		return { data: metas }
	}
)

export default plugin
