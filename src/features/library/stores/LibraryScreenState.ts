import ScreenState from '@/stores/ScreenState'
import { create } from 'zustand/react'

export const useScreenStore = create<LibraryScreenState>()((set, get) => ({
	path: '/library'
}))

export interface LibraryScreenState extends ScreenState {}
