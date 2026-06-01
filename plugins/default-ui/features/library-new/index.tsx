import { useEffect, useLayoutEffect, useState } from 'react'
import { Button } from '../../components/button'
import {
	Box,
	Checkbox,
	createTheme,
	IconButton,
	InputAdornment,
	TextField,
	ThemeProvider,
} from '@mui/material'
import {
	Search,
	Collections,
	Settings,
	MoreVert,
	FilterAlt,
	Dashboard,
} from '@mui/icons-material'
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from '../../components/input-group'
import { useElementSize } from '../../hooks/useElementSize'
import plugin from '../..'
import { alpha } from '@mui/material/styles'

import { green, purple } from '@mui/material/colors'
import LibraryGrid from '../library/components/libraryGrid'

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

export function LibraryNewPage() {
	const [topbarSearchPadding, setTopbarSearchPadding] = useState<number>(0)
	const [search, setSearch] = useState('')
	const [debouncedSearch, setDebouncedSearch] = useState('')

	const { ref: topbarRef, size: topbarSize } =
		useElementSize<HTMLDivElement>()

	const { ref: topBarIconsRef, size: topBarIconsSize } =
		useElementSize<HTMLDivElement>()

	useEffect(() => {
		const timeout = setTimeout(() => {
			setDebouncedSearch(search)
		}, 300)

		return () => clearTimeout(timeout)
	}, [search])

	const topbarSearchMaxWidthPx = 480
	useLayoutEffect(() => {
		setTopbarSearchPadding(
			Math.max(
				0,
				Math.min(
					topBarIconsSize.width,
					window.innerWidth -
						(topbarSearchMaxWidthPx + topBarIconsSize.width),
				),
			),
		)
	})

	return (
		<ThemeProvider theme={darkTheme}>
			<Box>
				<Box
					ref={topbarRef}
					sx={{
						position: 'fixed',
						top: 0,
						left: 0,
						width: '100%',
						display: 'flex',
						alignItems: 'center',
						bgcolor: (theme) =>
							alpha(theme.palette.background.default, 0.8),
						backdropFilter: 'blur(8px)',
						px: '10px',
						py: 0.75,
						zIndex: 50,
					}}
				>
					<Box
						sx={{
							flex: 1,
							display: 'flex',
							justifyContent: 'center',
							minWidth: 80,
							paddingLeft: `${topbarSearchPadding}px`,
						}}
					>
						<TextField
							placeholder="Search"
							value={search}
							onChange={(o) => setSearch(o.target.value)}
							variant="outlined"
							size="small"
							sx={{
								maxWidth: `${topbarSearchMaxWidthPx}px`,
								width: '100%',
							}}
							slotProps={{
								input: {
									endAdornment: (
										<InputAdornment position="end">
											<Search />
										</InputAdornment>
									),
								},
							}}
						/>
					</Box>
					<Box
						ref={topBarIconsRef}
						sx={{
							flex: 'none',
							display: 'flex',
							alignItems: 'center',
							px: 0.5,
						}}
					>
						<Box sx={{ px: 0.5 }} />
						<IconButton
							onClick={() => {
								plugin.app.ui.navigator.push('/test')
							}}
						>
							<Collections />
						</IconButton>
						<IconButton>
							<FilterAlt />
						</IconButton>
						<IconButton>
							<Settings />
						</IconButton>
						<IconButton>
							<Dashboard />
						</IconButton>
						<IconButton>
							<MoreVert />
						</IconButton>
					</Box>
				</Box>
				<LibraryGrid topbarSize={topbarSize} search={debouncedSearch} />
			</Box>
		</ThemeProvider>
	)
}
