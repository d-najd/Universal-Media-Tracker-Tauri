import DirStorage from "../directory-storage/DirStorage"
import DirStorageOptions from "../directory-storage/DirStorageOptions"
import StoredData from "../StoredData"
import IdStorage from "./IdStorage"
import IdStorageOptions, { DefaultIdStorageOptions } from "./IdStorageOptions"

// TODO add tests to check whether there are race conditions for removing/writing something
export default class DirIdStorage implements IdStorage {
	private constructor(
		private dirStorage: DirStorage,
		private path: string,
	) {}

	/**
	 * @param path must not be metapath, ex .meta/media/movies
	 */
	static async create(dirStorage: DirStorage, path: string) {
		const inst = new DirIdStorage(dirStorage, path)
		return inst
	}

	async write(
		ids: string[],
		data: StoredData,
		options?: Partial<IdStorageOptions>,
	): Promise<void> {
		if (ids.length === 0) {
			throw new Error("No id's passed")
		}

		const optionsResolved = DirIdStorage.resolveOptions(options)
		const idIndexMap = await this.safeReadIdIndexMap(optionsResolved)

		const [docId] = DirIdStorage.resolveOrCreateDocId(
			ids,
			optionsResolved,
			idIndexMap,
		)

		const filePath = this.filePath(docId)

		for (const [existingId, existingDocId] of Object.entries(idIndexMap)) {
			if (existingDocId === docId) {
				delete idIndexMap[existingId]
			}
		}

		for (const id of ids) {
			idIndexMap[id] = docId
		}

		await this.dirStorage.write(filePath, data, optionsResolved)
		await this.writeIdIndexMap(idIndexMap, optionsResolved)
	}

	async addAliases(
		id: string,
		ids: string[],
		options?: Partial<IdStorageOptions>,
	): Promise<void> {
		if (ids.length === 0) return

		const optionsResolved = DirIdStorage.resolveOptions(options)
		const idIndexMap = await this.safeReadIdIndexMap(optionsResolved)

		const docId = this.lookupDocId(id, idIndexMap, optionsResolved)

		// Check for conflicts (if the new IDs already belong to another doc)
		for (const newId of ids) {
			const existingDocId = idIndexMap[newId]
			if (existingDocId && existingDocId !== docId) {
				throw new Error(
					`Cannot add ID "${newId}" because it already belongs to a different entry.`,
				)
			}
		}

		for (const newId of ids) {
			idIndexMap[newId] = docId
		}

		await this.writeIdIndexMap(idIndexMap, optionsResolved)
	}

	async removeAliases(
		id: string,
		ids: string[],
		options?: Partial<IdStorageOptions>,
	): Promise<void> {
		if (ids.length === 0) return

		const optionsResolved = DirIdStorage.resolveOptions(options)
		const idIndexMap = await this.safeReadIdIndexMap(optionsResolved)

		const docId = this.lookupDocId(id, idIndexMap, optionsResolved)

		// Remove the requested IDs, but only if they actually belong to this docId
		for (const idToRemove of ids) {
			if (idIndexMap[idToRemove] && idIndexMap[idToRemove] !== docId) {
				throw new Error(
					`Trying to remove id that exists in another doc, id is: ${idToRemove} in doc ${idIndexMap[idToRemove]}`,
				)
			}
			delete idIndexMap[idToRemove]
		}

		const hasRemainingAliases = Object.values(idIndexMap).includes(docId)
		if (!hasRemainingAliases) {
			await this.dirStorage.delete(this.filePath(docId), optionsResolved)
		}

		await this.writeIdIndexMap(idIndexMap, optionsResolved)
	}

	async upsert(
		ids: string[],
		data?: StoredData,
		options?: Partial<IdStorageOptions>,
	): Promise<void> {
		if (ids.length === 0) {
			throw new Error("No id's passed")
		}

		const optionsResolved = DirIdStorage.resolveOptions(options)
		const idIndexMap = await this.safeReadIdIndexMap(optionsResolved)

		const [docId, wasDocIdCreated] = DirIdStorage.resolveOrCreateDocId(
			ids,
			optionsResolved,
			idIndexMap,
		)

		if (wasDocIdCreated && data === undefined && ids.length === 1) {
			throw new Error(
				"No data found with the passed id's, and no data was passed to be saved so nothing to do.",
			)
		}

		const filePath = this.filePath(docId)

		if (data !== undefined) {
			await this.dirStorage.write(filePath, data, optionsResolved)
		}
		await this.writeIds(idIndexMap, optionsResolved, docId, ids)
	}

	async readById(
		id: string,
		options?: Partial<IdStorageOptions>,
	): Promise<StoredData> {
		const optionsResolved = DirIdStorage.resolveOptions(options)
		const idIndexMap = await this.safeReadIdIndexMap(optionsResolved)

		const docId = this.lookupDocId(id, idIndexMap, optionsResolved)
		const filePath = this.filePath(docId)

		return await this.dirStorage.read(filePath, optionsResolved)
	}

