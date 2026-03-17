import { useEffect, useRef, useState } from 'react'
import PluginManagerStore from '@/stores/pluginManagerStore'
import BaseHandlerArgs from '@/sdk/types/handler/base/baseHandlerArgs'
import HandlerManagerStore from '@/stores/handlerManagerStore'
import CatalogHandlerArgs from '@/sdk/types/handler/media/catalog/catalogHandlerArgs'
import CatalogHandlerResponse from '@/sdk/types/handler/media/catalog/catalogHandlerResponse'
import MediaHandler from '@/sdk/types/handler/media/mediaHandler'
import BaseHandlerResponse from '@/sdk/types/handler/base/baseHandlerResponse'

export default function LibraryContent() {
	const pluginStoreInitialized = useRef(false)
	const [catalog, setCatalog] = useState<CatalogHandlerResponse | null>(null)

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
			setCatalog(result)
		})()
	}, [])

	const te: MediaHandler {}


	return (
		<>
			{catalog ? <>No Data</> : <></>}
			<div>hello</div>
		</>
	)
}

/*

			<div className="absolute top-0 left-4 bg-blue-500">Box1</div>
			<div></div>

		<div className="bg-background/70 backdrop-blur-md border border-gray-200/50 dark:border-white/10 shadow-sm p-6">
			<Input id="input-button-group" placeholder="Type to search..." />
		</div>
 */
