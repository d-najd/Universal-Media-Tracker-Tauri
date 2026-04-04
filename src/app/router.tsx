import { createBrowserRouter, RouterProvider } from 'react-router'

const createAppRouter = () =>
	createBrowserRouter([
		{
			path: '/',
			// lazy: () => import('@/app/routes/home')
			lazy: () => import('@/app/routes/library')
		},
		{
			path: '*',
			lazy: () => import('@/app/routes/not-found')
		}
	])

export default function AppRouter() {
	return <RouterProvider router={createAppRouter()} />
}
