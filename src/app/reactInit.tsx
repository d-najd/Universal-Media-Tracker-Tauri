import { useAppReactInit } from '@/lib/init/useAppinit'
import { useEffect } from 'react'

type Props = {
	initializedCallback: () => void
}

/**
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
