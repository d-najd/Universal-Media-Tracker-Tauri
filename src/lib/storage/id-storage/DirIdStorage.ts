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

		const prevIdIndexMap = this.safeReadIdIndexMap(optionsResolved.profile!)

		let targetDocId = undefined
		for (const id of ids) {
			if (!targetDocId && targetDocId !== prevIdIndexMap[id]) {
				throw new Error(
					"Id's refer to more than one entry, thus can't decide which to edit",
				)
			}
			targetDocId = prevIdIndexMap[id]
		}

		if (targetDocId === undefined) {
			targetDocId = `${crypto.randomUUID()}.${optionsResolved.fileExtension}`
		}
	}

	async readById(
		id: string,
		options?: Partial<IdStorageOptions>,
	): Promise<string> {
		throw new Error("Method not implemented.")
	}

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

	private safeReadIdIndexMap(profile: string): Record<string, string> {
		try {
			const rawPreviousIdData = await this.dirStorage.read(
				this.idIndexMapPath(profile),
			)
			return (await JSON.parse(rawPreviousIdData as string)) as Record<
				string,
				string
			>
		} catch (e) {
			return {}
		}
	}

	private appendToFile() {}

	private idIndexMapPath(profile: string) {
		return `${profile}/.meta/id-storage/${this.path}/idIndexMap.json`
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
