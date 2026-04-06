import ScreenState from '@/stores/ScreenState'
import { create } from 'zustand'

export const useLibraryScreenState = create<LibraryScreenState>()(
	(set, get) => ({
		path: '/library',
	}),
)

export interface LibraryScreenState extends ScreenState {}
