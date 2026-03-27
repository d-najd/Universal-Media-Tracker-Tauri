import Storage from './Storage'
import IndexedDBStorage from '@/lib/storage/IndexedDBStorage'
import FileSystemStorage from '@/lib/storage/FileSystemStorage'

export async function getStorage(): Promise<Storage> {
	if ('__TAURI__' in window) {
		return FileSystemStorage.create()
	}
	return await IndexedDBStorage.create()
}
