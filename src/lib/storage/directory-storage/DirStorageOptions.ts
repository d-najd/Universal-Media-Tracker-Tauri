import StorageOptions from "../StorageOptions"

type DirStorageOptions = StorageOptions & {}

// Policy is undefined because if it is, it checks across all available policies
export const DefaultDirStorageOptions = (): Partial<DirStorageOptions> => ({
	backend: "indexeddb",
	profile: "default",
	createdAt: Date.now(),
	updatedAt: Date.now(),
})

export default DirStorageOptions
