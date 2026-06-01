import {
	Collections,
	Dashboard,
	Explore,
	FilterAlt,
	MoreVert,
} from '@mui/icons-material'
import { Box, createTheme, IconButton, ThemeProvider } from '@mui/material'
import { useEffect, useState } from 'react'
import plugin from '../..'

import { green, purple } from '@mui/material/colors'
import TopBar from '../../components/topbar'
import LibraryGrid from './components/libraryGrid'

// Create dark theme
const darkTheme = createTheme({
	cssVariables: true,
	shape: {
		borderRadius: '12px',
	},
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

export default function LibraryPage() {
	const [search, setSearch] = useState('')
	const [topbarSize, setTopbarSize] = useState<{
		width: number
		height: number
	}>({ width: 0, height: 0 })
	const [debouncedSearch, setDebouncedSearch] = useState('')

	useEffect(() => {
		const timeout = setTimeout(() => {
			setDebouncedSearch(search)
		}, 300)

		return () => clearTimeout(timeout)
	}, [search])

	return (
		<ThemeProvider theme={darkTheme}>
			<TopBar
				search={search}
				onSearchChanged={setSearch}
				onTopbarSizeChanged={setTopbarSize}
				iconButtons={
					<>
						<Box sx={{ px: 0.5 }} />
						<IconButton
							onClick={() => {
								plugin.app.ui.navigator.push('/test')
							}}
						>
							{/* Whether to select library? */}
							<Collections />
						</IconButton>
						<IconButton>
							{/* Sorting/filtering, by category etc  */}
							<FilterAlt />
						</IconButton>
						<IconButton>
							{/* Extensions, search by source */}
							<Explore />
						</IconButton>
						<IconButton>
							{/* How to display the current screen, view options? */}
							<Dashboard />
						</IconButton>
						<IconButton>
							{/* Settings etc  */}
							<MoreVert />
						</IconButton>
					</>
				}
			>
				<LibraryGrid topbarSize={topbarSize} search={debouncedSearch} />
			</TopBar>
		</ThemeProvider>
	)
}
