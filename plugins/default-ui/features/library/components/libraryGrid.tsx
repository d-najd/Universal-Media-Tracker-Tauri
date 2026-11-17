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
	const skipRef = useRef(0)
	const loadingRef = useRef(false)
	const reachedCatalogEndRef = useRef(false)
	// Invalidates in-flight responses when the search changes mid-request.
	const epochRef = useRef(0)

	const fetchCatalog = useCallback(async () => {
		if (reachedCatalogEndRef.current) return
		if (loadingRef.current) return

		loadingRef.current = true
		const epoch = epochRef.current

		try {
			const handler = plugin.app.plugin.getHandlersMatching(
				(o) => o.id === "kitsu-anime-list",
			)[0] as ResourceHandler<CatalogHandlerArgs, CatalogHandlerResponse>

			const hasSearchOption = handler?.options?.some(
				(o) => o.name === "search" && o.type === "string",
			)

			const args: ResourceHandlerArgs = {
				options: [
					{ name: "skip", input: skipRef.current },
					{ name: "preferredPageSize", input: 20 },
					...(hasSearchOption && search !== ""
						? [{ name: "search", input: search }]
						: []),
				],
			}

			const result = (await handler.callback(
				args,
			)) as CatalogHandlerResponse

			// A newer search started while we awaited → discard this page.
			if (epoch !== epochRef.current) return

			if (result.data.length === 0) {
				reachedCatalogEndRef.current = true
				return
			}

			skipRef.current += result.data.length

			setCatalog((prev) => {
				const prevIds = new Set(prev.flatMap((p) => p.ids))
				// Handles React StrictMode double-invoke and any residual dupes.
				const filteredData = result.data.filter(
					(cur) => !cur.ids.some((id) => prevIds.has(id)),
				)
				return [...prev, ...filteredData]
			})
		} finally {
			// Only release the lock if we still own the current epoch.
			// If a newer search already reset it, don't clobber its state.
			if (epoch === epochRef.current) loadingRef.current = false
		}
	}, [search])

	// Stable handle so the IntersectionObserver always calls the latest
	// fetchCatalog (with the current `search`) without re-observing.
	const fetchCatalogRef = useRef(fetchCatalog)
	useEffect(() => {
		fetchCatalogRef.current = fetchCatalog
	}, [fetchCatalog])

	// Reset + first fetch on search change.
	useEffect(() => {
		epochRef.current += 1
		skipRef.current = 0
		loadingRef.current = false
		reachedCatalogEndRef.current = false
		setCatalog([])
		fetchCatalog()
	}, [fetchCatalog]) // == [search], via useCallback

	const observer = useRef<IntersectionObserver | null>(null)
	const lastItemRef = useCallback((node: HTMLDivElement | null) => {
		observer.current?.disconnect()
		if (!node) return
		observer.current = new IntersectionObserver((entries) => {
			if (entries[0].isIntersecting) fetchCatalogRef.current()
		})
		observer.current.observe(node)
	}, [])

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
