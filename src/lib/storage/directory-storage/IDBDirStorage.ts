import {
	DefaultDirStorageOptions,
	DirEntry,
	DirStorage,
	DirStorageOptions,
	StoragePolicy,
	StoredData,
} from "@d-najd/universal-media-tracker-sdk"
import { IDBPDatabase, IDBPTransaction, openDB } from "idb"

// TODO make completely transactional
// TODO add tests to check whether there are race conditions for removing/writing something
export default class IDBDirStorage implements DirStorage {
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

		const key = IDBDirStorage.toKey(
			path,
			optionsResolved.policy,
			optionsResolved.profile!,
		)

		const metaKey = IDBDirStorage.keyToMetaEntryKey(key)

		const policies = await this.getAvailablePolicies(
			optionsResolved.profile!,
		)

		const tx = this.db.transaction(this.storeName, "readwrite")

		// Delete old file, policy is irrelevant, also removes metadata
		const prevPolicy = optionsResolved.policy
		optionsResolved.policy = undefined
		await this.deleteFile(path, optionsResolved, tx, policies)

		// TODO make sure that options aren't overriden when not necessary if there even is such case
		optionsResolved.policy = prevPolicy
		await Promise.all([
			tx.store.put(data, key),
			tx.store.put(JSON.stringify(optionsResolved), metaKey),
		])
		await tx.done
	}

	async delete(path: string, options?: Partial<DirStorageOptions>) {
		if (this.isFile(path)) {
			await this.deleteFile(path, options)
		} else {
			await this.deleteFolder(path, options)
		}
	}

	/**
	 * Removes file and metadata
	 * @param tx optional, used in contexts where deleting file is not the only operation executed (such as overriding file with the write method)
	 * @param policies must be passed if tx is defined
	 */
	private async deleteFile(
		path: string,
		options?: Partial<DirStorageOptions>,
		tx?: IDBPTransaction<unknown, [string], "readwrite">,
		allPolicies?: string[],
	) {
		if (!this.isFile(path)) {
			throw Error(`Trying to remove folder with path ${path}`)
		}

		const optionsResolved = IDBDirStorage.resolveOptions(options)

		if (tx && !allPolicies) {
			throw new Error("allPolicies must be passed if tx is defined")
		}

		const policies = options?.policy
			? [optionsResolved.policy!]
			: (allPolicies ??
				(await this.getAvailablePolicies(optionsResolved.profile!)))

		let foundPolicy: StoragePolicy | null = null

		for (const policy of policies) {
			const key = IDBDirStorage.toKey(
				path,
				policy as StoragePolicy,
				optionsResolved.profile!,
			)

			const count = tx
				? await tx.store.count(key)
				: await this.db.count(this.storeName, key)
			if (count > 0) {
				foundPolicy = policy as StoragePolicy
				break
			}
		}

		if (!foundPolicy) return

		const key = IDBDirStorage.toKey(
			path,
			foundPolicy,
			optionsResolved.profile!,
		)
		const metaKey = IDBDirStorage.keyToMetaEntryKey(key)

		if (tx) {
			tx.store.delete(key)
			tx.store.delete(metaKey)
		} else {
			const ownTx = this.db.transaction(this.storeName, "readwrite")
			await Promise.all([
				ownTx.store.delete(key),
				ownTx.store.delete(metaKey),
			])
			await ownTx.done
		}
	}

	// Removes files in folder and metadata associated with the files
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

		const keysToDelete = new Set<string>()

		for (const key of keys) {
			for (const [index, policy] of policies.entries()) {
				const compareKey = IDBDirStorage.toKey(
					prefix,
					policy as StoragePolicy,
					optionsResolved.profile!,
				)
				if (!key.startsWith(compareKey)) continue

				keysToDelete.add(key)

				if (index !== 0) continue // meta is policy independent I.E only one exists per policy, shouldn't change much here but just in case
				const metaKey = IDBDirStorage.keyToMetaEntryKey(key)
				keysToDelete.add(metaKey)
			}
		}

		if (keysToDelete.size === 0) return

		const tx = this.db.transaction(this.storeName, "readwrite")
		await Promise.all([...keysToDelete].map((k) => tx.store.delete(k)))
		await tx.done
	}

	async deleteAll() {
		await this.db.clear(this.storeName)
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
			...{ driver: "directory-storage-default" },
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
