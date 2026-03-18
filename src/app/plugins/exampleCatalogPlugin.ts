import Plugin from '@/sdk/pluginSdk'
import CatalogHandlerResponse from '@/sdk/types/handler/media/catalog/catalogHandlerResponse'
import CatalogHandlerArgs from '@/sdk/types/handler/media/catalog/catalogHandlerArgs'
import MetaPreview from '@/sdk/types/handler/media/catalog/metaPreview'
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
				poster: 'htsstps://images.bauerhosting.com/legacy/empire-images/features/59e8d795405a5c6805947751/43%20The%20Thing.jpg?auto=format&w=992&q=80'
			},
			{
				id: 'tt11',
				type: 'movie',
				name: `Example Movie2: ${searchTerm}`,
				poster: 'https://example.com/poster.jpg'
			},
			{
				id: 'tt11',
				type: 'movie',
				name: `Example Movie2: ${searchTerm}`,
				poster: 'https://example.com/poster.jpg'
			},
			{
				id: 'tt11',
				type: 'movie',
				name: `Example Movie2: ${searchTerm}`,
				poster: 'https://example.com/poster.jpg'
			},
			{
				id: 'tt11',
				type: 'movie',
				name: `Example Movie2: ${searchTerm}`,
				poster: 'https://example.com/poster.jpg'
			},
			{
				id: 'tt11',
				type: 'movie',
				name: `Example Movie2: ${searchTerm}`,
				poster: 'https://example.com/poster.jpg'
			},
			{
				id: 'tt11',
				type: 'movie',
				name: `Example Movie2: ${searchTerm}`,
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
