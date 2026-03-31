import { useEffect, useRef, useState } from 'react'
import {
	BaseHandlerArgs,
	CatalogHandlerArgs,
	CatalogHandlerResponse
} from '@d-najd/universal-media-tracker-sdk'
import { cva } from 'class-variance-authority'
import { Card } from '@/components/ui/card'
import PluginManagerStore from '@/stores/PluginManagerStore'
import HandlerStore from '@/stores/HandlerStore'

interface LibraryGridProps {
	topbarSize: { width: number; height: number }
}

export default function LibraryGrid({ topbarSize }: LibraryGridProps) {
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

			const result = await HandlerStore.invokeCallbackOnHandler<
				CatalogHandlerArgs,
				CatalogHandlerResponse
			>('kitsu-anime-rating', args)
			setCatalog(result)
		})()
	}, [])

	const cardStyle = cva('w-38 h-59.5 gap-0 py-0 overflow-hidden', {
		variants: {
			hoverable: {
				true: 'hover:scale-105 hover:shadow-lg transition-all duration-200 hover:border-primary border',
				false: ''
			}
		},
		defaultVariants: {
			hoverable: true
		}
	})

	return (
		<>
			{catalog ? (
				<>
					<div
						className={`absolute flex gap-2.75 flex-row flex-wrap content-start px-3`}
						style={{ paddingTop: topbarSize.height + 10 }}
					>
						{catalog.data.map((item, key) => (
							<Card key={key} className={cardStyle()}>
								<img
									className="w-full h-full object-fill"
									alt="no content"
									src={item.poster}
									onError={(e) => {
										// TODO placeholder
										e.currentTarget.style.display = 'none'
									}}
								/>
							</Card>
						))}
					</div>
				</>
			) : (
				<>No Data</>
			)}
		</>
	)
}
