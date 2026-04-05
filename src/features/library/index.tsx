import React, {
	ReactElement,
	useEffect,
	useLayoutEffect,
	useState
} from 'react'
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput
} from '@/components/ui/input-group'
import { Filter, LayoutGrid, LibraryBig, Search } from 'lucide-react'
import { useElementSize } from '@/hooks/useElementSize'
import { Button } from '@/components/ui/button'
import LibraryGrid from '@/features/library/components/libraryGrid'
import {
	LibraryScreenState,
	useLibraryScreenState
} from '@/features/library/stores/LibraryScreenState'
import { StoreApi, UseBoundStore } from 'zustand'

export default function LibraryContent(): ReactElement {
	// const [state, setState] = useLibraryScreenState()
	const te: UseBoundStore<StoreApi<LibraryScreenState>> =
		useLibraryScreenState
	const me = te()

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
						(topbarSearchMaxWidthPx + topBarIconsSize.width)
				)
			)
		)
	})

	return (
		<>
			<div
				ref={topbarRef}
				className={
					'fixed top-0 left-0 w-full flex items-center bg-background/80 backdrop-blur-md px-2.5 py-2 z-50'
				}
			>
				<div
					className="flex-1 flex justify-center min-w-20"
					style={{
						paddingLeft: topbarSearchPadding
					}}
				>
					<InputGroup
						style={{
							maxWidth: topbarSearchMaxWidthPx
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
					<Button variant={'ghost'}>
						<LibraryBig />
					</Button>
					<Button variant={'ghost'}>
						<Filter />
					</Button>
					{/*<Button variant={'ghost'}>*/}
					{/*	<Settings />*/}
					{/*</Button>*/}
					<Button variant={'ghost'}>
						<LayoutGrid />
					</Button>
					{/*<Button variant={'ghost'}>*/}
					{/*	<MoreVertical />*/}
					{/*</Button>*/}
				</div>
			</div>
			<LibraryGrid topbarSize={topbarSize} search={debouncedSearch} />
		</>
	)
}

/*
		<div className="absolute top-0 left-4 bg-blue-500">Box1</div>
		<div></div>

		<div className="bg-background/70 backdrop-blur-md border border-gray-200/50 dark:border-white/10 shadow-sm p-6">
			<Input id="input-button-group" placeholder="Type to search..." />
		</div>
 */
