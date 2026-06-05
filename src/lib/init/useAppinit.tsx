import initAppGlobals from './initGlobals'

import { useEffect, useState } from 'react'
import { matchPath, useNavigate } from 'react-router'
import { setNavigator } from './navigator'
import PluginManagerStore from '../plugin-loader/PluginManagerStore'
import { useRouteStore } from '../plugin-loader/useRouteStore'
import { useAppNavigatorStore } from '../plugin-loader/useAppNavigator'
import path from 'path'

let coreInitialized = false
let coreInitPromise: Promise<void> | null = null

let reactInitialized = false
let reactInitPromise: Promise<void> | null = null

// Like this to add ability to handle errors in future
type AppInitState = {
	initialized: boolean
}

/**
 * Initialize stuff like plugins which don't necessarly require react to be running
 */
export function useAppCoreInit(): AppInitState {
	const [isInitialized, setIsInitialized] = useState<AppInitState>({
		initialized: coreInitialized,
	})
	const { generateRoutes } = useRouteStore()

	useEffect(() => {
		if (coreInitialized) return

		if (!coreInitPromise) {
			coreInitPromise = (async () => {
				await initAppGlobals()
				setTheme()

				await PluginManagerStore.init()
				const routes = await generateRoutes()
				const matchedRoute = routes
					.filter(
						(o) =>
							o.path &&
							matchPath(o.path, window.location.pathname),
					)
					.at(0)!

				useAppNavigatorStore.setState({
					screens: [
						{
							pattern: matchedRoute.path!,
							path: window.location.pathname,
						},
					],
				})

				console.log(useAppNavigatorStore.getState())

				coreInitialized = true
				setIsInitialized({
					initialized: true,
				})
			})()
		} else {
			// Wait for in-progress initialization
			coreInitPromise.then(() =>
				setIsInitialized({
					initialized: true,
				}),
			)
		}
	}, [])

	return isInitialized
}

/**
 * Initialize stuff that requires react to be running fully before being called like navigator which depends on reaact
 */
export function useAppReactInit(): AppInitState {
	const [isInitialized, setIsInitialized] = useState<AppInitState>({
		initialized: reactInitialized,
	})
	// const { routes } = useRouteStore()
	const navigator = useNavigate()
	// const { push } = useAppNavigatorStore()

	useEffect(() => {
		if (reactInitialized || !coreInitialized) return

		if (!reactInitPromise) {
			reactInitPromise = (async () => {
				setNavigator(navigator)
				// const result = routes
				// 	.filter((o) => {
				// 		try {
				// 			return match(o.path!)()
				// 		} catch {
				// 			return false
				// 		}
				// 	})
				// 	.at(0)!
				//
				// push(window.location.pathname)

				// useAppNavigatorStore.setState({
				// 	screens: [
				// 		{
				// 			path: window.location.pathname,
				// 			pattern: result.path!,
				// 		},
				// 	],
				// })

				reactInitialized = true
				setIsInitialized({
					initialized: true,
				})
			})()
		} else {
			// Wait for in-progress initialization
			reactInitPromise.then(() =>
				setIsInitialized({
					initialized: true,
				}),
			)
		}
	}, [coreInitialized])

	return isInitialized
}

function setTheme() {
	document.documentElement.classList.add('dark')
}
