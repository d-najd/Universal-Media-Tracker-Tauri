import plugin from '../..'
import { useLibraryScreenState } from '../library/LibraryScreenState'

export default function TestPage() {
	const { counter, increase } = useLibraryScreenState()

	return (
		<>
			<div>{counter}</div>
			<div>Hello</div>
			<button onClick={() => increase(1)}>Counter</button>
			<button onClick={() => plugin.app.ui.navigator.pop()}>Click</button>
		</>
	)
}
