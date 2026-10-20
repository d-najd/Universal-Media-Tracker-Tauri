import { useCallback, useEffect, useRef, useState } from "react"
import {
	CatalogHandlerArgs,
	CatalogHandlerResponse,
	MetaPreview,
	ResourceHandler,
	ResourceHandlerArgs,
} from "@d-najd/universal-media-tracker-sdk"
import plugin from "../../../index"
import { Box, Paper, styled } from "@mui/material"

type LibraryGridProps = {
	topbarSize: { width: number; height: number }
	search: string
}

export default function LibraryGrid({ topbarSize, search }: LibraryGridProps) {
	// TODO save in cache instead of this
	const [catalog, setCatalog] = useState<MetaPreview[]>([])
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
		setCatalog([])
		setSkip(0)
	}, [search])

	const fetchCatalog = async () => {
		setLoading(true)

		const handler = plugin.app.plugin.getHandlersMatching(
			// (o) => o.id === 'kitsu-anime-rating'
			(o) => o.id === "kitsu-anime-list",
		)[0] as ResourceHandler<CatalogHandlerArgs, CatalogHandlerResponse>

		const hasSkipOption =
			handler?.options?.some(
				(o) => o.name === "skip" && o.type === "number",
			) ?? false

		const hasSearchOption = handler?.options?.some(
			(o) => o.name === "search" && o.type === "string",
		)

		let args: ResourceHandlerArgs = {
			options: [
				...(hasSkipOption && skip !== 0
					? [{ name: "skip", input: skip }]
					: []),
				...(hasSearchOption && search !== ""
					? [{ name: "search", input: search }]
					: []),
			],
		}

		if (args.options?.length === 0) {
			args = {
				...args,
				options: undefined,
			}
		}

		const result = (await handler.callback(args)) as CatalogHandlerResponse
		if (result.data.length === 0) {
			setReachedCatalogEnd(true)
			return
		}

		setPreviousFetchSize(result.data.length)
		const catalogSize = catalog.length

		setCatalog((prev) => {
			const prevIds = new Set(prev.flatMap((p) => p.ids))

			const filteredData = result.data.filter(
				(cur) => !cur.ids.some((id) => prevIds.has(id)),
			)

			if (filteredData.length > 0) {
				setFailedUniqueFetchTimes(0)
			}

			return [...prev, ...filteredData]
		})

		if (catalog.length === catalogSize) {
			console.error("FILED " + failedUniqueFetchTimes)
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
						display: "flex",
						justifyContent: "center",
						gap: `11px`,
						flexDirection: "row",
						flexWrap: "wrap",
						alignContent: "flex-start",
						px: `12px`,
						paddingTop: `${topbarSize.height + 10}px`,
					}}
				>
					{catalog.map((o) => (
						<Card key={o.ids[0]} ref={lastItemRef}>
							<img
								style={{
									width: "100%",
									height: "100%",
									objectFit: "fill",
								}}
								alt="no content"
								src={o.poster}
								onError={(e) => {
									// TODO placeholder
									e.currentTarget.style.display = "none"
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
	shouldForwardProp: (prop) => prop !== "hoverable",
})<{ hoverable?: boolean }>(({ theme, hoverable = true }) => ({
	width: "152px",
	height: "238px",
	gap: 0,
	paddingBlock: 0,
	overflow: "hidden",
	transition: "all 0.2s ease-in-out",
	...(hoverable && {
		"&:hover": {
			transform: "scale(1.05)",
			boxShadow: theme.shadows[4],
			border: `1px solid ${theme.palette.primary.main}`,
		},
	}),
}))
