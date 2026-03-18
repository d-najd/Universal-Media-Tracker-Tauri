import { useEffect, useState } from 'react'

function useWindowSize() {
	const [size, setSize] = useState({
		width: window.innerWidth,
		height: window.innerHeight
	})

	useEffect(() => {
		const handleResize = () => {
			setSize({
				width: window.innerWidth,
				height: window.innerHeight
			})
		}

		handleResize() // initial measurement

		window.addEventListener('resize', handleResize)
		return () => window.removeEventListener('resize', handleResize)
	}, [])

	return size
}
