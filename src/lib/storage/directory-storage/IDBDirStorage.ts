import DirEntry from "@/lib/storage/directory-storage/DirEntry"
import { IDBPDatabase, openDB } from "idb"
import DirStorageOptions, {
	DefaultDirStorageOptions,
} from "./DirStorageOptions"
import StoragePolicy from "../StoragePolicy"
import StoredData from "../StoredData"
import assert from "assert"
import DirStorageNew from "./DirStorageNew"

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

			if (val) return val
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

		for (const policy of policies) {
			const key = IDBDirStorage.toMetaEntryKey(
				path,
				policy as StoragePolicy,
				optionsResolved.profile!,
			)
			const val = await this.db.get(this.storeName, key)
			if (val) return JSON.parse(val)
		}
		throw new Error(`Metadata not found: ${path} with options ${options}`)
	}

	async write(
		path: string,
		data: StoredData,
		options?: Partial<DirStorageOptions>,
	) {
		if (!this.isFile(path)) {
			throw new Error(`Path must include file extension: ${path}`)
		}

		// Delete old file
		await this.deleteFile(path, options)

		const optionsResolved = IDBDirStorage.resolveOptions(options)
		if (!optionsResolved.policy) {
			optionsResolved.policy = "cache"
		}
		const key = IDBDirStorage.toKey(
			path,
			optionsResolved.policy,
			optionsResolved.profile!,
		)
		const metaKey = IDBDirStorage.toMetaEntryKey(
			path,
			optionsResolved.policy,
			optionsResolved.profile!,
		)

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

	async deleteAll() {
		const keys = (await this.db.getAllKeys(this.storeName)) as string[]
		keys.forEach((o) => this.db.delete(this.storeName, o))
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

	private static toKey(
		path: string,
		policy: StoragePolicy,
		profile: string,
	): string {
		return `${profile}/${policy}/${path}`
	}

	private static toMetaEntryKey(
		path: string,
		policy: StoragePolicy,
		profile: string,
	): string {
		const jsonPath = `${path.split(".")[0]}.json`
		return `${profile}/${policy}/.meta/dir-storage/entries/${jsonPath}`
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

	private isFile(path: string) {
		const last = path.split("/").pop()!
		return last.includes(".")
	}
}
