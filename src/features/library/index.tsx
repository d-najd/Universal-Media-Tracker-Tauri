import { useEffect, useRef, useState } from 'react'
import PluginManagerStore from '@/stores/pluginManagerStore'
import BaseHandlerArgs from '@/sdk/types/handler/base/baseHandlerArgs'
import HandlerStore from '@/stores/handlerStore'
import CatalogHandlerArgs from '@/sdk/types/handler/media/catalog/catalogHandlerArgs'
import CatalogHandlerResponse from '@/sdk/types/handler/media/catalog/catalogHandlerResponse'
import { Card } from '@/components/ui/card'

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

			const result = await HandlerStore.getFromMediaHandler<
				CatalogHandlerArgs,
				CatalogHandlerResponse
			>('example-plugin-catalog-handler', args)
			setCatalog(result)
		})()
	}, [])

	return (
		<>
			{catalog ? (
				<div className="flex relative gap-3 flex-row flex-wrap content-start">
					{catalog.data.map((item, key) => (
						<Card
							key={key}
							className="w-40 h-60 gap-0 py-0 overflow-hidden hover:scale-105 hover:shadow-lg transition-all duration-200 hover:border-primary "
						>
							<img
								className="w-full h-full object-fill"
								alt="no content"
								src={item.poster}
							/>
						</Card>
					))}
				</div>
			) : (
				<>No Data</>
			)}
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
