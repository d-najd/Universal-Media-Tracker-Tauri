import DirEntry from "@/lib/storage/directory-storage/DirEntry"
import StoredData from "../StoredData"
import DirStorageOptions from "./DirStorageOptions"

/**
 * Directory-based storage interface
 *
 * @remarks
 * Follows git-like folder semantics — empty directories are removed automatically,
 * explicit creation of empty folders is not supported.
 *
 * @remarks
 * All methods accept {@link DirStorageOptions} to control storage behavior.
 * If `options.policy` is defined, operations are scoped to that policy only.
 * If undefined, operations search or apply across all policies
 *
 * @see {@link DirStorageOptions}
 */
export default interface DirStorageNew {
	/**
	 * @param options if defined [options.policy] will search only in that policy
	 * Lists all files and directories in directory, similar to the command ls
	 */
	list(
		path: string,
		options?: Partial<DirStorageOptions>,
	): Promise<DirEntry[]>

	/**
	 * Read file
	 * @param path - must include file extension
	 * @param options - if `policy` is defined, searches only in that policy,
	 * otherwise searches all policies in order
	 * @throws if path does not include a file extension
	 * @throws if file is not found
	 */
	read(
		path: string,
		options?: Partial<DirStorageOptions>,
	): Promise<StoredData>

	/**
	 * Reads the metadata for the stored file
	 * @param options if defined [options.policy] will search only in that policy
	 * @remarks must include extension
	 * @returns [DirStorageOptions] if found
	 * @throws if file is not found
	 */
	readMetadata(
		path: string,
		options?: Partial<DirStorageOptions>,
	): Promise<DirStorageOptions>

	/**
	 * Write file
	 * @remarks must include file extension
	 * @remarks A file can only exist in one policy at a time. Writing a file to a different
	 * policy than it currently resides in will remove it from the old one.
	 * @remarks if the file already exists to a policy and no options are passed it will be
	 * overriden in that policy instead of being moved
	 */
	write(
		path: string,
		data: StoredData,
		options?: Partial<DirStorageOptions>,
	): Promise<void>

	/**
	 * Delete file or directory
	 * @remarks if file extension is not included dir will be removed
	 */
	delete(path: string, options?: Partial<DirStorageOptions>): Promise<void>

	/**
	 * Deletes all data inside the database
	 */
	deleteAll(): Promise<void>
}
