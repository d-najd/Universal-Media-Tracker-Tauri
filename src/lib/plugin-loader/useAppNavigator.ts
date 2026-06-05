import {
	Navigator as SDKNavigator,
	NavigatorEntry,
} from '@d-najd/universal-media-tracker-sdk'
import { create } from 'zustand'
import { matchPath } from 'react-router'
import { navigator } from '@/lib/init/navigator'
import { useRouteStore } from './useRouteStore'

export const useAppNavigatorStore = create<AppNavigatorStore>()((set, get) => ({
	screens: [],
	push: (path: string): void => {
		const matched = useRouteStore
			.getState()
			.routes.filter((o) => matchPath(o.path!, path))
		if (!matched) {
			throw Error(`Can't find route matching path ${path}`)
		}

		const newScreen: NavigatorEntry = {
			path: path,
			pattern: matched[0].path!,
		}

		navigator()(newScreen.path)

		set((s) => ({
			screens: [...s.screens, newScreen],
		}))
	},
	pop: (): NavigatorEntry => {
		const lastScreen = get().screens.at(-1)!

		set((s) => ({
			screens: s.screens.slice(0, -1),
		}))

		navigator()(-1)

		return lastScreen
	},
	replace: (path: string): void => {
		const matched = useRouteStore
			.getState()
			.routes.filter((o) => matchPath(o.path!, path))
		if (!matched) {
			throw Error(`Can't find route matching path ${path}`)
		}

		const newScreen: NavigatorEntry = {
			path: path,
			pattern: matched[0].path!,
		}

		navigator()(newScreen.path, { replace: true })

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
