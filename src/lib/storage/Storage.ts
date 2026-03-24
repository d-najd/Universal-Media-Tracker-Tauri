import DirEntry from '@/lib/storage/DirEntry'

/**
 * @remarks due to the differences between different possible implementations,
 * explicit creation of folders (empty) is not possible, the folder creation and
 * deletion if empty folder will be done internally
 */
export default interface Storage {
	/**
	 * Read file
	 * @remarks must include extension
	 */
	read(path: string): Promise<string>

	/**
	 * Write file
	 * @remarks must include file extension
	 */
	write(path: string, data: string): Promise<void>

	/**
	 * Delete file or directory
	 * @remarks if file extension is not included dir will be removed
	 */
	delete(path: string): Promise<void>

	/**
	 * Lists all files in directory and subdirectories, similar to the command ls
	 */
	list(path: string): Promise<DirEntry[]>
}
