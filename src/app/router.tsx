import { useEffect, useMemo, useState } from 'react'
import { createBrowserRouter, RouteObject, RouterProvider } from 'react-router'
import PluginManagerStore from '@/stores/PluginManagerStore'
import RouteInitializer from '@/lib/route/RouteInitializer'

/**
 * Dynamic routes should be passed at the start if possible
 */
const createAppRouter = (dynamicRoutes: RouteObject[] = []) =>
	useMemo(
		() =>
			createBrowserRouter([
				{
					path: '*'
					//lazy: () => import('@/app/routes/not-found')
				},
				...dynamicRoutes
			]),
		[dynamicRoutes]
	)

export default function AppRouter() {
	const [pluginsLoaded, setPluginsLoaded] = useState<boolean>(false)
	const [dynamicRoutes, setDynamicRoutes] = useState<RouteObject[]>([])
	const appRouter = createAppRouter(dynamicRoutes)

	useEffect(() => {
		PluginManagerStore.init().then(() => {
			setDynamicRoutes(RouteInitializer.getRoutes())
			setPluginsLoaded(true)
		})
	}, [])

	if (!pluginsLoaded) {
		return <h1>Loading</h1>
	}

	return <RouterProvider router={appRouter} />
}
