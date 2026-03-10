import './global.css'

import AppRouter from '@/app/router'
import AppProvider from '@/app/provider'
import PluginManagerStore from '@/stores/pluginManagerStore'
import { useEffect } from 'react'

export default function App() {
	useEffect(() => {
		PluginManagerStore.init().then(r => {})
	}, [])

	useEffect(() => {
		document.documentElement.classList.add('dark')
	}, [])

    return (
        <AppProvider>
            <AppRouter />
        </AppProvider>
    )
}
