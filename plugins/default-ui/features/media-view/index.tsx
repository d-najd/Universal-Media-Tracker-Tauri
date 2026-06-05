import { useState, useEffect } from 'react'
import plugin from '../..'
import { match } from 'path-to-regexp'
import { ResourceHandler, Meta } from '@d-najd/universal-media-tracker-sdk'

export default function MediaViewPage() {
	const [meta, setMeta] = useState<Meta | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<Error | null>(null)

	useEffect(() => {
		async function fetchMetaData() {
			setLoading(true)
			setError(null)

			const curScreen = plugin.app.ui.navigator.screens.at(-1)
			if (!curScreen) {
				throw new Error('No screen found')
			}

			const pathMatched = match(curScreen.pattern)(curScreen.path)
			if (!pathMatched) {
				throw new Error('Path without id?')
			}

			const id = pathMatched.params.id as string

			// Initial meta object
			// Retrieve preview object from db on init
			let metaData: Partial<Meta> = {
				type: 'anime',
			} as Meta

			const mediaRequestHandlers = plugin.app.plugin
				.getHandlersMatching((o) => o.type === 'meta-request')
				.map((o) => o as ResourceHandler)
				.reverse()

			let succeeded = false
			for (const handler of mediaRequestHandlers) {
				try {
					const result = await handler.callback({
						metaId: id,
					})
					const data = result.data.at(0)
					metaData = {
						...metaData,
						...data,
					}
					succeeded = true
				} catch {
					console.log(
						`Handler ${handler.id} failed to fetch with id ${id}`,
					)
				}
			}

			if (succeeded) {
				setMeta(metaData as Meta)
			} else {
				setError(
					new Error(`All handlers failed to get data for id ${id}`),
				)
			}
			setLoading(false)
		}

		fetchMetaData()
	}, [])

	if (error) {
		return (
			<div>
				<p>Error: {error.message}</p>
				<button onClick={() => window.location.reload()}>Retry</button>
			</div>
		)
	}

	if (loading) {
		return (
			<div>
				<p>Loading media data...</p>
			</div>
		)
	}

	if (!meta) {
		return (
			<div>
				<p>No media data available</p>
			</div>
		)
	}

	return (
		<div className="media-view">
			<h1>{meta.name || 'Untitled'}</h1>
			{meta.poster && <img src={meta.poster} alt={meta.name} />}
			<p>Type: {meta.type}</p>
			<p>ID: {meta.id}</p>
		</div>
	)
}
