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
				poster: 'https://images.metahub.space/poster/small/tt0084787/img'
			},
			{
				id: 'tt11',
				type: 'movie',
				name: `Example Movie2: ${searchTerm}`,
				poster: 'https://m.media-amazon.com/images/M/MV5BMTQxMDMxNjMwOV5BMl5BanBnXkFtZTgwNzk1MzI1MTE@._V1_QL75_UX140_CR0,0,140,207_.jpg'
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
