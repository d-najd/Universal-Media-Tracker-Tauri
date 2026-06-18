import StorageBackend from "./StorageBackend"
import StoragePolicy from "./StoragePolicy"

type StorageOptions = {
	/**
	 * If defined will use the specific backend otherwise will try to pick the best backend available
	 */
	backend: StorageBackend
	/**
	 * default: "cache"
	 *
	 * Each stored entry must have one but when passing this field to [DirStorage] if undefined it defaults to "cache"
	 */
	policy: StoragePolicy
	/**
	 * default: "default"
	 */
	profile: string
	createdAt: number
	updatedAt: number
	/**
	 * Time to live
	 */
	ttl?: number
	custom?: Record<string, string>
}

export default StorageOptions
