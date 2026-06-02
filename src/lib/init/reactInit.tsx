import { useAppReactInit } from '@/lib/init/useAppinit'
import { useEffect } from 'react'

type Props = {
	initializedCallback: () => void
}

/**
 * Needs to be loaded from there because the routes must be "initialized" before initializing react
 * Called from [useRouteStore]
 */
export default function ReactInit(props: Props) {
	const { initialized } = useAppReactInit()

	useEffect(() => {
		if (!initialized) return

		props.initializedCallback()
	}, [initialized])

	return <h1>Loading React</h1>
}
