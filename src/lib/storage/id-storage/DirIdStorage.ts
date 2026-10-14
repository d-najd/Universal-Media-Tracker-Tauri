import DirStorageNew from "../directory-storage/DirStorageNew"
import StoredData from "../StoredData"
import IdStorageNew from "./IdStorageNew"
import IdStorageOptions, { DefaultIdStorageOptions } from "./IdStorageOptions"

export default class DirIdStorage implements IdStorageNew {
	// readonly idIndexMapPath: string

	private constructor(
		private dirStorage: DirStorageNew,
		private path: string,
	) {
		// Prevent not found errors
		// dirStorage.write(this.idIndexMapPath, "")
	}

	/**
	 * @param path must not be metapath, ex media/movies
	 */
	static async create(dirStorage: DirStorageNew, path: string) {
		const inst = new DirIdStorage(dirStorage, path)
		return inst
	}

	async write(
		data: StoredData,
		ids: string[],
		options?: Partial<IdStorageOptions>,
	): Promise<void> {
		const optionsResolved = DirIdStorage.resolveOptions(options)
		if (!options?.idsMode) {
			optionsResolved.idsMode = "replace"
		}
		const idIndexMap = await this.safeReadIdIndexMap(optionsResolved)

		const targetDocId = DirIdStorage.resolveDocId(
			ids,
			optionsResolved,
			idIndexMap,
		)
		const metaDataPath = this.metadataEntryPath(
			optionsResolved,
			targetDocId,
		)
		const optionsString = JSON.stringify(optionsResolved)

		await this.dirStorage.write(this.path, data)
		await this.writeIds(ids, optionsResolved, idIndexMap, targetDocId)
		await this.dirStorage.write(metaDataPath, optionsString)
	}

	async readById(
		id: string,
		options?: Partial<IdStorageOptions>,
	): Promise<string> {}

	async updateById(
		id: string,
		data?: string,
		ids?: Record<string, string>,
		options?: Partial<IdStorageOptions>,
	): Promise<void> {
		throw new Error("Method not implemented.")
	}

	async deleteById(
		id: string,
		options?: Partial<IdStorageOptions>,
	): Promise<void> {
		throw new Error("Method not implemented.")
	}

	private async writeIds(
		ids: string[],
		options: Partial<IdStorageOptions>,
		idIndexMap: Record<string, string>,
		targetDocId: string,
	) {
		// If this eats too much performance consider reverse index in second file, I.E: A -> O1, B: O1 would be O -> [A, B]
		if (options.idsMode === "replace") {
			for (const [existingId, docId] of Object.entries(idIndexMap)) {
				if (docId === targetDocId) {
					delete idIndexMap[existingId]
				}
			}
		}

		for (const id of ids) {
			idIndexMap[id] = targetDocId
		}

		this.dirStorage.write(
			this.idIndexMapPath(options),
			JSON.stringify(idIndexMap),
		)
	}

	private async safeReadIdIndexMap(
		options: Partial<IdStorageOptions>,
	): Promise<Record<string, string>> {
		try {
			const rawPreviousIdData = await this.dirStorage.read(
				this.idIndexMapPath(options),
			)
			return (await JSON.parse(rawPreviousIdData as string)) as Record<
				string,
				string
			>
		} catch {
			return {}
		}
	}

	private idIndexMapPath(options: Partial<IdStorageOptions>) {
		return `${options.profile!}/.meta/id-storage/${this.path}/idIndexMap.json`
	}

	/**
	 * @param targetDocId should contain the file itself for ex video.mp4
	 */
	private metadataEntryPath(
		options: Partial<IdStorageOptions>,
		targetDocId: string,
	) {
		return `${options.profile!}/.meta/id-storage/${this.path}/entries/${targetDocId}`
	}

	private static resolveDocId(
		ids: string[],
		options: Partial<IdStorageOptions>,
		idIndexMap: Record<string, string>,
	) {
		let targetDocId = undefined
		for (const id of ids) {
			if (!targetDocId && targetDocId !== idIndexMap[id]) {
				throw new Error(
					"Id's refer to more than one entry, thus can't decide which to edit",
				)
			}
			targetDocId = idIndexMap[id]
		}

		if (!targetDocId) {
			targetDocId = `${crypto.randomUUID()}.${options.fileExtension}`
		}

		return targetDocId
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
			...options,
			backend: "indexeddb",
		}
	}
}
