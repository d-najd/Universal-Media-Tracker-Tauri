import { useEffect, useMemo, useState } from 'react'
import { createBrowserRouter, RouteObject, RouterProvider } from 'react-router'
import PluginManagerStore from '@/stores/PluginManagerStore'

/**
 * Dynamic routes should be passed at the start if possible
 */
const createAppRouter = (dynamicRoutes: RouteObject[] = []) =>
	useMemo(
		() =>
			createBrowserRouter([
				{
					path: '/',
					lazy: () => import('@/app/routes/library')
				},
				{
					path: '*',
					lazy: () => import('@/app/routes/not-found')
				},
				...dynamicRoutes
			]),
		[dynamicRoutes]
	)

export default function AppRouter() {
	const [pluginsLoaded, setPluginsLoaded] = useState<boolean>(false)
	const appRouter = createAppRouter()
	useEffect(() => {
		PluginManagerStore.init().then(() => {
			setPluginsLoaded(true)
		})
	}, [])

	if (!pluginsLoaded) {
		return <h1>Loading</h1>
	}

	return <RouterProvider router={appRouter} />
}
