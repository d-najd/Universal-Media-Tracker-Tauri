import initAppGlobals from './initGlobals'
import { useRouteStore } from '@/stores/useRouteStore'

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { setNavigator } from './navigator'
import PluginManagerStore from '../plugin-loader/PluginManagerStore'

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
				await generateRoutes()

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
	const navigator = useNavigate()

	useEffect(() => {
		if (reactInitialized || !coreInitialized) return

		if (!reactInitPromise) {
			reactInitPromise = (async () => {
				setNavigator(navigator)

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
