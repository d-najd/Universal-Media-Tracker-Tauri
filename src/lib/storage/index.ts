import { StorageApi } from "@d-najd/universal-media-tracker-sdk"
import IDBDirStorage from "./directory-storage/IDBDirStorage"
import DirIdStorage from "./id-storage/DirIdStorage"

let storageApi: StorageApi | null = null

export async function getStorage(): Promise<StorageApi> {
	if (storageApi === null) {
		const pathsApi = await IDBDirStorage.create()
		const mediaApi = await DirIdStorage.create(pathsApi, "media")
		storageApi = {
			paths: pathsApi,
			media: mediaApi,
		}
	}

	return storageApi
}
