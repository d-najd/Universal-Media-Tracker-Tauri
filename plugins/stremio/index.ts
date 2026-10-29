import {
	CatalogHandlerArgs,
	CatalogHandlerResponse,
	curPluginPath,
	Meta,
	MetaHandlerArgs,
	MetaHandlerResponse,
	MetaPreview,
	Plugin,
	PluginConfig,
	PluginFactoryHandlerArgs,
	PluginFactoryHandlerResponse,
	ResourceBrowseOption,
	ResourceBrowseOptionArgs,
	ResourceType,
	StorageOptions,
} from "@d-najd/universal-media-tracker-sdk"

const options: PluginConfig = {
	logo: "https://web.stremio.com/images/stremio_symbol.png",
	id: "stremio-plugin-factory",
	name: "Stremio Plugin Factory",
	version: "0.0.1",
}

const plugin = new Plugin(options)

type StremioManifestResourceType =
	| "catalog"
	| "meta"
	| "addon_catalog"
	| "subtitles"

type StremioManifest = {
	id: string
	name: string
	description: string
	version: string
	catalogs: StremioCatalogEntry[]
	resources: StremioManifestResourceType[]
	types: ResourceType[]
	logo?: string
}

type StremioCatalogEntry = {
	id: string
	name: string
	type: string
	extra?: StremioCatalogEntryExtra[]
	// poster: string
}

type StremioMetaEntry = {
	id: string
	name: string
	type: string
	description?: string
	released?: Date
	year?: number
	poster?: string
	background?: string
	logo?: string
}

type StremioCatalogEntryExtra = {
	name: string
	options?: string[]
	optionsLimit?: number
	isRequired?: boolean
}

type StremioCatalogResponse = {
	metas: StremioCatalogEntryResponse[]
}

type StremioMetaResponse = {
	meta: StremioMetaEntry
}

type StremioCatalogEntryResponse = {
	id: string
	type: string
	name: string
	poster: string
}

let inputArgs: PluginFactoryHandlerArgs
const MANIFEST_STRING = "/manifest.json"

plugin.definePluginFactoryHandler({
	async callback(
		args: PluginFactoryHandlerArgs,
	): Promise<PluginFactoryHandlerResponse> {
		const pluginSelf = plugin
		inputArgs = args
		if (!args.url.endsWith(MANIFEST_STRING)) {
			return { status: "skip" }
		}

		try {
			const manifest = (await (
				await fetch(`${args.url}`)
			).json()) as StremioManifest

			const createdPlugin = new Plugin({
				logo: manifest.logo ?? pluginSelf.config.logo,
				id: manifest.id,
				name: manifest.name,
				version: manifest.version,
			})

			defineCatalogs(createdPlugin, manifest)
			// TODO fix the meta handler
			// defineMetas(pluginCreated, manifest)

			return { status: "valid", plugin: createdPlugin }
		} catch (e) {
			return { status: "invalid", reason: e!.toString() }
		}
	},
})

// Contains list of the ids that were already fetched, for deduplication
const getFetchedIdsPath = (
	pluginConfig: PluginConfig,
	catalog: StremioCatalogEntry,
) => curPluginPath(pluginConfig) + "/" + catalog.id + "/" + "fetchedIds.json"
// Contains the previous fetch options such as pageSize, skip etc
const getPreviousOptionsPath = (
	pluginConfig: PluginConfig,
	catalog: StremioCatalogEntry,
) =>
	curPluginPath(pluginConfig) +
	"/" +
	catalog.id +
	"/" +
	"previousOptions.json"
// Contains list of the overflowed items from the previous fetch, lets say page size is 3 and we got 7 items
// That means 4 will be put here and the next time we will return the first 3, then the leftover 1 and with 2 more fetched items
const getOverflowedItemsPath = (
	pluginConfig: PluginConfig,
	catalog: StremioCatalogEntry,
) =>
	curPluginPath(pluginConfig) +
	"/" +
	catalog.id +
	"/" +
	"overflowedItems.json"

const catalogSessionStorageOptions: Partial<StorageOptions> = {
	policy: "session",
}

