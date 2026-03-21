import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import PluginManagerStore from '@/stores/pluginManagerStore'
import { Card } from '@/components/ui/card'
import { cva } from 'class-variance-authority'
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput
} from '@/components/ui/input-group'
import { Filter, LayoutGrid, LibraryBig, Search } from 'lucide-react'
import { useElementSize } from '@/hooks/useElementSize'
import { Button } from '@/components/ui/button'
import CatalogHandlerResponse from '@d-najd/universal-media-tracker-sdk/dist/types/handler/media/catalog/catalogHandlerResponse'
import BaseHandlerArgs from '@d-najd/universal-media-tracker-sdk/dist/types/handler/base/baseHandlerArgs'
import HandlerStore from '@/stores/handlerStore'
import CatalogHandlerArgs from '@d-najd/universal-media-tracker-sdk/dist/types/handler/media/catalog/catalogHandlerArgs'

export default function LibraryContent() {
	const pluginStoreInitialized = useRef(false)
	const [catalog, setCatalog] = useState<CatalogHandlerResponse | null>(null)
	const [topbarSearchPadding, setTopbarSearchPadding] = useState<number>(0)

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

	const { ref: topBarIconsRef, size: topBarIconsSize } =
		useElementSize<HTMLDivElement>()

	const topbarSearchMaxWidthPx = 480
	useLayoutEffect(() => {
		setTopbarSearchPadding(
			Math.max(
				0,
				Math.min(
					topBarIconsSize.width,
					window.innerWidth -
						(topbarSearchMaxWidthPx + topBarIconsSize.width)
				)
			)
		)
	})

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
					'fixed top-0 left-0 w-full flex items-center bg-background/80 backdrop-blur-md px-2.5 py-2 z-50'
				}
			>
				<div
					className="flex-1 flex justify-center min-w-20"
					style={{
						paddingLeft: topbarSearchPadding
					}}
				>
					<InputGroup
						style={{
							maxWidth: topbarSearchMaxWidthPx
						}}
					>
						<InputGroupInput
							placeholder={'Search'}
						></InputGroupInput>
						<InputGroupAddon align={'inline-end'}>
							<Search />
						</InputGroupAddon>
					</InputGroup>
				</div>

				<div
					ref={topBarIconsRef}
					className="flex-none flex items-center px-0.5"
				>
					<div className="px-0.5" />
					<Button variant={'ghost'}>
						<LibraryBig />
					</Button>
					<Button variant={'ghost'}>
						<Filter />
					</Button>
					{/*<Button variant={'ghost'}>*/}
					{/*	<Settings />*/}
					{/*</Button>*/}
					<Button variant={'ghost'}>
						<LayoutGrid />
					</Button>
					{/*<Button variant={'ghost'}>*/}
					{/*	<MoreVertical />*/}
					{/*</Button>*/}
				</div>
			</div>

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

/*

			<div className="absolute top-0 left-4 bg-blue-500">Box1</div>
			<div></div>

		<div className="bg-background/70 backdrop-blur-md border border-gray-200/50 dark:border-white/10 shadow-sm p-6">
			<Input id="input-button-group" placeholder="Type to search..." />
		</div>
 */
