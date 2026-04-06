import ScreenState from '@/stores/ScreenState'
import { create } from 'zustand'

function createScreenState<T extends ScreenState>(path: string) {
	return create<T>()(
		(set, get) =>
			({
				path: path,
			}) as T,
	)
}

//
// export const useLibraryScreenState = create<LibraryScreenState>()(
// 	(set, get) => ({
// 		path: '/library'
// 	})
// )
