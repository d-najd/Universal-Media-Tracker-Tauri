import { useLibraryScreenState } from '../library/LibraryScreenState'
import { useNavigate } from 'react-router'

export default function TestPage() {
	const { counter, increase } = useLibraryScreenState()
	const navigator = useNavigate()

	return (
		<>
			<div>{counter}</div>
			<div>Hello</div>
			<button onClick={() => increase(1)}>Counter</button>
			<button onClick={() => navigator(-1)}>Click</button>
		</>
	)
}
