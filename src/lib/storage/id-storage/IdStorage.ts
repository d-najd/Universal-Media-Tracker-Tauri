/**
 * Stores entries by one of many id's
 */
export default interface IdStorage {
	/**
	 * If any of the id's match will override that entry otherwise write new
	 */
	write(data: string, ids: Record<string, string>): Promise<void>
	/**
	 * finds by id
	 * @throws Error if entry with id not found
	 */
	readById(id: string): Promise<string>
	/**
	 * finds by given id and updates id's, data, or both
	 * @throws Error if ids and data are undefined
	 */
	updateById(
		id: string,
		data?: string,
		ids?: Record<string, string>,
	): Promise<void>
	/**
	 * deletes by id
	 * @throws Error if entry with id not found
	 */
	deleteById(id: string): Promise<void>
}
