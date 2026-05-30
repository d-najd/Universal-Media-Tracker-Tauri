import initAppGlobals from './initGlobals'
import PluginManagerStore from '@/stores/PluginManagerStore'
import { useRouteStore } from '@/stores/useRouteStore'

import { useEffect, useState } from 'react'

let initialized = false
let initPromise: Promise<void> | null = null

// Like this to add ability to handle errors in future
type AppInitState = {
	initialized: boolean
}

export function useAppInit(): AppInitState {
	const [isInitialized, setIsInitialized] = useState<AppInitState>({
		initialized: initialized,
	})
	const { generateRoutes } = useRouteStore()

	useEffect(() => {
		if (initialized) return

		if (!initPromise) {
			initPromise = (async () => {
				await initAppGlobals()
				setTheme()

				await PluginManagerStore.init()
				await generateRoutes()

				initialized = true
				setIsInitialized({
					initialized: true,
				})
			})()
		} else {
			// Wait for in-progress initialization
			initPromise.then(() =>
				setIsInitialized({
					initialized: true,
				}),
			)
		}
	}, [])

	return isInitialized
}

function setTheme() {
	document.documentElement.classList.add('dark')
}
