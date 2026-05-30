import { useMemo } from 'react'
import { createBrowserRouter, RouteObject, RouterProvider } from 'react-router'
import { useRouteStore } from '@/stores/useRouteStore'
import { useAppInit } from '@/lib/init/useAppinit'

/**
 * Dynamic routes should be passed at the start if possible
 */
const createAppRouter = (dynamicRoutes: RouteObject[] = []) =>
	useMemo(() => createBrowserRouter([...dynamicRoutes]), [dynamicRoutes])

export default function AppRouter() {
	const { initialized } = useAppInit()
	const { routes } = useRouteStore()

	// Must have empty route object or react will freak out
	const appRouter = createAppRouter(initialized ? routes : [{}])

	if (!initialized) {
		return <h1>Loading</h1>
	}

	return <RouterProvider router={appRouter} />
}
