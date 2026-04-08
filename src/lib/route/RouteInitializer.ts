import HandlerRegistry from '../registry/HandlerRegistry'
import { RouteObject } from 'react-router'
import {
	CreateCustomScreenHandler,
	ScreenHandlerArgs,
	ScreenHandlerResponse,
} from '@d-najd/universal-media-tracker-sdk'

export default class RouteInitializer {
	static getRoutes(): RouteObject[] {
		const handlers = HandlerRegistry.getHandlersMatching(
			(o) => o.type === 'ui-screen',
		) as CreateCustomScreenHandler[]

		return handlers.map((handler) => {
			const lazyContent = async () => {
				const args: ScreenHandlerArgs = {
					path: window.location.pathname,
					pattern: handler.pattern,
					state: handler.initialState,
				}

				const result: ScreenHandlerResponse =
					await handler.callback(args)
				return { Component: () => result.content }
			}

			const result: RouteObject = {
				path: handler.pattern,
				lazy: lazyContent,
			}
			return result
		})
	}
}
