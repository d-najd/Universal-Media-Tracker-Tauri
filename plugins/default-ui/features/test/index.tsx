import { useNavigate } from 'react-router-dom'
import { useLibraryScreenState } from '../library/LibraryScreenState'

export default function TestPage() {
	const navigate = useNavigate()
	const { counter, increase } = useLibraryScreenState()

	return (
		<>
			<div>{counter}</div>
			<div>Hello1</div>
			<button onClick={() => increase(1)}>Counter</button>
			<button onClick={() => navigate(-1)}>Click</button>
		</>
	)
}
