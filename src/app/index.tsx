import './global.css'

import AppRouter from '@/app/router'
import AppProvider from '@/app/provider'
import PluginManagerStore from '@/stores/pluginManagerStore'
import { useEffect, useRef } from 'react'
import HandlerManagerStore from '@/stores/handlerManagerStore'
import BaseHandlerArgs from '@/sdk/types/handler/base/baseHandlerArgs'
import CatalogHandlerArgs from '@/sdk/types/handler/media/catalog/catalogHandlerArgs'
import CatalogHandlerResponse from '@/sdk/types/handler/media/catalog/catalogHandlerResponse'

export default function App() {
	const pluginStoreInitialized = useRef(false)

	useEffect(() => {
		if (pluginStoreInitialized.current) return
		pluginStoreInitialized.current = true
		;(async () => {
			await PluginManagerStore.init()
			const args: BaseHandlerArgs = {
				pageSize: 20
			}

			const result = await HandlerManagerStore.getFromMediaHandler<
				CatalogHandlerArgs,
				CatalogHandlerResponse
			>('example-plugin-catalog-handler', args)
		})()
	}, [])

	useEffect(() => {
		document.documentElement.classList.add('dark')
	}, [])

	return (
		<AppProvider>
			<AppRouter />
		</AppProvider>
	)
}
