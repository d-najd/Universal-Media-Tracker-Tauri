import {
	DirStorage,
	DirStorageOptions,
	LocalPluginConfig,
	pluginLocalConfigFilePath,
	pluginsManifestFileName,
	pluginsManifestFilePath,
} from "@d-najd/universal-media-tracker-sdk"
import PluginManifest from "./types/PluginManifest"

export default class PluginRegistry {
	constructor(private dirStorage: DirStorage) {}

	// Default if missing
	async readManifest(): Promise<PluginManifest> {
		if (
			!(await this.dirStorage.exists(
				pluginsManifestFilePath(),
				this.storageOptions(),
			))
		) {
			await this.writeManifest(this.defaultManifest())
		}

		const manifestString = (await this.dirStorage.read(
			pluginsManifestFilePath(),
			this.storageOptions(),
		)) as string
		return JSON.parse(manifestString)
	}

	async writeManifest(manifest: PluginManifest): Promise<void> {
		await this.dirStorage.write(
			pluginsManifestFilePath(),
			JSON.stringify(manifest),
			this.storageOptions(),
		)
	}

	async readConfig(id: string): Promise<LocalPluginConfig> {
		const configPath = pluginLocalConfigFilePath(id)

		if (
			!(await this.dirStorage.exists(configPath, this.storageOptions()))
		) {
			throw new Error("")
		}
	}

	private defaultManifest(): PluginManifest {
		return {
			version: 1,
			loadOrder: [],
			basePluginsInitialized: false,
		}
	}

	private storageOptions(): Partial<DirStorageOptions> {
		return {
			policy: "persistent",
		}
	}
}

/*
export default class PluginRepository {
    constructor(private paths: PathsApi) {}

    readManifest(): Promise<PluginManifest>      // returns defaults if missing/corrupt, never throws
    writeManifest(m: PluginManifest): Promise<void>

    readConfig(id: string): Promise<LocalPluginConfig>   // throws CorruptConfigError on bad JSON
    writeConfig(c: LocalPluginConfig): Promise<void>

    readCode(id: string): Promise<string>
    writeCode(id: string, code: string): Promise<void>

    delete(id: string): Promise<void>
    exists(id: string): Promise<boolean>
    listFolders(): Promise<DirEntry[]>
}

*/
