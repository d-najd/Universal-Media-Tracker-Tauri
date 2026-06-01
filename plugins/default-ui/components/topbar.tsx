import { Search } from '@mui/icons-material'
import { alpha, Box, InputAdornment, TextField } from '@mui/material'
import { useEffect, useLayoutEffect, useState } from 'react'
import { useElementSize } from '../hooks/useElementSize'

type Props = {
	search: string
	onSearchChanged: (text: string) => void
	onTopbarSizeChanged?: ({
		width,
		height,
	}: {
		width: number
		height: number
	}) => void
	iconButtons: React.ReactNode
	children: React.ReactNode
}

export default function TopBar({
	search,
	onSearchChanged,
	onTopbarSizeChanged,
	iconButtons,
	children,
}: Props) {
	const [topbarSearchPadding, setTopbarSearchPadding] = useState<number>(0)
	const { ref: topbarRef, size: topbarSize } =
		useElementSize<HTMLDivElement>()

	const { ref: topBarIconsRef, size: topBarIconsSize } =
		useElementSize<HTMLDivElement>()

	useEffect(() => {
		if (onTopbarSizeChanged) {
			onTopbarSizeChanged(topbarSize)
		}
	}, [topbarSize])

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
						onChange={(o) => onSearchChanged(o.target.value)}
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
					{iconButtons}
				</Box>
			</Box>
			{children}
		</Box>
	)
}
