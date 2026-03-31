import { useCallback, useEffect, useRef, useState } from 'react'
import {
	CatalogHandlerArgs,
	CatalogHandlerResponse,
	MetaPreview,
	ResourceHandler,
	ResourceHandlerArgs
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
	const [catalog, setCatalog] = useState<Map<string, MetaPreview>>(
		new Map<string, MetaPreview>()
	)
	const [previousFetchSize, setPreviousFetchSize] = useState(0)
	const [skip, setSkip] = useState(0)
	const [loading, setLoading] = useState(false)
	const [reachedEnd, setReachedEnd] = useState(false)

	const observer = useRef<IntersectionObserver | null>(null)
	const lastItemRef = useCallback(
		(node: HTMLDivElement | null) => {
			if (loading) return
			if (observer.current) observer.current.disconnect()
			observer.current = new IntersectionObserver((entries) => {
				if (entries[0].isIntersecting) {
					setSkip((o) => o + previousFetchSize)
					// setPage((prev) => prev + 1)
				}
			})
			if (node) observer.current.observe(node)
		},
		[loading]
	)

	const fetchCatalog = async (
		catalogFetchCallback: () => Promise<CatalogHandlerResponse>
	) => {
		setLoading(true)
		const result = await catalogFetchCallback()
		if (result.data.length === 0) {
			setReachedEnd(true)
			return
		}

		setPreviousFetchSize(result.data.length)
		setCatalog((prev) => {
			result.data.forEach((o) => prev.set(o.id, o))
			return prev
		})
		setLoading(false)
	}

	useEffect(() => {
		if (reachedEnd) return
		;(async () => {
			if (!pluginStoreInitialized.current) {
				pluginStoreInitialized.current = true
				await PluginManagerStore.init()
			}

			const handler = HandlerStore.getHandlersMatching(
				(o) => o.id === 'kitsu-anime-rating'
			)[0] as ResourceHandler<CatalogHandlerArgs, CatalogHandlerResponse>

			const hasSkipOption =
				handler?.options?.some(
					(o) => o.name === 'skip' && o.type === 'number'
				) ?? false

			const args: ResourceHandlerArgs = {
				options: [
					...(hasSkipOption ? [{ name: 'skip', input: skip }] : [])
				]
			}
			const catalogFetchCallback = () => handler.callback(args)
			await fetchCatalog(catalogFetchCallback)
		})()
	}, [skip])

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
						{[...catalog.values()].map((item, key) => (
							<Card
								key={key}
								className={cardStyle()}
								ref={lastItemRef}
							>
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
