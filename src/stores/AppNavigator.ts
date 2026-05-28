import {
	Navigator as SDKNavigator,
	NavigatorEntry,
} from '@d-najd/universal-media-tracker-sdk'
import { create } from 'zustand'
import RouteStore from './RouteStore'
import { matchPath } from 'react-router'

export const useAppNavigatorStore = create<AppNavigatorStore>()((set, get) => ({
	screens: [],
	push: (path: string): void => {
		const matched = RouteStore.routes.filter((o) =>
			matchPath(o.path!, path),
		)
		if (!matched) {
			throw Error(`Can't find route matching path ${path}`)
		}

		const newScreen: NavigatorEntry = {
			state: undefined,
			path: path,
			pattern: matched[0].path!,
		}

		window.location.pathname = newScreen.path

		set((s) => ({
			screens: [...s.screens, newScreen],
		}))
	},
	pop: (): NavigatorEntry => {
		const lastScreen = get().screens.at(-1)!

		set((s) => ({
			screens: s.screens.slice(0, -1),
		}))

		window.location.pathname = lastScreen.path

		return lastScreen
	},
	replace: (path: string): void => {
		const matched = RouteStore.routes.filter((o) =>
			matchPath(o.path!, path),
		)
		if (!matched) {
			throw Error(`Can't find route matching path ${path}`)
		}

		const newScreen: NavigatorEntry = {
			state: undefined,
			path: path,
			pattern: matched[0].path!,
		}

		window.location.pathname = newScreen.path

		set((s) => ({
			screens: [...s.screens.slice(0, -1), newScreen],
		}))
	},
}))

export interface AppNavigatorStore extends SDKNavigator {
	screens: NavigatorEntry[]
	push(path: string): void
	pop(): NavigatorEntry
	replace(path: string): void
}
