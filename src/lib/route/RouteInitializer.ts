import HandlerRegistry from '../registry/HandlerRegistry'
import { RouteObject } from 'react-router'
import { CreateCustomScreenHandler } from '../../../../Universal-Media-Tracker-Sdk'
import {
	ScreenHandlerArgs,
	ScreenHandlerResponse
} from '@d-najd/universal-media-tracker-sdk'
import StubNavigator from '@/lib/navigator/StubNavigator'

export default class RouteInitializer {
	static getRoutes(): RouteObject[] {
		const handlers = HandlerRegistry.getHandlersMatching(
			(o) => o.type === 'ui-screen'
		) as CreateCustomScreenHandler[]

		return handlers.map((handler) => {
			const lazyContent = async () => {
				const args: ScreenHandlerArgs = {
					navigator: new StubNavigator(),
					path: window.location.pathname,
					pattern: handler.pattern,
					state: handler.initialState
				}

				const result: ScreenHandlerResponse =
					await handler.callback(args)
				return { Component: () => result.content }
			}

			const result: RouteObject = {
				path: handler.pattern,
				lazy: lazyContent
			}
			return result
		})
	}
}
