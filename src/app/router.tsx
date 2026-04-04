import { useMemo } from 'react'
import { createBrowserRouter, RouteObject, RouterProvider } from 'react-router'

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
