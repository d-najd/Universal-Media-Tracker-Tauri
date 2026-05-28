import { useEffect, useLayoutEffect, useState } from 'react'
import { Button } from '../../components/button'
import {
	Filter,
	LayoutGrid,
	LibraryBig,
	MoreVertical,
	Search,
	Settings,
} from 'lucide-react'
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from '../../components/input-group'
import { useElementSize } from '../../hooks/useElementSize'
import LibraryGrid from './components/libraryGrid'
import { Navigator } from '@d-najd/universal-media-tracker-sdk'
import { useNavigate } from 'react-router-dom'

type Props = {
	navigator: Navigator
}

export default function LibraryContent(args: Props) {
	const [topbarSearchPadding, setTopbarSearchPadding] = useState<number>(0)
	const [search, setSearch] = useState('')
	const [debouncedSearch, setDebouncedSearch] = useState('')
	const navigate = useNavigate()

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
		<div>
			<div
				ref={topbarRef}
				className={
					'fixed top-0 left-0 w-full flex items-center bg-background/80 backdrop-blur-md px-2.5 py-2 z-50'
				}
			>
				<div
					className="flex-1 flex justify-center min-w-20"
					style={{
						paddingLeft: topbarSearchPadding,
					}}
				>
					<InputGroup
						style={{
							maxWidth: topbarSearchMaxWidthPx,
						}}
					>
						<InputGroupInput
							placeholder={'Search'}
							value={search}
							onChange={(o) => setSearch(o.target.value)}
						></InputGroupInput>
						<InputGroupAddon align={'inline-end'}>
							<Search />
						</InputGroupAddon>
					</InputGroup>
				</div>
				<div
					ref={topBarIconsRef}
					className="flex-none flex items-center px-0.5"
				>
					<div className="px-0.5" />
					<Button
						onClick={() => {
							navigate('/test')
						}}
						variant={'ghost'}
					>
						<LibraryBig />
					</Button>
					<Button variant={'ghost'}>
						<Filter />
					</Button>
					<Button variant={'ghost'}>
						<Settings />
					</Button>
					<Button variant={'ghost'}>
						<LayoutGrid />
					</Button>
					<Button variant={'ghost'}>
						<MoreVertical />
					</Button>
				</div>
			</div>
			<LibraryGrid topbarSize={topbarSize} search={debouncedSearch} />
		</div>
	)
}
