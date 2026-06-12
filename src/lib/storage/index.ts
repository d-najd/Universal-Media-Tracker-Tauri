import IndexedDbDirStorage from "./directory-storage/IndexedDbDirStorage"
import DirStorage from "./directory-storage/DirStorage"

let storage: DirStorage | null = null

export async function getStorage(): Promise<DirStorage> {
	// TODO seems to be broken, will ignore for now
	// if (isTauri()) {
	// 	return await FileSystemStorage.create()
	// }
	if (storage === null) {
		storage = await IndexedDbDirStorage.create()
	}
	return storage
}
