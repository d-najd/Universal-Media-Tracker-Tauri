import {
	Plugin,
	PluginConfig,
	ScreenHandlerResponse
} from '@d-najd/universal-media-tracker-sdk'
import LibraryContent from './features/library'

const options: PluginConfig = {
	id: 'stremio-plugin-factory',
	name: 'Stremio Plugin Factory',
	version: '0.0.1'
}

const plugin = new Plugin(options)

plugin.defineScreenHandler({
	pattern: '/library',
	async callback() // args: ScreenHandlerArgs<ZustandStoreWrapper<LibraryScreenState>>
	: Promise<ScreenHandlerResponse> {
		const result: ScreenHandlerResponse = {
			content: LibraryContent()
		}
		return result
	}
})

export default plugin
