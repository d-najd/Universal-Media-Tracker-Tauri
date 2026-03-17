import { Input } from '@/components/ui/input'
import { useEffect } from 'react'

export default function LibraryContent() {
	useEffect(() => {}, [])

	return (
		<>
			<div>
				<Input />
			</div>
		</>
	)
}

/*

			<div className="absolute top-0 left-4 bg-blue-500">Box1</div>
			<div></div>

		<div className="bg-background/70 backdrop-blur-md border border-gray-200/50 dark:border-white/10 shadow-sm p-6">
			<Input id="input-button-group" placeholder="Type to search..." />
		</div>
 */
