import StoredData from "../StoredData"
import IdStorageOptions from "./IdStorageOptions"

/**
 * Stores entries by one of many id's
 */
export default interface IdStorage {
	/**
	 * finds by id
	 * @throws Error if entry with id not found
	 */
	readById(
		id: string,
		options?: Partial<IdStorageOptions>,
	): Promise<StoredData>

	readMetadataById(
		id: string,
		options?: Partial<IdStorageOptions>,
	): Promise<IdStorageOptions>

	/**
	 * Creates a new entry or updates an existing one.
	 *
	 * If any of the provided IDs already resolve to an entry, that entry is
	 * updated, its data (if provided) is written, and the provided IDs are
	 * added to its alias set.
	 *
	 * If none of the provided IDs resolve to an existing entry, a new entry is
	 * created and all provided IDs are registered as aliases.
	 *
	 * @param ids     IDs to associate with the entry. Used both to locate an
	 *                existing entry and to register aliases on it.
	 * @param data    Data to store. If omitted, the entry's existing data is
	 *                preserved (only aliases are updated).
	 * @param options Storage options. `idsMode` controls alias semantics,
	 *                see {@link IdStorageOptions} for `idsMode` semantics
	 *
	 * @throws Error if the provided IDs resolve to more than one existing entry.
	 * @throws Error if no entry matches and `data` is undefined (nothing to create).
	 * @throws Error if empty array of `ids` is passed
	 */
	// upsert(
	// 	ids: string[],
	// 	data?: StoredData,
	// 	options?: Partial<IdStorageOptions>,
	// ): Promise<void>

	/**
	 * Creates a new entry or updates the data of an existing one.
	 *
	 * @param ids IDs to associate with this data. If any ID already exists,
	 *            the data is updated for that entry. If none exist, a new entry is created.
	 *
	 * @throws Error if the provided IDs resolve to more than one existing entry.
	 * @throws Error if empty array of `ids` is passed.
	 */
	write(
		ids: string[],
		data: StoredData,
		options?: Partial<IdStorageOptions>,
	): Promise<void>

	/**
	 * Adds aliases to an existing entry.
	 *
	 * @param id An existing ID used to locate the entry.
	 * @param ids The new aliases to add.
	 *
	 * @throws Error if no entry matches `id`.
	 * @throws Error if any of the new `ids` already belong to a different entry.
	 */
	addAliases(
		id: string,
		ids: string[],
		options?: Partial<IdStorageOptions>,
	): Promise<void>

	/**
	 * Removes aliases from an existing entry.
	 * Does not delete the entry itself, unless all IDs are removed.
	 *
	 * @param id An existing ID used to locate the entry.
	 * @param ids The aliases to remove.
	 *
	 * @throws Error if no entry matches `id`.
	 */
	removeAliases(
		id: string,
		ids: string[],
		options?: Partial<IdStorageOptions>,
	): Promise<void>

	/**
	 * deletes by id
	 * @throws Error if entry with id not found
	 */
	deleteById(id: string, options?: Partial<IdStorageOptions>): Promise<void>
}
