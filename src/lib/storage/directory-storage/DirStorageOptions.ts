import StorageOptions from "../StorageOptions"

type DirStorageOptions = StorageOptions & {}

// If policy is undefined it checks across all policies
export const DefaultDirStorageOptions = (): Partial<DirStorageOptions> => ({
	backend: "indexeddb",
	profile: "default",
	createdAt: Date.now(),
	updatedAt: Date.now(),
	driver: "directory-storage",
})

export default DirStorageOptions
