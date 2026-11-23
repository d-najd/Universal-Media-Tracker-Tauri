import {
	DirEntry,
	DirStorage,
	DirStorageOptions,
	LocalPluginConfig,
	pluginBundleFilePath,
	pluginLocalConfigFilePath,
	pluginsDir,
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
		const configString = (await this.dirStorage.read(
			pluginLocalConfigFilePath(id),
			this.storageOptions(),
		)) as string
		return JSON.parse(configString)
	}

	async writeConfig(config: LocalPluginConfig): Promise<void> {
		await this.dirStorage.write(
			pluginLocalConfigFilePath(config.id),
			JSON.stringify(config),
			this.storageOptions(),
		)
	}

	async readCode(id: string): Promise<string> {
		return (await this.dirStorage.read(
			pluginBundleFilePath(id),
			this.storageOptions(),
		)) as string
	}

	async writeCode(id: string, code: string) {
		await this.dirStorage.write(
			pluginBundleFilePath(id),
			code,
			this.storageOptions(),
		)
	}

	async delete(id: string): Promise<void> {
		// TODO transactional????????????? can't wrap it here since its already wrapped???????
		await this.dirStorage.delete(
			pluginLocalConfigFilePath(id),
			this.storageOptions(),
		)
		await this.dirStorage.delete(
			pluginBundleFilePath(id),
			this.storageOptions(),
		)
	}

	/**
	 * Checks whether every part of the plugin is properly persisted
	 */
	async exists(id: string): Promise<boolean> {
		if (
			!(await this.dirStorage.exists(
				pluginLocalConfigFilePath(id),
				this.storageOptions(),
			))
		) {
			return false
		}

		const localConfig = await this.readConfig(id)
		if (localConfig.loadedFrom === "plugin-source") {
			if (
				!(await this.dirStorage.exists(
					pluginBundleFilePath(id),
					this.storageOptions(),
				))
			) {
				return false
			}
		}

		return true
	}

	async listFolders(): Promise<DirEntry[]> {
		return await this.dirStorage.list(
			`${pluginsDir}/`,
			this.storageOptions(),
		)
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
