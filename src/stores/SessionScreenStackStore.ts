import ScreenState from '@/stores/ScreenState'
import { create } from 'zustand/react'

const SESSION_STORAGE_KEY = 'Screen-Store'

export const useScreenStore = create<SessionScreenStackStore>()((set, get) => ({
	screens: [],

	push: (state: ScreenState): void => {
		set((s) => ({
			screens: [...s.screens, state]
		}))
		get().save()
	},
	pop: (): ScreenState => {
		const lastScreen = get().screens.at(-1)!

		set((s) => ({
			screens: s.screens.slice(0, -1)
		}))
		get().save()

		return lastScreen
	},
	load: (): void => {
		const saved = sessionStorage.getItem(SESSION_STORAGE_KEY)
		if (saved) {
			const saveData: SessionScreenStackStoreData = JSON.parse(saved)
			set({ screens: saveData.screens })
		}
	},
	save: (): void => {
		const saveData: SessionScreenStackStoreData = {
			screens: get().screens
		}
		sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(saveData))
	}
}))

export interface SessionScreenStackStore extends SessionScreenStackStoreData {
	screens: ScreenState[]
	push(state: ScreenState): void
	pop(): ScreenState
	load(): void
	save(): void
}

interface SessionScreenStackStoreData {
	screens: ScreenState[]
}