async function invalidateCacheIfNecessary(
	plugin: Plugin,
	catalog: StremioCatalogEntry,
	args: CatalogHandlerArgs,
) {
	const paths = plugin.app.storage.paths
	const previousOptionsPath = getPreviousOptionsPath(plugin.config, catalog)
	const overflowedItemsPath = getOverflowedItemsPath(plugin.config, catalog)
	const fetchedIdsPath = getFetchedIdsPath(plugin.config, catalog)

	if (
		!(await paths.exists(previousOptionsPath, catalogSessionStorageOptions))
	) {
		return
	}

	const previousArgs = (await paths.read(
		previousOptionsPath,
		catalogSessionStorageOptions,
	)) as string

	let optionsCopy = { ...(args.options ?? []) }
	optionsCopy = optionsCopy.filter((opt) => opt.name !== "skip")

	optionsCopy.sort()
	if (previousArgs === JSON.stringify(optionsCopy)) {
		return
	}

	await paths.delete(previousOptionsPath, catalogSessionStorageOptions)
	// TODO refactor this? doesnt seem to belong in this method, maybe another method after this one is called (the parent method)
	// Alternative is moving previousOptionsPath to this method and making it exclusive for this
	await paths.write(
		previousOptionsPath,
		JSON.stringify(optionsCopy),
		catalogSessionStorageOptions,
	)
	if (await paths.exists(overflowedItemsPath, catalogSessionStorageOptions)) {
		await paths.delete(overflowedItemsPath, catalogSessionStorageOptions)
	}
	if (await paths.exists(fetchedIdsPath, catalogSessionStorageOptions)) {
		await paths.delete(fetchedIdsPath, catalogSessionStorageOptions)
	}
}

function defineCatalogs(createdPlugin: Plugin, manifest: StremioManifest) {
	if (!manifest.resources.some((o) => o === "catalog")) return

	for (const catalog of manifest.catalogs) {
		const options = catalog.extra
			?.filter(
				(o) => resourceBrowseOptionArgToTypeConverter(o) !== "unknown",
			)
			.map((o) => {
				const result: ResourceBrowseOption = {
					isRequired: o.isRequired,
					name: o.name,
					options: o.options,
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					type: resourceBrowseOptionArgToTypeConverter(o) as any,
				}
				return result
			})

		createdPlugin.defineCatalogHandler({
			id: catalog.id,
			name: catalog.name,
			resourceType: catalog.type,
			options: options,
			async callback(
				args: CatalogHandlerArgs,
			): Promise<CatalogHandlerResponse> {
				// const size = args.pageSize ?? 20
				const urlExceptManifest = inputArgs.url.slice(
					0,
					-MANIFEST_STRING.length,
				)

				const paths = createdPlugin.app.storage.paths

				// if (paths.exists())

				// 1. Check whether the options have changed in a way that it required clearing the cache, this includes new args option except adding/removing skip (should default to 0).
				// If it did then remove the old cache
				// 2. Read the cached data and compare if it matches with the retrieved data (duplicates)
				// 3. If the ids already exist then de-duplicate them and if the pageSize doesn't match the current element count
				// reduce/increase its count and cache the rest if needed and mark how much were cached if too many were fetched
				// 4. For caching we can only put the ids, nothing else is needed

				// createdPlugin.app.storage.paths.write(path, data)

				// TODO before next check already stored cached data if it exceeds page size n stuff

				invalidateCacheIfNecessary(createdPlugin, catalog, args)

				// 1. Get overflowed items
				// 2. Check if overflowed items >= pageSize
				// 3A. if overflowed items >= pageSize just return without fetch
				// 4A. remove the fetched items, always take from beginning and add to end
				// 3B. if overflowed items < pageSize then fetch as many times as needed till overflowed items + fetch size >= pageSize
				// 4B. if items are overflowed save them and remove all previous in this case

				const overflowedItemsPath = getOverflowedItemsPath(
					createdPlugin.config,
					catalog,
				)

				let newUrl =
					urlExceptManifest +
					"/catalog/" +
					catalog.type +
					"/" +
					catalog.id
				if (args.options) {
					newUrl +=
						"/" +
						args.options
							.map((o) => o.name + "=" + o.input)
							.join("&")
				}
				newUrl += ".json"

				const result = (await (
					await fetch(`${newUrl}`)
				).json()) as StremioCatalogResponse

				let mappedData = mapMeta(result.metas)

				mappedData = await removeDuplicateMeta(
					createdPlugin,
					catalog,
					mappedData,
				)

				return {
					data: mappedData,
				}
			},
		})
	}
}