	async readMetadataById(
		id: string,
		options?: Partial<IdStorageOptions>,
	): Promise<IdStorageOptions> {
		const optionsResolved = DirIdStorage.resolveOptions(options)
		const idIndexMap = await this.safeReadIdIndexMap(optionsResolved)

		const docId = this.lookupDocId(id, idIndexMap, optionsResolved)
		const filePath = this.filePath(docId)

		return await this.dirStorage.readMetadata(filePath, optionsResolved)
	}

	async deleteById(
		id: string,
		options?: Partial<IdStorageOptions>,
	): Promise<void> {
		const optionsResolved = DirIdStorage.resolveOptions(options)
		const idIndexMap = await this.safeReadIdIndexMap(optionsResolved)

		const docId = this.lookupDocId(id, idIndexMap, optionsResolved)

		if (!docId) {
			throw new Error(`Can't find id refering to file with id: ${id}`)
		}

		// If this eats too much performance consider reverse index in second file, I.E: A -> O1, B: O1 would be O -> [A, B]
		for (const [existingId, existingDocId] of Object.entries(idIndexMap)) {
			if (docId === existingDocId) {
				delete idIndexMap[existingId]
			}
		}

		const filePath = this.filePath(docId)

		await this.dirStorage.delete(filePath, optionsResolved)
		await this.writeIdIndexMap(idIndexMap, optionsResolved)
	}

	private async writeIds(
		idIndexMap: Record<string, string>,
		options: Partial<IdStorageOptions>,
		docId: string,
		ids: string[],
	) {
		// If this eats too much performance consider reverse index in second file, I.E: A -> O1, B: O1 would be O -> [A, B]
		if (options.idsMode === "replace") {
			for (const [existingId, existingDocId] of Object.entries(
				idIndexMap,
			)) {
				if (existingDocId === docId) {
					delete idIndexMap[existingId]
				}
			}
		}

		for (const id of ids) {
			idIndexMap[id] = docId
		}

		await this.writeIdIndexMap(idIndexMap, options)
	}

	private async writeIdIndexMap(
		idIndexMap: Record<string, string>,
		options: Partial<IdStorageOptions>,
	) {
		// Test whether its always persisent
		const idMapOptions: DirStorageOptions = {
			policy: "persistent",
			backend: options.backend!,
			profile: options.profile!,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		}

		await this.dirStorage.write(
			this.idIndexMapPath(),
			JSON.stringify(idIndexMap),
			idMapOptions,
		)
	}

	private async safeReadIdIndexMap(
		options: Partial<IdStorageOptions>,
	): Promise<Record<string, string>> {
		try {
			const rawPreviousIdData = await this.dirStorage.read(
				this.idIndexMapPath(),
				options,
			)
			return (await JSON.parse(rawPreviousIdData as string)) as Record<
				string,
				string
			>
		} catch {
			// TODO only catch on file not exists
			return {}
		}
	}

	private idIndexMapPath() {
		return `.meta/id-storage/${this.path}/idIndexMap.json`
	}

	private filePath(docId: string) {
		return `${this.path}/${docId}`
	}

	/**
	 * @returns [string, boolean] where the string is the docId, boolean true if the docId was created false if it was found in the ids
	 */
	private static resolveOrCreateDocId(
		ids: string[],
		options: Partial<IdStorageOptions>,
		idIndexMap: Record<string, string>,
	): [string, boolean] {
		let docId = undefined
		for (const id of ids) {
			if (idIndexMap[id]) {
				if (docId && docId !== idIndexMap[id]) {
					throw new Error(
						"Id's refer to more than one entry, thus can't decide which to edit",
					)
				}
				docId = idIndexMap[id]
			}
		}

		if (!docId) {
			return [`${crypto.randomUUID()}.${options.fileExtension}`, true]
		}

		return [docId, false]
	}

	/**
	 * Looks up the docId mapped to `id` and validates its file extension
	 * against `options.fileExtension` if provided.
	 *
	 * @throws Error if `id` is not mapped to any document.
	 * @throws Error if the mapped document's extension doesn't match `options.fileExtension`.
	 */
	private lookupDocId(
		id: string,
		idIndexMap: Record<string, string>,
		options: Partial<IdStorageOptions>,
	): string {
		const docId = idIndexMap[id]

		if (!docId) {
			throw new Error(`File by id: ${id} not found`)
		}

		// We only want to check if the user passed the extension
		if (options?.fileExtension) {
			const extension = docId.split(".")[1]
			if (extension !== options.fileExtension) {
				throw new Error(
					`File extension for the requested file doesn't match with its current saved file. Saved file is: ${docId}, requested extension: ${options.fileExtension}, requested id: ${id}`,
				)
			}
		}

		return docId
	}

	private static resolveOptions(
		options?: Partial<IdStorageOptions>,
	): Partial<IdStorageOptions> {
		if (options?.backend && options.backend !== "indexeddb") {
			throw new Error(
				`Backend mismatch: ${DirIdStorage.name} is not "${options.backend}"`,
			)
		}

		return {
			...DefaultIdStorageOptions(),
			...{ driver: "id-storage-dir" },
			...options,
			backend: "indexeddb",
		}
	}
}
