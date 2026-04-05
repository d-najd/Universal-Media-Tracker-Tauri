import ScreenState from '@/stores/ScreenState'
import { create } from 'zustand'

export const useScreenStore = create<ScreenStackStore>()((set, get) => ({
	screens: [],

	push: (state: ScreenState): void => {
		set((s) => ({
			screens: [...s.screens, state]
		}))
	},
	pop: (): ScreenState => {
		const lastScreen = get().screens.at(-1)!

		set((s) => ({
			screens: s.screens.slice(0, -1)
		}))

		return lastScreen
	},
	replace(state: ScreenState): void {
		set((s) => ({
			screens: [...s.screens.slice(0, -1), state]
		}))
	}
}))

export interface ScreenStackStore extends SessionScreenStackStoreData {
	screens: ScreenState[]
	push(state: ScreenState): void
	pop(): ScreenState
	replace(state: ScreenState): void
	// load(): void
	// save(): void
}

interface SessionScreenStackStoreData {
	screens: ScreenState[]
}

// defineUiScreenHandler({
// 	path: '/library/:id',
// 	callback: (args) => {
// 		const path = args.state.path // library/1
//      // Will be created something like navigator.create(args.state /* reference to the state */ )
// 		args.navigator.push('/library/2') // go to library 2
//
// 	}
// })
