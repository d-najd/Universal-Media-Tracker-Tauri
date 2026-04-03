import ScreenStackStore from '@/stores/ScreenStackStore'
import { makeAutoObservable, toJS } from 'mobx'
import ScreenState from '@/stores/ScreenState'

export default class SessionScreenStackStore
	extends ScreenStackStore
	implements UpdateableScreenStore
{
	SESSION_STORAGE_KEY = 'Screen-Stack-Trace'

	constructor() {
		super()
		makeAutoObservable(this)
		this.load()
	}

	override push(screenState: ScreenState) {
		super.push(screenState)
		this.save()
	}

	override pop(): ScreenState {
		const popped = super.pop()
		this.save()
		return popped
	}

	save(): void {
		const data = this.screens.map((o) => toJS(o))
		sessionStorage.setItem(this.SESSION_STORAGE_KEY, JSON.stringify(data))
	}
	load(): void {
		const dataStr = sessionStorage.getItem(this.SESSION_STORAGE_KEY)
		if (!dataStr) return

		this.screens = JSON.parse(dataStr) as ScreenState[]
	}
}
