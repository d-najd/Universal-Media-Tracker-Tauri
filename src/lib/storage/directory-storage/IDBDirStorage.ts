import DirEntry from "@/lib/storage/directory-storage/DirEntry"
import { IDBPDatabase, openDB } from "idb"
import DirStorageOptions, {
	DefaultDirStorageOptions,
} from "./DirStorageOptions"
import StoragePolicy from "../StoragePolicy"
import StoredData from "../StoredData"
import DirStorageNew from "./DirStorageNew"

// TODO transactions are not used on deletion and other things I.E they aren't atomic
export default class IDBDirStorage implements DirStorageNew {
	private constructor(
		private db: IDBPDatabase,
		private storeName: string,
	) {}

	static async create(dbName = "db", storeName = "store") {
		const db = await openDB(dbName, 1, {
			upgrade(db) {
				if (!db.objectStoreNames.contains(storeName)) {
					db.createObjectStore(storeName)
				}
			},
		})
		const inst = new IDBDirStorage(db, storeName)
		// TODO for dev remove after done
		await inst.deleteAll()

		return inst
	}

	/**
	 * @param options if defined [options.policy] will search only in that policy
	 * Lists all files and directories in directory, similar to the command ls, if undefined searches in all policies
	 */
	async list(
		path: string,
		options?: Partial<DirStorageOptions>,
	): Promise<DirEntry[]> {
		if (this.isFile(path)) {
			throw new Error(`Unable to list from a file ${path}`)
		}

		const optionsResolved = IDBDirStorage.resolveOptions(options)
		const policies = options?.policy
			? [optionsResolved.policy!]
			: await this.getAvailablePolicies(optionsResolved.profile!)

		const keys = (await this.db.getAllKeys(this.storeName)) as string[]
		const prefix = this.getPrefix(path)
		const entriesMap: Record<string, DirEntry> = {}

		for (const policy of policies) {
			for (const key of keys) {
				const fullPath = IDBDirStorage.toKey(
					prefix,
					policy as StoragePolicy,
					optionsResolved.profile!,
				)
				if (!key.startsWith(fullPath)) continue

				const remainder = key.slice(fullPath.length)
				const parts = remainder.split("/")
				const name = parts[0]

				if (!entriesMap[name]) {
					entriesMap[name] = {
						name,
						path: prefix + name,
						type: parts.length > 1 ? "directory" : "file",
					}
				}
			}
		}

		return Object.values(entriesMap)
	}

	async read(
		path: string,
		options?: Partial<DirStorageOptions>,
	): Promise<StoredData> {
		if (!this.isFile(path)) {
			throw new Error(`Path must include file extension: ${path}`)
		}

		const optionsResolved = IDBDirStorage.resolveOptions(options)
		const policies = options?.policy
			? [optionsResolved.policy!]
			: await this.getAvailablePolicies(optionsResolved.profile!)

		for (const policy of policies) {
			const key = IDBDirStorage.toKey(
				path,
				policy as StoragePolicy,
				optionsResolved.profile!,
			)
			const val = await this.db.get(this.storeName, key)

			if (val !== undefined) return val
		}
		throw new Error(`File not found: ${path} with options ${options}`)
	}

	async readMetadata(
		path: string,
		options?: Partial<DirStorageOptions>,
	): Promise<DirStorageOptions> {
		if (!this.isFile(path)) {
			throw new Error(`Path must include file extension: ${path}`)
		}

		const optionsResolved = IDBDirStorage.resolveOptions(options)
		const policies = options?.policy
			? [optionsResolved.policy!]
			: await this.getAvailablePolicies(optionsResolved.profile!)

		const key = IDBDirStorage.toKey(
			path,
			policies[0] as StoragePolicy,
			optionsResolved.profile!,
		)
		const metaKey = IDBDirStorage.keyToMetaEntryKey(key)

		const error = new Error(
			`Metadata not found: ${path} with options ${options}`,
		)

		const val = await this.db.get(this.storeName, metaKey)
		if (val === undefined) throw error

		const parsed = (await JSON.parse(val)) as DirStorageOptions
		if (policies.some((o) => o === parsed.policy)) return parsed

		throw error
	}

	async write(
		path: string,
		data: StoredData,
		options?: Partial<DirStorageOptions>,
	) {
		if (!this.isFile(path)) {
			throw new Error(`Path must include file extension: ${path}`)
		}

		let optionsResolved: Partial<DirStorageOptions> = options ?? {}
		try {
			optionsResolved = {
				...(await this.readMetadata(path)),
				...options,
			}
		} catch {
			optionsResolved = IDBDirStorage.resolveOptions(optionsResolved)
		} finally {
			if (!optionsResolved.policy) {
				optionsResolved.policy = "cache"
			}
			optionsResolved.updatedAt = Date.now()
		}

		// Delete old file, policy irrelevant, also removes metadata
		await this.deleteFile(path)

		const key = IDBDirStorage.toKey(
			path,
			optionsResolved.policy,
			optionsResolved.profile!,
		)

		const metaKey = IDBDirStorage.keyToMetaEntryKey(key)
		// const metaKey = IDBDirStorage.toMetaEntryKey(
		// 	path,
		// 	optionsResolved.policy,
		// 	optionsResolved.profile!,
		// )

		await Promise.all([
			await this.db.put(this.storeName, data, key),
			await this.db.put(
				this.storeName,
				JSON.stringify(optionsResolved),
				metaKey,
			),
		])
	}