async function removeDuplicateMeta(
	plugin: Plugin,
	catalog: StremioCatalogEntry,
	mappedData: MetaPreview[],
) {
	const paths = plugin.app.storage.paths
	const fetchedIdsPath = getFetchedIdsPath(plugin.config, catalog)

	// Find duplicates saved current
	if (await paths.exists(fetchedIdsPath, catalogSessionStorageOptions)) {
		// TODO can use set here?
		const prevFetchedIds = new Set(
			JSON.parse(
				(await paths.read(
					fetchedIdsPath,
					catalogSessionStorageOptions,
				)) as string,
			) as string[],
		)

		return mappedData.filter(
			(entry) => !entry.ids.some((id) => prevFetchedIds.has(id)),
		)
	}

	return mappedData
}

function defineMetas(pluginCreated: Plugin, manifest: StremioManifest) {
	if (!manifest.resources.some((o) => o === "meta")) return

	for (const type of manifest.types) {
		pluginCreated.defineMetaHandler({
			resourceType: type,
			async callback(
				args: MetaHandlerArgs,
			): Promise<MetaHandlerResponse> {
				const urlExceptManifest = inputArgs.url.slice(
					0,
					-MANIFEST_STRING.length,
				)

				let newUrl =
					urlExceptManifest + "/meta/" + type + "/" + args.metaId
				if (args.options) {
					newUrl +=
						"/" +
						args.options
							.map((o) => o.name + "=" + o.input)
							.join("&")
				}
				newUrl += ".json"

				console.error("METAS " + newUrl)

				const result = (await (
					await fetch(`${newUrl}`)
				).json()) as StremioMetaResponse

				const meta: Meta = {
					id: result.meta.id,
					name: result.meta.name,
					type: result.meta.type,
					poster: result.meta.poster,
					description: result.meta.description,
					released: result.meta.released,
					year: result.meta.year,
					background: result.meta.background,
					logo: result.meta.logo,
				}

				return {
					data: [meta],
				}
			},
		})
	}
}

function mapMeta(metas: StremioCatalogEntryResponse[]) {
	const mappedData: MetaPreview[] = []

	for (const meta of metas) {
		const formatIdValue = (value: string) => {
			return value.split(":").at(-1)
		}

		const formatIdKey = (key: string) => {
			const idPattern = /.*[^a-zA-Z0-9]id$/

			if (!idPattern.test(key)) {
				return undefined
			}

			const idTypeSplitterPattern = /^(.*)[^a-zA-Z0-9]id$/
			const splittedIdType = idTypeSplitterPattern.exec(key)
			const idType = splittedIdType ? splittedIdType[1] : undefined

			return idType
		}

		const ids = [`unknown:${formatIdValue(meta.id)}`]
		for (const [key, value] of Object.entries(meta)) {
			const idType = formatIdKey(key)

			if (!idType) {
				continue
			}

			ids.push(`${idType}:${formatIdValue(value)}`)
		}

		const metaPreview: MetaPreview = {
			ids: ids,
			name: meta.name,
			poster: meta.poster,
			type: meta.type,
		}
		mappedData.push(metaPreview)
	}

	return mappedData
}

function resourceBrowseOptionArgToTypeConverter(
	arg: StremioCatalogEntryExtra,
): string {
	if (arg.name === "search") {
		return "string"
	}
	if (arg.name === "skip") {
		return "number"
	}
	if (!arg.options) {
		if (!arg.optionsLimit && arg.optionsLimit === 1) {
			return "radio"
		}
		return "checkbox"
	}
	return "unknown"
}

export default plugin
