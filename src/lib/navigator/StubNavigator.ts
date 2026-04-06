import {
	Navigator as SDKNavigator,
	NavigatorEntry
} from '@d-najd/universal-media-tracker-sdk'

export default class StubNavigator implements SDKNavigator {
	screens: NavigatorEntry[] = []

	pop(): void {}

	push(path: string): void {}

	replace(path: string): void {}
}
