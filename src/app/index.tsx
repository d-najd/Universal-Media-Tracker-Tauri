import "./global.css"

import { useMemo } from "react"
import { createBrowserRouter, RouteObject, RouterProvider } from "react-router"
import { useAppCoreInit } from "@/lib/init/useAppinit"
import { useRouteStore } from "@/lib/plugin-loader/useRouteStore"

const createAppRouter = (dynamicRoutes: RouteObject[] = []) =>
	useMemo(() => createBrowserRouter([...dynamicRoutes]), [dynamicRoutes])

export default function App() {
	const { initialized } = useAppCoreInit()
	const { routes } = useRouteStore()

	const appRouter = createAppRouter(initialized ? routes : [{}])

	if (!initialized) {
		return <h1>Loading Core</h1>
	}

	return <RouterProvider router={appRouter} />
}
