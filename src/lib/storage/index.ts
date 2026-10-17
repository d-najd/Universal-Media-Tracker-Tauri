import { DirStorage } from "@d-najd/universal-media-tracker-sdk"
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
