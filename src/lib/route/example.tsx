import { useState } from 'react'

export default function ExampleContent() {
	const [example, setExample] = useState('Test')

	return (
		<>
			<p>{example}</p>
		</>
	)
}
