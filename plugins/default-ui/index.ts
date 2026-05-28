import {
	Plugin,
	PluginConfig,
	ScreenHandlerArgs,
	ScreenHandlerResponse,
} from '@d-najd/universal-media-tracker-sdk'
import LibraryContent from './features/library'
import React from 'react'

const options: PluginConfig = {
	id: 'default-ui',
	name: 'Default UI',
	version: '0.0.1',
}

const plugin = new Plugin(options)

plugin.defineScreenHandler({
	pattern: '/',
	// initialState: createZustandStoreWrapper(''),
	callback(args: ScreenHandlerArgs): ScreenHandlerResponse {
		const ComponentWithProps = () =>
			React.createElement(LibraryContent, {
				navigator: plugin.app.ui.navigator,
			})

		const result: ScreenHandlerResponse = {
			content: ComponentWithProps,
		}
		return result
	},
	// TODO maybe override the definition of callback Promise<?> to just ? with omit and see if it works?
	// callbackSync(args: ScreenHandlerArgs): ScreenHandlerResponse {
	// 	const ComponentWithProps = () =>
	// 		React.createElement(LibraryContent, {
	// 			navigator: plugin.app.ui.navigator,
	// 		})
	//
	// 	const result: ScreenHandlerResponse = {
	// 		content: ComponentWithProps,
	// 	}
	// 	return result
	// },
})

plugin.defineScreenHandler({
	pattern: '/test',
	callback(args) {
		const ComponentWithProps = () => React.createElement(TestContent, args)

		const result: ScreenHandlerResponse = {
			content: ComponentWithProps,
		}
		return result
	},
	// callbackSync(args: ScreenHandlerArgs): ScreenHandlerResponse {
	// 	const ComponentWithProps = () => React.createElement(TestContent, args)
	//
	// 	const result: ScreenHandlerResponse = {
	// 		content: ComponentWithProps,
	// 	}
	// 	return result
	// },
})

export default plugin
