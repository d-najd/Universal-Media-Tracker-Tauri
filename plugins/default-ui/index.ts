import {
	Plugin,
	PluginConfig,
	ScreenHandlerArgs,
	ScreenHandlerResponse,
} from '@d-najd/universal-media-tracker-sdk'
import React from 'react'
import TestPage from './features/test'
import NotFoundErrorPage from './features/not-found'
import LibraryPage from './features/library'
import PluginsManagePage from './features/plugins-manage'
import MediaViewPage from './features/media-view'

const options: PluginConfig = {
	logo: '',
	id: 'default-ui',
	name: 'Default UI',
	version: '0.0.1',
}

export const plugin = new Plugin(options)

plugin.defineScreenHandler({
	pattern: '/',
	callback(args: ScreenHandlerArgs): ScreenHandlerResponse {
		// TODO this could be simplified? also not sure if I want to let the user pass args like this since it can break
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

// manage/plugins
// browse/plugins

plugin.defineScreenHandler({
	pattern: '/manage/plugins',
	callback(args: ScreenHandlerArgs): ScreenHandlerResponse {
		const ComponentWithProps = () =>
			React.createElement(PluginsManagePage, args)

		const result: ScreenHandlerResponse = {
			content: ComponentWithProps,
		}

		return result
	},
})

plugin.defineScreenHandler({
	pattern: '/detail/:id',
	callback(args: ScreenHandlerArgs): ScreenHandlerResponse {
		const ComponentWithProps = () =>
			React.createElement(MediaViewPage, args)

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
