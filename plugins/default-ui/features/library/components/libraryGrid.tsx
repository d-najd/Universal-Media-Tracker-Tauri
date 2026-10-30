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
	const [catalog, setCatalog] = useState<MetaPreview[]>([])
	const [skip, setSkip] = useState(0)
	const [loading, setLoading] = useState(false)
	const [reachedCatalogEnd, setReachedCatalogEnd] = useState(false)

	const observer = useRef<IntersectionObserver | null>(null)
	const lastItemRef = useCallback(
		(node: HTMLDivElement | null) => {
			if (observer.current) observer.current.disconnect()
			if (loading) return
			observer.current = new IntersectionObserver((entries) => {
				if (entries[0].isIntersecting) {
					fetchCatalog()
				}
			})
			if (node) observer.current.observe(node)
		},
		[loading],
	)

	// TODO changing search is broken
	useEffect(() => {
		setReachedCatalogEnd(false)
		setCatalog([])
		setSkip(0)
		fetchCatalog().then()
	}, [search])

	const fetchCatalog = async () => {
		if (reachedCatalogEnd) return
		if (loading) return

		setLoading(true)
		const handler = plugin.app.plugin.getHandlersMatching(
			// (o) => o.id === 'kitsu-anime-rating'
			(o) => o.id === "kitsu-anime-list",
		)[0] as ResourceHandler<CatalogHandlerArgs, CatalogHandlerResponse>

		const hasSearchOption = handler?.options?.some(
			(o) => o.name === "search" && o.type === "string",
		)

		let args: ResourceHandlerArgs = {
			options: [
				...[{ name: "skip", input: skip }],
				...[{ name: "preferredPageSize", input: 20 }],
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

		setSkip((oldSkip) => result.data.length + oldSkip)

		setCatalog((prev) => {
			const prevIds = new Set(prev.flatMap((p) => p.ids))

			// Handling react strict...
			const filteredData = result.data.filter(
				(cur) => !cur.ids.some((id) => prevIds.has(id)),
			)

			return [...prev, ...filteredData]
		})

		setLoading(false)
	}

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
