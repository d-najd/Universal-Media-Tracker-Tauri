import {
	Plugin,
	PluginConfig,
	ScreenHandlerArgs,
	ScreenHandlerResponse
} from '@d-najd/universal-media-tracker-sdk'
import LibraryContent from './features/library'

const options: PluginConfig = {
	id: 'default-ui',
	name: 'Default UI',
	version: '0.0.1'
}

const plugin = new Plugin(options)

plugin.defineScreenHandler({
	pattern: '/library',
	// initialState: createZustandStoreWrapper(''),
	async callback(args: ScreenHandlerArgs): Promise<ScreenHandlerResponse> {
		const result: ScreenHandlerResponse = {
			content: LibraryContent()
		}
		return result
	}
})

export default plugin
