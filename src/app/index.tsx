import './global.css'

import AppRouter from '@/app/router'
import AppProvider from '@/app/provider'
import PluginManagerStore from '@/stores/pluginManagerStore'

export default function App() {
	const pluginManager = PluginManagerStore.


    return (
        <AppProvider>
            <AppRouter />
        </AppProvider>
    )
}
