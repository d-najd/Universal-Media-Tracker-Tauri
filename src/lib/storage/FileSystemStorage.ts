import Storage from '@/lib/storage/Storage'
import DirEntry from './DirEntry'
/*
import {
	BaseDirectory,
	writeTextFile,
	readTextFile,
	exists
} from '@tauri-apps/plugin-fs'
 */
import * as fs from '@tauri-apps/plugin-fs'
import { homeDir } from '@tauri-apps/api/path'

export default class FileSystemStorage implements Storage {
	// private baseDir = BaseDirectory.Home + '/universal-media-tracker/'

	private constructor(private baseDir: string) {}

	static async create() {
		return new FileSystemStorage(
			(await homeDir()).replace(/\\/g, '/') + '/universal-media-tracker/',
		)
	}

	async read(path: string): Promise<string> {
		if (!this.isFile(path)) {
			throw new Error(`Path must include file extension: ${path}`)
		}

		return await fs.readTextFile(this.baseDir + path)
	}
	async write(path: string, data: string): Promise<void> {
		if (!this.isFile(path)) {
			throw new Error(`Path must include file extension: ${path}`)
		}

		const finalPath = this.baseDir + path
		console.log('finalll')
		console.log(finalPath)
		const finalDir = finalPath.substring(0, finalPath.lastIndexOf('/'))

		await fs.mkdir(finalDir, {
			recursive: true,
		})

		await fs.writeTextFile(this.baseDir + path, data)
	}
	async delete(path: string): Promise<void> {
		const finalPath = this.baseDir + path
		await fs.remove(finalPath, { recursive: true })

		const finalDir = finalPath.substring(0, finalPath.lastIndexOf('/'))
		const relative = finalDir.substring(this.baseDir.length)
		if (!relative) return

		if ((await fs.readDir(finalDir)).length === 0) {
			await this.delete(relative)
		}
	}

	async list(path: string): Promise<DirEntry[]> {
		return (await fs.readDir(this.baseDir + path))
			.filter((o) => !o.isSymlink)
			.map((o) => {
				const res: DirEntry = {
					type: o.isFile ? 'file' : 'directory',
					name: o.name,
					path: path + o.name,
				}
				return res
			})
	}

	private isFile(path: string) {
		const last = path.split('/').pop()!
		return last.includes('.')
	}
}
