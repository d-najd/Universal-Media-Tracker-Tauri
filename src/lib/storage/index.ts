import Storage from './Storage'
import IndexedDBStorage from '@/lib/storage/IndexedDBStorage'

export async function getStorage(): Promise<Storage> {
	return await IndexedDBStorage.create()
}
