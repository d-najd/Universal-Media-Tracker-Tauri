import { useMemo } from 'react'
import { createBrowserRouter, RouteObject, RouterProvider } from 'react-router'
import { useRouteStore } from '@/stores/useRouteStore'
import { useAppInit } from '@/lib/init/useAppinit'

/**
 * Dynamic routes should be passed at the start if possible
 */
const createAppRouter = (dynamicRoutes: RouteObject[] = []) =>
	useMemo(
		() =>
			createBrowserRouter([
				{
					path: '*',
					lazy: () => import('@/app/routes/not-found'),
				},
				...dynamicRoutes,
			]),
		[dynamicRoutes],
	)

export default function AppRouter() {
	const { initialized } = useAppInit()
	const { routes } = useRouteStore()

	const appRouter = createAppRouter(initialized ? routes : [])

	if (!initialized) {
		return <h1>Loading</h1>
	}

	return <RouterProvider router={appRouter} />
}
