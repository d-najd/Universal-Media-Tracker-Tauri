import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/app'
import { ErrorBoundary } from 'react-error-boundary'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<React.StrictMode>
		<ErrorBoundary fallback={<>Error boundary?</>}>
			<App />
		</ErrorBoundary>
	</React.StrictMode>,
)
