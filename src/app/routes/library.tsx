import LibraryContent from '@/features/library'

export function Library() {
	return <LibraryContent />
}

// Necessary for react router to lazy load.
export const Component = Library
