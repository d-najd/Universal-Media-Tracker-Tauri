import ReactInitializing from '@/lib/init/reactInit'
import HandlerRegistry from '@/lib/plugin-loader/HandlerRegistry'
import { CreateScreenHandler } from '@d-najd/universal-media-tracker-sdk'
import React, { useState } from 'react'
import { RouteObject } from 'react-router'
import { create } from 'zustand'

interface RouteStore {
	routes: RouteObject[]
	generateRoutes: () => Promise<RouteObject[]>
}

/**
 * Generates routes that the app uses from plugins
 * @see [useAppInit]
 */
export const useRouteStore = create<RouteStore>((set) => ({
	routes: [],
	generateRoutes: async () => {
		const handlers = HandlerRegistry.getHandlersMatching(
			(o) => o.type === 'ui-screen',
		) as unknown as CreateScreenHandler[]

		const routes = handlers.map((handler) => {
			const RouteWrapper = () => {
				const [reactLoaded, setReactLoaded] = useState(false)

				const Component = () =>
					handler
						.callback({
							path: window.location.pathname,
							pattern: handler.pattern,
						})
						.content()

				// React needs to be loaded here since it depends on the router component and if we regenerate the routes then the context will change.
				return reactLoaded ? (
					<Component />
				) : (
					<ReactInitializing
						initializedCallback={() => setReactLoaded(true)}
					/>
				)
			}

			return {
				path: handler.pattern,
				element: <RouteWrapper />,
			}
		})

		set({ routes })
		return routes
	},
}))
