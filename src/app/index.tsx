import './global.css'

import AppRouter from '@/app/router'
import AppProvider from '@/app/provider'
import { useEffect } from 'react'

import * as React from 'react'
import * as ReactDOM from 'react-dom'
import * as UniversalMediaTrackerSdk from '@d-najd/universal-media-tracker-sdk'
import * as LucideReact from 'lucide-react'
import * as RadixUi from 'radix-ui'

// Expose to window for dynamic plugins
;(window as any).React = React
;(window as any).ReactDOM = ReactDOM
;(window as any).UniversalMediaTrackerSdk = UniversalMediaTrackerSdk
;(window as any).LucideReact = LucideReact
;(window as any).RadixUi = RadixUi

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
