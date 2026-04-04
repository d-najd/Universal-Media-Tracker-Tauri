import { useMemo } from 'react'
import { createBrowserRouter, RouteObject, RouterProvider } from 'react-router'

/**
 * Dynamic routes should be passed at the start if possible
 */
const createAppRouter = (dynamicRoutes: RouteObject[] = []) =>
	useMemo(
		() =>
			createBrowserRouter([
				{
					path: '/',
					// lazy: () => import('@/app/routes/home')
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
	return <RouterProvider router={createAppRouter()} />
}
