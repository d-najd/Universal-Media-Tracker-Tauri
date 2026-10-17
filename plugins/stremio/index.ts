import {
	CatalogHandlerArgs,
	CatalogHandlerResponse,
	Meta,
	MetaHandlerArgs,
	MetaHandlerResponse,
	MetaPreview,
	Plugin,
	PluginConfig,
	PluginFactoryHandlerArgs,
	PluginFactoryHandlerResponse,
	ResourceBrowseOption,
	ResourceType,
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

			const pluginCreated = new Plugin({
				logo: manifest.logo ?? pluginSelf.config.logo,
				id: manifest.id,
				name: manifest.name,
				version: manifest.version,
			})

			defineCatalogs(pluginCreated, manifest)
			defineMetas(pluginCreated, manifest)

			return { status: "valid", plugin: pluginCreated }
		} catch (e) {
			return { status: "invalid", reason: e!.toString() }
		}
	},
})

function defineCatalogs(pluginCreated: Plugin, manifest: StremioManifest) {
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

		pluginCreated.defineCatalogHandler({
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

				const mappedData = result.metas.map((o) => {
					const ids = Object.fromEntries(
						Object.entries(o).filter(([key]) =>
							key.toLowerCase().endsWith("id"),
						),
					) as Record<string, string>

					const metaPreview: MetaPreview = {
						ids: ids,
						name: o.name,
						poster: o.poster,
						type: o.type,
					}
					return metaPreview
				})

				return {
					data: mappedData,
				}
			},
		})
	}
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
