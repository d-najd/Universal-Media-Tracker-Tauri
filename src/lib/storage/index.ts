import Storage from './Storage'
import IndexedDBStorage from '@/lib/storage/IndexedDBStorage'

export async function getStorage(): Promise<Storage> {
	// TODO seems to be broken, will ignore for now
	// if (isTauri()) {
	// 	return await FileSystemStorage.create()
	// }
	return await IndexedDBStorage.create()
}
