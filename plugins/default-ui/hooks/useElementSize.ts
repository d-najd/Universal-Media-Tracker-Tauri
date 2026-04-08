import { useState, useEffect, useRef } from 'react'

export function useElementSize<T extends HTMLElement>() {
	const ref = useRef<T>(null)
	const [size, setSize] = useState({ width: 0, height: 0 })

	useEffect(() => {
		const measure = () => {
			if (ref.current) {
				setSize({
					width: ref.current.offsetWidth,
					height: ref.current.offsetHeight,
				})
			}
		}

		measure() // initial measurement

		window.addEventListener('resize', measure)
		return () => window.removeEventListener('resize', measure)
	}, [])

	return { ref, size }
}
