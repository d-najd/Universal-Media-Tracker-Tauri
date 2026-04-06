import Storage from './Storage'
import DirEntry from '@/lib/storage/DirEntry'
import { IDBPDatabase, openDB } from 'idb'

export default class IndexedDBStorage implements Storage {
	private constructor(
		private db: IDBPDatabase,
		private storeName: string,
	) {}

	static async create(dbName = 'db', storeName = 'store') {
		const db = await openDB(dbName, 1, {
			upgrade(db) {
				if (!db.objectStoreNames.contains(storeName)) {
					db.createObjectStore(storeName)
				}
			},
		})
		const inst = new IndexedDBStorage(db, storeName)
		// TODO for dev remove after done
		await inst.deleteAll()
		return inst
	}

	async read(path: string): Promise<string> {
		if (!this.isFile(path)) {
			throw new Error(`Path must include file extension: ${path}`)
		}
		const val = await this.db.get(this.storeName, path)
		if (val === undefined) throw new Error(`File not found: ${path}`)
		return val
	}

	async write(path: string, data: string): Promise<void> {
		if (!this.isFile(path)) {
			throw new Error(`Path must include file extension: ${path}`)
		}
		await this.db.put(this.storeName, data, path)
	}

	async delete(path: string): Promise<void> {
		if (this.isFile(path)) {
			await this.db.delete(this.storeName, path)
			return
		}

		const keys = (await this.db.getAllKeys(this.storeName)) as string[]
		const prefix = path.endsWith('/') ? path : path + '/'
		const toDelete = keys.filter((k) => k.startsWith(prefix))
		toDelete.forEach((o) => this.db.delete(this.storeName, o))
	}

	async deleteAll() {
		const keys = (await this.db.getAllKeys(this.storeName)) as string[]
		keys.forEach((o) => this.db.delete(this.storeName, o))
	}

	async list(path: string): Promise<DirEntry[]> {
		if (this.isFile(path)) {
			throw new Error(`Unable to list from a file ${path}`)
		}
		const keys = (await this.db.getAllKeys(this.storeName)) as string[]
		const prefix = path.endsWith('/') ? path : path + '/'
		const entriesMap: Record<string, DirEntry> = {}

		for (const key of keys) {
			if (!key.startsWith(prefix)) continue
			const remainder = key.slice(prefix.length)
			const parts = remainder.split('/')
			const name = parts[0]

			if (!entriesMap[name]) {
				entriesMap[name] = {
					name,
					path: prefix + name,
					type: parts.length > 1 ? 'directory' : 'file',
				}
			}
		}

		return Object.values(entriesMap)
	}

	private isFile(path: string) {
		const last = path.split('/').pop()!
		return last.includes('.')
	}
}
