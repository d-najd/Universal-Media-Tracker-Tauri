import DirStorage from "./DirStorage"
import DirEntry from "@/lib/storage/directory-storage/DirEntry"
import { IDBPDatabase, openDB } from "idb"
import DirStorageOptions, {
	DefaultDirStorageOptions,
} from "./DirStorageOptions"
import StoragePolicy from "../StoragePolicy"
import StoredData from "../StoredData"
import assert from "assert"
import IndexedDbDirStorage from "./IndexedDbDirStorage"

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

	private static toKey(
		path: string,
		policy: StoragePolicy,
		profile: string,
	): string {
		return `${profile}/${policy}/${path}`
	}

	private static resolveOptions(
		options?: Partial<DirStorageOptions>,
	): Partial<DirStorageOptions> {
		assert(
			!options?.backend || options.backend === "indexeddb",
			`Backend mismatch: ${IDBDirStorage.name} is not "${options?.backend}"`,
		)

		return {
			...DefaultDirStorageOptions(),
			...options,
			backend: "indexeddb",
		}
	}

	/**
	 * TODO this can easily be cached, just needs to check on modifications (there is listener available) and the current profile
	 *
	 * @param profile is [DirStorageOptions.profile]
	 */
	private async getAvailablePolicies(profile: string): Promise<string[]> {
		const keys = (await this.db.getAllKeys(this.storeName)) as string[]
		const prefix = profile + "/"
		const entries: string[] = []

		for (const key of keys) {
			if (!key.startsWith(prefix)) continue
			const remainder = key.slice(prefix.length)
			const parts = remainder.split("/")
			const name = parts[0]

			if (!entries.includes(name) && parts.length === 1) {
				entries.push(name)
			}
		}

		return entries
	}

	/**
	 * TODO handle if this exists but metadata doesn't in that case either regenerate metadata or delete if impossible
	 */
	async readN(
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

			if (val) return val
		}
		throw new Error(`File not found: ${path} with options ${options}`)
	}

	private static toMetaEntryKey(
		path: string,
		policy: StoragePolicy,
		profile: string,
	): string {
		return `${profile}/${policy}/.meta/dir-storage/entries/${path}`
	}

	/**
	 * TODO handle if metadata exists but file doesn't in that case remove metadata
	 */
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

		for (const policy of policies) {
			const key = IDBDirStorage.toMetaEntryKey(
				path,
				policy as StoragePolicy,
				optionsResolved.profile!,
			)
			const val = await this.db.get(this.storeName, key)
			if (val) return val
		}
		throw new Error(`Metadata not found: ${path} with options ${options}`)
	}

	async read(path: string): Promise<string> {
		if (!this.isFile(path)) {
			throw new Error(`Path must include file extension: ${path}`)
		}
		const val = await this.db.get(this.storeName, path)
		if (val === undefined) throw new Error(`File not found: ${path}`)
		return val
	}

	async writeN(
		path: string,
		data: StoredData,
		options?: Partial<DirStorageOptions>,
	) {
		if (!this.isFile(path)) {
			throw new Error(`Path must include file extension: ${path}`)
		}
	}

	async write(path: string, data: string): Promise<void> {
		if (!this.isFile(path)) {
			throw new Error(`Path must include file extension: ${path}`)
		}
		await this.db.put(this.storeName, data, path)
	}

	async deleteN(path: string, options?: Partial<DirStorageOptions>) {
		if (this.isFile(path)) {
			await this.deleteFile(path, options)
		} else {
			await this.deleteFolder(path, options)
		}
	}

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

		await Promise.all(
			policies.map(async (policy) => {
				const key = IDBDirStorage.toKey(
					path,
					policy as StoragePolicy,
					optionsResolved.profile!,
				)
				const metaKey = IDBDirStorage.toMetaEntryKey(
					path,
					policy as StoragePolicy,
					optionsResolved.profile!,
				)

				await Promise.all([
					this.db.delete(this.storeName, key),
					this.db.delete(this.storeName, metaKey),
				])
			}),
		)
	}

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
		const prefix = path.endsWith("/") ? path : path + "/"

		await Promise.all(
			keys.map(async (key) => {
				for (const policy of policies) {
					const compareKey = IDBDirStorage.toKey(
						prefix,
						policy as StoragePolicy,
						optionsResolved.profile!,
					)
					if (!key.startsWith(compareKey)) continue

					await this.db.delete(this.storeName, key)
				}
			}),
		)
	}

	async delete(path: string): Promise<void> {
		if (this.isFile(path)) {
			await this.db.delete(this.storeName, path)
			return
		}

		const keys = (await this.db.getAllKeys(this.storeName)) as string[]
		const prefix = path.endsWith("/") ? path : path + "/"
		const toDelete = keys.filter((k) => k.startsWith(prefix))
		toDelete.forEach((o) => this.db.delete(this.storeName, o))
	}

	async deleteAll() {
		const keys = (await this.db.getAllKeys(this.storeName)) as string[]
		keys.forEach((o) => this.db.delete(this.storeName, o))
	}

	/**
	 * @param options if defined [options.policy] will search only in that policy
	 * Lists all files and directories in directory, similar to the command ls, if undefined searches in all policies
	 */
	async listN(
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
		const prefix = path.endsWith("/") ? path : path + "/"
		const entriesMap: Record<string, DirEntry> = {}

		for (const policy of policies) {
			for (const key of keys) {
				const fullPath = IDBDirStorage.toKey(
					prefix,
					policy as StoragePolicy,
					optionsResolved.profile!,
				)
				if (!key.startsWith(fullPath)) continue
				if (key.startsWith(fullPath + ".meta/")) continue // Don't add meta folder unless explicitly specified

				const remainder = key.slice(prefix.length)
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

	async list(path: string): Promise<DirEntry[]> {
		if (this.isFile(path)) {
			throw new Error(`Unable to list from a file ${path}`)
		}
		const keys = (await this.db.getAllKeys(this.storeName)) as string[]
		const prefix = path.endsWith("/") ? path : path + "/"
		const entriesMap: Record<string, DirEntry> = {}

		for (const key of keys) {
			if (!key.startsWith(prefix)) continue
			const remainder = key.slice(prefix.length)
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

		return Object.values(entriesMap)
	}

	private isFile(path: string) {
		const last = path.split("/").pop()!
		return last.includes(".")
	}
}
