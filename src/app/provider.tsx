import { ReactNode, Suspense } from 'react'

export default function AppProvider({ children }: { children: ReactNode }) {
	return <Suspense fallback={<>Loading...</>}>{children}</Suspense>
}
