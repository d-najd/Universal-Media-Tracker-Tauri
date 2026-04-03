import ScreenState from '@/stores/ScreenState'

export default abstract class ScreenStackStore {
	protected screens: ScreenState[] = []

	push(screenState: ScreenState): void {
		this.screens.push(screenState)
	}

	pop(): ScreenState {
		return this.screens.pop()!
	}

	current(): ScreenState {
		return this.screens[-1]
	}

	getStack(): ScreenState[] {
		return this.screens
	}
}
