import IdStorageOptions from "./IdStorageOptions"

/**
 * Stores entries by one of many id's
 */
export default interface IdStorageNew {
	/**
	 * If any of the id's match will override that entry otherwise write new
	 * @throws Error if the given id's belong to more than 1 entry
	 */
	write(
		data: string,
		ids: Record<string, string>,
		options?: Partial<IdStorageOptions>,
	): Promise<void>

	/**
	 * finds by id
	 * @throws Error if entry with id not found
	 */
	readById(id: string, options?: Partial<IdStorageOptions>): Promise<string>

	/**
	 * finds by given id and updates id's, data, or both
	 * @throws Error if ids and data are undefined
	 * @throws Error if entry with @param id doesn't exist
	 * @throws Error if the given id's belong to more than 1 entry
	 */
	updateById(
		id: string,
		data?: string,
		ids?: Record<string, string>,
		options?: Partial<IdStorageOptions>,
	): Promise<void>

	/**
	 * deletes by id
	 * @throws Error if entry with id not found
	 */
	deleteById(id: string, options?: Partial<IdStorageOptions>): Promise<void>
}