	async delete(path: string, options?: Partial<DirStorageOptions>) {
		if (this.isFile(path)) {
			await this.deleteFile(path, options)
		} else {
			await this.deleteFolder(path, options)
		}
	}

	// Removes file and metadata
	// TODO add test if file with same name exists but in different policy to check whether metadata is removed
	private async deleteFile(
		path: string,
		options?: Partial<DirStorageOptions>,
	) {
		if (!this.isFile(path)) {
			throw Error(`Trying to remove folder with path ${path}`)
		}

		const optionsResolved = IDBDirStorage.resolveOptions(options)
		const policies = options?.policy
			? [optionsResolved.policy!]
			: await this.getAvailablePolicies(optionsResolved.profile!)

		let foundPolicy: StoragePolicy | null = null

		for (const policy of policies) {
			const key = IDBDirStorage.toKey(
				path,
				policy as StoragePolicy,
				optionsResolved.profile!,
			)
			const count = await this.db.count(this.storeName, key)
			if (count > 0) {
				foundPolicy = policy as StoragePolicy
				break
			}
		}

		if (foundPolicy) {
			const key = IDBDirStorage.toKey(
				path,
				foundPolicy,
				optionsResolved.profile!,
			)
			const metaKey = IDBDirStorage.keyToMetaEntryKey(key)

			const tx = this.db.transaction(this.storeName, "readwrite")
			await Promise.all([tx.store.delete(key), tx.store.delete(metaKey)])
			await tx.done
		}
	}

	// Removes files in folder and metadata associated with the files
	// TODO add test if file with same name exists but in different policy to check whether metadata is removed
	private async deleteFolder(
		path: string,
		options?: Partial<DirStorageOptions>,
	) {
		if (this.isFile(path)) {
			throw Error(`Trying to remove file with path ${path}`)
		}

		const optionsResolved = IDBDirStorage.resolveOptions(options)
		const policies = options?.policy
			? [optionsResolved.policy!]
			: await this.getAvailablePolicies(optionsResolved.profile!)

		const keys = (await this.db.getAllKeys(this.storeName)) as string[]
		const prefix = this.getPrefix(path)

		// TODO add test whether saved metadata across multiple policies is removed properly
		await Promise.all(
			keys.map(async (key) => {
				for (const [index, policy] of policies.entries()) {
					const compareKey = IDBDirStorage.toKey(
						prefix,
						policy as StoragePolicy,
						optionsResolved.profile!,
					)
					if (!key.startsWith(compareKey)) continue

					// console.error(
					// 	"TESTINGGG " +
					// 		prefix +
					// 		" " +
					// 		policy +
					// 		" " +
					// 		optionsResolved.profile +
					// 		" " +
					// 		key +
					// 		" " +
					// 		IDBDirStorage.keyToMetaEntryKey(key),
					// )

					this.db.delete(this.storeName, key)

					if (index !== 0) continue // meta is policy independent I.E only one exists per policy, shouldn't change much here but just in case
					const metaKey = IDBDirStorage.keyToMetaEntryKey(key)
					this.db.delete(this.storeName, metaKey)
				}
			}),
		)
	}

	async deleteAll() {
		const keys = (await this.db.getAllKeys(this.storeName)) as string[]
		keys.forEach((o) => this.db.delete(this.storeName, o))
	}

	private static resolveOptions(
		options?: Partial<DirStorageOptions>,
	): Partial<DirStorageOptions> {
		if (options?.backend && options.backend !== "indexeddb") {
			throw new Error(
				`Backend mismatch: ${IDBDirStorage.name} is not "${options.backend}"`,
			)
		}

		return {
			...DefaultDirStorageOptions(),
			...options,
			backend: "indexeddb",
		}
	}

	private static toKey(
		path: string,
		policy: StoragePolicy,
		profile: string,
	): string {
		return `${profile}/${policy}/${path}`
	}

	// TODO rework
	private static toMetaEntryKey(path: string, profile: string): string {
		const parts = path.split("/")
		const jsonPath = parts.at(-1)
		// const jsonPath = `${path.split("/").at(-1).split(".")[0]}.json`
		return `${profile}/.meta/dir-storage/${path}/entries/${jsonPath}`
	}

	// Must contain path with policy otherwise it will give wrong path
	private static keyToMetaEntryKey(keyPath: string) {
		const parts = keyPath.split("/")
		const profile = parts[0]
		const path = parts.slice(2, -1).join("/")
		const jsonFile = `${parts.at(-1)?.split(".")[0]}.json`

		return `${profile}/.meta/dir-storage/${path}/entries/${jsonFile}`
	}

	/**
	 * This could easily be cached but it is probably not worth it to do so?
	 *
	 * @param profile is [DirStorageOptions.profile]
	 */
	private async getAvailablePolicies(profile: string): Promise<string[]> {
		const keys = (await this.db.getAllKeys(this.storeName)) as string[]
		const prefix = profile + "/"
		const entries: string[] = []

		for (const key of keys) {
			if (!key.startsWith(prefix)) continue
			if (key.startsWith(prefix + ".")) continue // Ignore hidden folders, they are probably metadata

			const remainder = key.slice(prefix.length)
			const parts = remainder.split("/")
			const name = parts[0]

			if (!entries.includes(name)) {
				entries.push(name)
			}
		}

		return entries
	}

	private isFile(path: string) {
		const last = path.split("/").pop()!
		return last.includes(".")
	}

	private getPrefix(path: string) {
		if (path === "") return path
		return path.endsWith("/") ? path : path + "/"
	}
}
