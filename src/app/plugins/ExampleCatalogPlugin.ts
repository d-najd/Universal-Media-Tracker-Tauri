import PluginConfig from '@d-najd/universal-media-tracker-sdk/dist/types/PluginConfig'
import MetaPreview from '@d-najd/universal-media-tracker-sdk/dist/types/handler/media/catalog/MetaPreview'
import Plugin from '@d-najd/universal-media-tracker-sdk/dist/Plugin'
import CatalogHandlerResponse from '@d-najd/universal-media-tracker-sdk/dist/types/handler/media/catalog/CatalogHandlerResponse'

const options: PluginConfig = {
	id: 'example-plugin',
	name: 'Example Plugin',
	version: '0.0.1'
}

const metas: MetaPreview[] = [
	{
		id: 'tt1234567',
		type: 'movie',
		name: `Example Movie:`,
		poster: 'https://images.metahub.space/poster/small/tt0084787/img'
	},
	{
		id: 'tt11',
		type: 'movie',
		name: `Example Movie2:`,
		poster: 'https://m.media-amazon.com/images/M/MV5BMTQxMDMxNjMwOV5BMl5BanBnXkFtZTgwNzk1MzI1MTE@._V1_QL75_UX140_CR0,0,140,207_.jpg'
	},
	{
		id: 'tt11',
		type: 'movie',
		name: `Example Movie2:`,
		poster: 'https://example.com/poster.jpg'
	}
]

const plugin = new Plugin(options)

plugin.defineCatalogHandler({
	async callback(): Promise<CatalogHandlerResponse> {
		return { data: metas }
	},
	resourceType: 'movie'
})

export default plugin
