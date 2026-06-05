import { alpha, BottomNavigation, BottomNavigationAction } from '@mui/material'
import { Explore, Extension, Home, Settings } from '@mui/icons-material'

export default function NavigationBar() {
	return (
		<BottomNavigation
			showLabels
			sx={{
				position: 'fixed',
				bottom: 0,
				left: 0,
				right: 0,
				zIndex: 100,
				bgcolor: (theme) =>
					alpha(theme.palette.background.default, 0.8),
				backdropFilter: 'blur(8px)',
			}}
		>
			<BottomNavigationAction label="Library" icon={<Home />} />
			<BottomNavigationAction label="Discover" icon={<Explore />} />
			<BottomNavigationAction label="Plugins" icon={<Extension />} />
			<BottomNavigationAction label="Settings" icon={<Settings />} />
		</BottomNavigation>
	)
}
