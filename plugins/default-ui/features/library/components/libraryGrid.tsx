import { useCallback, useEffect, useRef, useState } from 'react'
import {
	CatalogHandlerArgs,
	CatalogHandlerResponse,
	MetaPreview,
	ResourceHandler,
	ResourceHandlerArgs,
} from '@d-najd/universal-media-tracker-sdk'
import plugin from '../../../index'
import { Box, Paper, styled } from '@mui/material'

type LibraryGridProps = {
	topbarSize: { width: number; height: number }
	search: string
}

export default function LibraryGrid({ topbarSize, search }: LibraryGridProps) {
	const [catalog, setCatalog] = useState<Map<string, MetaPreview>>(
		new Map<string, MetaPreview>(),
	)
	const [previousFetchSize, setPreviousFetchSize] = useState(0)
	const [skip, setSkip] = useState(0)
	const [loading, setLoading] = useState(false)
	const [reachedCatalogEnd, setReachedCatalogEnd] = useState(false)
	const [failedUniqueFetchTimes, setFailedUniqueFetchTimes] = useState(0)
	const MAX_UNIQUE_FETCH_FAILED_TIMES = 3

	const observer = useRef<IntersectionObserver | null>(null)
	const lastItemRef = useCallback(
		(node: HTMLDivElement | null) => {
			if (loading) return
			if (observer.current) observer.current.disconnect()
			observer.current = new IntersectionObserver((entries) => {
				if (entries[0].isIntersecting) {
					setSkip((o) => o + previousFetchSize)
				}
			})
			if (node) observer.current.observe(node)
		},
		[loading],
	)

	useEffect(() => {
		setFailedUniqueFetchTimes(0)
		setReachedCatalogEnd(false)
		setCatalog(new Map<string, MetaPreview>())
		setSkip(0)
	}, [search])

	const fetchCatalog = async () => {
		setLoading(true)

		const handler = plugin.app.plugins.getHandlersMatching(
			// (o) => o.id === 'kitsu-anime-rating'
			(o) => o.id === 'kitsu-anime-list',
		)[0] as ResourceHandler<CatalogHandlerArgs, CatalogHandlerResponse>

		const hasSkipOption =
			handler?.options?.some(
				(o) => o.name === 'skip' && o.type === 'number',
			) ?? false

		const hasSearchOption = handler?.options?.some(
			(o) => o.name === 'search' && o.type === 'string',
		)

		let args: ResourceHandlerArgs = {
			options: [
				...(hasSkipOption && skip !== 0
					? [{ name: 'skip', input: skip }]
					: []),
				...(hasSearchOption && search !== ''
					? [{ name: 'search', input: search }]
					: []),
			],
		}

		if (args.options?.length === 0) {
			args = {
				...args,
				options: undefined,
			}
		}

		const result = await handler.callback(args)
		if (result.data.length === 0) {
			setReachedCatalogEnd(true)
			return
		}

		setPreviousFetchSize(result.data.length)
		const catalogSize = catalog.size
		setCatalog((prev) => {
			result.data.forEach((o) => prev.set(o.id, o))
			return prev
		})

		if (catalog.size === catalogSize) {
			setFailedUniqueFetchTimes((o) => (o += 1))
			if (failedUniqueFetchTimes === MAX_UNIQUE_FETCH_FAILED_TIMES) {
				setReachedCatalogEnd(true)
			}
		}
		setLoading(false)
	}

	useEffect(() => {
		if (reachedCatalogEnd) return
		fetchCatalog().then()
	}, [skip, search])

	return (
		<>
			{catalog ? (
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'center',
						gap: `11px`,
						flexDirection: 'row',
						flexWrap: 'wrap',
						alignContent: 'flex-start',
						px: `12px`,
						paddingTop: `${topbarSize.height + 10}px`,
					}}
				>
					{[...catalog.values()].map((item, key) => (
						<Card key={key} ref={lastItemRef}>
							<img
								style={{
									width: '100%',
									height: '100%',
									objectFit: 'fill',
								}}
								alt="no content"
								src={item.poster}
								onError={(e) => {
									// TODO placeholder
									e.currentTarget.style.display = 'none'
								}}
							/>
						</Card>
					))}
				</Box>
			) : (
				<>No Data</>
			)}
		</>
	)
}

const Card = styled(Paper, {
	shouldForwardProp: (prop) => prop !== 'hoverable',
})<{ hoverable?: boolean }>(({ theme, hoverable = true }) => ({
	width: '152px',
	height: '238px',
	gap: 0,
	paddingBlock: 0,
	overflow: 'hidden',
	transition: 'all 0.2s ease-in-out',
	...(hoverable && {
		'&:hover': {
			transform: 'scale(1.05)',
			boxShadow: theme.shadows[4],
			border: `1px solid ${theme.palette.primary.main}`,
		},
	}),
}))
