import { useEffect, useRef, useState } from 'react'
import PluginManagerStore from '@/stores/pluginManagerStore'
import BaseHandlerArgs from '@/sdk/types/handler/base/baseHandlerArgs'
import HandlerStore from '@/stores/handlerStore'
import CatalogHandlerArgs from '@/sdk/types/handler/media/catalog/catalogHandlerArgs'
import CatalogHandlerResponse from '@/sdk/types/handler/media/catalog/catalogHandlerResponse'
import { Card } from '@/components/ui/card'
import { cva } from 'class-variance-authority'
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput
} from '@/components/ui/input-group'
import { Search } from 'lucide-react'
import { useElementSize } from '@/hooks/useElementSize'

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

	const { ref: topbarRef, size: topbarSize } =
		useElementSize<HTMLDivElement>()

	console.log(topbarSize.height)

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
			<div
				ref={topbarRef}
				className={
					'fixed top-0 left-0 w-full grid place-items-center bg-background/80 backdrop-blur-md px-2.5 py-2 z-50'
				}
			>
				<InputGroup className={'min-w-20 max-w-120'}>
					<InputGroupInput placeholder={'Search'}></InputGroupInput>
					<InputGroupAddon align={'inline-end'}>
						<Search />
					</InputGroupAddon>
				</InputGroup>
			</div>

			{catalog ? (
				<div
					className={`absolute flex gap-3 flex-row flex-wrap content-start`}
					style={{ paddingTop: topbarSize.height }}
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
			) : (
				<>No Data</>
			)}
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
