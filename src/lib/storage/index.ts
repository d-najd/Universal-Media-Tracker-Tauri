import Storage from './Storage'
import IndexedDBStorage from '@/lib/storage/IndexedDBStorage'

let storage: Storage | null = null

export async function getStorage(): Promise<Storage> {
	// TODO seems to be broken, will ignore for now
	// if (isTauri()) {
	// 	return await FileSystemStorage.create()
	// }
	if (storage === null) {
		storage = await IndexedDBStorage.create()
	}
	return storage
}
