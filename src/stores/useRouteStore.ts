import HandlerRegistry from '@/lib/registry/HandlerRegistry'
import { CreateCustomScreenHandler } from '@d-najd/universal-media-tracker-sdk'
import React from 'react'
import { RouteObject } from 'react-router'
import { create } from 'zustand'

interface RouteStore {
	routes: RouteObject[]
	generateRoutes: () => Promise<void>
}

export const useRouteStore = create<RouteStore>((set) => ({
	routes: [],
	generateRoutes: async () => {
		const handlers = HandlerRegistry.getHandlersMatching(
			(o) => o.type === 'ui-screen',
		) as unknown as CreateCustomScreenHandler[]

		const routes = handlers.map((handler) => ({
			path: handler.pattern,
			element: React.createElement(() =>
				handler
					.callback({
						path: window.location.pathname,
						pattern: handler.pattern,
						state: handler.initialState,
					})
					.content(),
			),
		}))

		set({ routes })
	},
}))
