import './global.css'

import AppRouter from '@/app/router'
import AppProvider from '@/app/provider'
import { useEffect } from 'react'

export default function App() {
	useEffect(() => {
		document.documentElement.classList.add('dark')
	}, [])

	return (
		<AppProvider>
			<AppRouter />
		</AppProvider>
	)
}
