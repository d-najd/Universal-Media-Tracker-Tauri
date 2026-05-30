import {
	Plugin,
	PluginConfig,
	ScreenHandlerArgs,
	ScreenHandlerResponse,
} from '@d-najd/universal-media-tracker-sdk'
import React from 'react'
import TestPage from './features/test'
import LibraryPage from './features/library'
import NotFoundErrorPage from './features/not-found'

const options: PluginConfig = {
	id: 'default-ui',
	name: 'Default UI',
	version: '0.0.1',
}

export const plugin = new Plugin(options)

plugin.defineScreenHandler({
	pattern: '/',
	callback(args: ScreenHandlerArgs): ScreenHandlerResponse {
		const ComponentWithProps = () =>
			React.createElement(LibraryPage, {
				navigator: plugin.app.ui.navigator,
			})

		const result: ScreenHandlerResponse = {
			content: ComponentWithProps,
		}
		return result
	},
})

plugin.defineScreenHandler({
	pattern: '*',
	callback(args: ScreenHandlerArgs): ScreenHandlerResponse {
		const ComponentWithProps = () =>
			React.createElement(NotFoundErrorPage, args)

		const result: ScreenHandlerResponse = {
			content: ComponentWithProps,
		}

		return result
	},
})

plugin.defineScreenHandler({
	pattern: '/test',
	callback(args) {
		const ComponentWithProps = () => React.createElement(TestPage, args)

		const result: ScreenHandlerResponse = {
			content: ComponentWithProps,
		}
		return result
	},
})

export default plugin
