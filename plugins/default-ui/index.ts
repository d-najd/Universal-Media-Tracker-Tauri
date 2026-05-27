import {
	Plugin,
	PluginConfig,
	ScreenHandlerArgs,
	ScreenHandlerResponse,
} from '@d-najd/universal-media-tracker-sdk'
import ExampleContent from './features/library/example'
import LibraryContent from './features/library'

const options: PluginConfig = {
	id: 'default-ui',
	name: 'Default UI',
	version: '0.0.1',
}

const plugin = new Plugin(options)

plugin.defineScreenHandler({
	pattern: '/',
	// initialState: createZustandStoreWrapper(''),
	async callback(args: ScreenHandlerArgs): Promise<ScreenHandlerResponse> {
		const result: ScreenHandlerResponse = {
			content: ExampleContent,
		}
		return result
	},
	callbackSync(args: ScreenHandlerArgs): ScreenHandlerResponse {
		const result: ScreenHandlerResponse = {
			content: LibraryContent,
		}
		return result
	},
})

export default plugin
