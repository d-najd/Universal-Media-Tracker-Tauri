import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/app'
import { ErrorBoundary } from 'react-error-boundary'

import { createTheme, ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { green, purple } from '@mui/material/colors'

// Create dark theme
const darkTheme = createTheme({
	cssVariables: true,
	palette: {
		primary: {
			main: purple[500],
		},
		secondary: {
			main: green[500],
		},
		mode: 'dark',
	},
})

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
	<React.StrictMode>
		<ErrorBoundary fallback={<>Error boundary?</>}>
			<ThemeProvider theme={darkTheme}>
				<App />
			</ThemeProvider>
		</ErrorBoundary>
	</React.StrictMode>,
)
