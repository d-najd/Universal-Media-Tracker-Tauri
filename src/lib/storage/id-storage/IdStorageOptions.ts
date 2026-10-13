import StorageOptions from "../StorageOptions"

type IdStorageOptions = StorageOptions & {
	/** Default is .bin */
	fileExtension?: string
	/**
	 * defines the mode of updating the id's, lets say we had A, B as id's before and we pass A C
	 * merge - results in ->  A, B, C
	 * replace - results in -> A, C
	 */
	idsMode?: "merge" | "replace"
}

// If policy is undefined it checks across all policies
export const DefaultIdStorageOptions = (): Partial<IdStorageOptions> => ({
	backend: "indexeddb", // Unsure what to put here so leave this?
	profile: "default",
	createdAt: Date.now(),
	updatedAt: Date.now(),
	fileExtension: "bin",
})

export default IdStorageOptions
