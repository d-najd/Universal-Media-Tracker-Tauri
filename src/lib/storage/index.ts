import DirStorage from "./directory-storage/DirStorage"
import IDBDirStorage from "./directory-storage/IDBDirStorage"

let storage: DirStorage | null = null

export async function getStorage(): Promise<DirStorage> {
	// TODO seems to be broken, will ignore for now
	// if (isTauri()) {
	// 	return await FileSystemStorage.create()
	// }
	if (storage === null) {
		storage = await IDBDirStorage.create()
	}
	return storage
}
