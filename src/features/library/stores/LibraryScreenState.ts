import ScreenState from '@/stores/ScreenState'
import { create } from 'zustand/react'

export const useScreenStore = create<LibraryScreenState>()((set, get) => ({}))

export interface LibraryScreenState extends ScreenState {}
