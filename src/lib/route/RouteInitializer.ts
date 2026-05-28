import HandlerRegistry from '../registry/HandlerRegistry'
import { RouteObject } from 'react-router'
import {
	CreateCustomScreenHandler,
	ScreenHandlerArgs,
} from '@d-najd/universal-media-tracker-sdk'
import React from 'react'

export default class RouteInitializer {
	static async getRoutes(): Promise<RouteObject[]> {
		const handlers = HandlerRegistry.getHandlersMatching(
			(o) => o.type === 'ui-screen',
		) as unknown as CreateCustomScreenHandler[]

		const routes = handlers.map((handler) => {
			const args: ScreenHandlerArgs = {
				path: window.location.pathname,
				pattern: handler.pattern,
				state: handler.initialState,
			}

			const result: RouteObject = {
				path: handler.pattern,
				element: React.createElement(() =>
					handler.callback(args).content(),
				),
			}

			return result
		})

		return routes
	}
}
