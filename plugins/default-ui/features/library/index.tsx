import { Dashboard, FilterAlt, MoreVert } from '@mui/icons-material'
import { Box, createTheme, IconButton, ThemeProvider } from '@mui/material'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { green, purple } from '@mui/material/colors'
import TopBar from '../../components/topbar'
import LibraryGrid from './components/libraryGrid'
import NavigationBar from '../../components/navigationBar'

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
	const navigator = useNavigate()
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
			<Box sx={{ position: 'relative', minHeight: '100vh' }}>
				<TopBar
					search={search}
					onSearchChanged={setSearch}
					onTopbarSizeChanged={setTopbarSize}
					iconButtons={
						<>
							<Box sx={{ px: 0.5 }} />
							<IconButton>
								{/* Sorting/filtering, by category etc  */}
								<FilterAlt />
							</IconButton>
							<IconButton>
								{/* How to display the current screen, view options? */}
								<Dashboard />
							</IconButton>
							<IconButton
								onClick={() => {
									navigator('/test')
								}}
							>
								{/* Settings etc  */}
								<MoreVert />
							</IconButton>
						</>
					}
				>
					<LibraryGrid
						topbarSize={topbarSize}
						search={debouncedSearch}
					/>
				</TopBar>
				<NavigationBar />
			</Box>
		</ThemeProvider>
	)
}
