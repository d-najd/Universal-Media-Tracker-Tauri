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

type CatalogState = {
	// Includes options for searching, except skip, if the options don't match (say user searches with other category) the state should be wiped
	options: ResourceBrowseOptionArgs[]
	// old fetched items
	fetchedItems: MetaPreview[]
	// Stemio plugins aren't perfect, sometimes they return duplicates, sometiems they return less items, so we need to keep track of the real skip number
	realSkip: number
}

let inputArgs: PluginFactoryHandlerArgs
const MANIFEST_STRING = "/manifest.json"
const STREMIO_PAGE_SIZE = 20

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

const getCatalogStatePath = (
	pluginConfig: PluginConfig,
	catalog: StremioCatalogEntry,
) => curPluginPath(pluginConfig) + "/" + catalog.id + "/" + "catalogState.json"

const catalogStateStorageOptions: Partial<StorageOptions> = {
	policy: "session",
}

async function syncCatalogState(
	plugin: Plugin,
	catalog: StremioCatalogEntry,
	args: CatalogHandlerArgs,
) {
	const paths = plugin.app.storage.paths

	let optionsCopy = args.options ?? []
	optionsCopy = optionsCopy.filter(
		(opt) => opt.name !== "skip" && opt.name !== "preferredPageSize",
	)

	const cleanCatalogState: CatalogState = {
		options: optionsCopy,
		fetchedItems: [],
		realSkip: 0,
	}

	const catalogStatePath = getCatalogStatePath(plugin.config, catalog)
	if (!(await paths.exists(catalogStatePath, catalogStateStorageOptions))) {
		await paths.write(
			catalogStatePath,
			JSON.stringify(cleanCatalogState),
			catalogStateStorageOptions,
		)

		return cleanCatalogState
	}

	const previousCatalogState = JSON.parse(
		(await paths.read(
			catalogStatePath,
			catalogStateStorageOptions,
		)) as string,
	) as CatalogState

	if (
		previousCatalogState.options.length === optionsCopy.length &&
		optionsCopy.every((o) => previousCatalogState.options.includes(o))
	) {
		return previousCatalogState
	}

	await paths.write(
		catalogStatePath,
		JSON.stringify(cleanCatalogState),
		catalogStateStorageOptions,
	)

	return cleanCatalogState
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

				const catalogState = await syncCatalogState(
					createdPlugin,
					catalog,
					args,
				)

				const pageSize = args!.options!.find(
					(o) => o.name === "preferredPageSize",
				)!.input as number

				const skip = args!.options!.find((o) => o.name === "skip")!
					.input as number

				while (catalogState.fetchedItems.length < skip + pageSize) {
					let newUrl =
						urlExceptManifest +
						"/catalog/" +
						catalog.type +
						"/" +
						catalog.id

					// Using catalogState since it doesn't include skip, we need realSkip and want to avoid items like preferredPageSize also
					if (catalogState.options) {
						newUrl +=
							"/" +
							catalogState.options
								.map((o) => o.name + "=" + o.input)
								.join("&")
					}
					newUrl += `&skip=${catalogState.realSkip}`
					newUrl += ".json"

					catalogState.realSkip += STREMIO_PAGE_SIZE

					const result = (await (
						await fetch(`${newUrl}`)
					).json()) as StremioCatalogResponse

					let mappedData = mapMeta(result.metas)

					mappedData = await removeDuplicateMeta(
						mappedData,
						catalogState,
					)

					catalogState.fetchedItems.push(...mappedData)
				}

				const itemsToReturn = catalogState.fetchedItems.slice(
					skip,
					skip + pageSize,
				)

				const catalogStatePath = getCatalogStatePath(
					createdPlugin.config,
					catalog,
				)
				await paths.write(
					catalogStatePath,
					JSON.stringify(catalogState),
					catalogStateStorageOptions,
				)

				return {
					data: itemsToReturn,
				}
			},
		})
	}
}

async function removeDuplicateMeta(
	mappedData: MetaPreview[],
	catalogState: CatalogState,
) {
	const prevIds = new Set(catalogState.fetchedItems.flatMap((o) => o.ids))

	return mappedData.filter(
		(entry) => !entry.ids.some((id) => prevIds.has(id)),
	)
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
