import './global.css'

import AppRouter from '@/app/router'
import AppProvider from '@/app/provider'
import { useEffect } from 'react'

import * as React from 'react'
import * as ReactDOM from 'react-dom'
import * as LucideReact from 'lucide-react'
import * as RadixUi from 'radix-ui'
import * as MelancholySdk from '@d-najd/universal-media-tracker-sdk'
import * as ReactRouterDom from 'react-router-dom'

// Expose to window for dynamic plugins
;(window as any).React = React
;(window as any).ReactDOM = ReactDOM
;(window as any).LucideReact = LucideReact
;(window as any).RadixUi = RadixUi
;(window as any).MelancholySdk = MelancholySdk
;(window as any).ReactRouterDom = ReactRouterDom

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
