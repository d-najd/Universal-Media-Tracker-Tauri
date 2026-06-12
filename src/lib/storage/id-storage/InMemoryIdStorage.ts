import IdStorage from "./IdStorage"

export default class InMemoryIdStorage implements IdStorage {
	private dataMap: Map<string, string> = new Map() // docId -> data
	private idToDocId: Map<string, string> = new Map() // id -> docId

	async write(data: string, ids: Record<string, string>): Promise<void> {
		for (const idValue of Object.values(ids)) {
			const existingDocId = this.idToDocId.get(idValue)
			if (existingDocId) {
				this.dataMap.set(existingDocId, data)
				for (const val of Object.values(ids)) {
					this.idToDocId.set(val, existingDocId)
				}
				return
			}
		}

		const docId = crypto.randomUUID()
		this.dataMap.set(docId, data)
		for (const idValue of Object.values(ids)) {
			this.idToDocId.set(idValue, docId)
		}
	}

	async readById(id: string): Promise<string> {
		const docId = this.idToDocId.get(id)
		if (!docId) throw new Error(`Not found: ${id}`)
		return this.dataMap.get(docId)!
	}

	async updateById(
		id: string,
		data?: string,
		ids?: Record<string, string>,
	): Promise<void> {
		if (!data && !ids)
			throw new Error(
				"Data and ids are not defined, can't call update without updating anything",
			)

		const docId = this.idToDocId.get(id)
		if (!docId) throw new Error(`Not found: ${id}`)

		if (data) this.dataMap.set(docId, data)

		if (ids) {
			for (const [idValue, mappedDocId] of this.idToDocId.entries()) {
				if (mappedDocId === docId) {
					this.idToDocId.delete(idValue)
				}
			}
			for (const idValue of Object.values(ids)) {
				this.idToDocId.set(idValue, docId)
			}
		}
	}

	async deleteById(id: string): Promise<void> {
		const docId = this.idToDocId.get(id)
		if (!docId) throw new Error(`Not found: ${id}`)

		for (const [idValue, mappedDocId] of this.idToDocId.entries()) {
			if (mappedDocId === docId) {
				this.idToDocId.delete(idValue)
			}
		}
		this.dataMap.delete(docId)
	}
}
