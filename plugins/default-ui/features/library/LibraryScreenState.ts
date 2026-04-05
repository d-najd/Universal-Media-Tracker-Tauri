import { create } from 'zustand'

export interface LibraryScreenState {
	counter: number
	increase: (by: number) => void
}

export const useLibraryScreenState = create<LibraryScreenState>()(
	(set, get) => ({
		counter: 0,
		increase: (by) => set((state) => ({ counter: state.counter + by }))
	})
)
