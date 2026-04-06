import {
	CatalogHandlerArgs,
	CatalogHandlerResponse,
	MetaPreview,
	Plugin,
	PluginConfig,
	PluginFactoryHandlerArgs,
	PluginFactoryHandlerResponse,
	ResourceBrowseOption,
} from '@d-najd/universal-media-tracker-sdk'

const options: PluginConfig = {
	id: 'stremio-plugin-factory',
	name: 'Stremio Plugin Factory',
	version: '0.0.1',
}

const plugin = new Plugin(options)

type StremioManifest = {
	id: string
	name: string
	version: string
	catalogs: StremioCatalogEntry[]
}

type StremioCatalogEntry = {
	id: string
	name: string
	type: string
	extra?: StremioCatalogEntryExtra[]
	// poster: string
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

type StremioCatalogEntryResponse = {
	id: string
	type: string
	name: string
	poster: string
}

let inputArgs: PluginFactoryHandlerArgs
const MANIFEST_STRING = '/manifest.json'

plugin.definePluginFactoryHandler({
	async callback(
		args: PluginFactoryHandlerArgs,
	): Promise<PluginFactoryHandlerResponse> {
		inputArgs = args
		if (!args.url.endsWith(MANIFEST_STRING)) {
			return { status: 'skip' }
		}

		try {
			const manifest = (await (
				await fetch(`${args.url}`)
			).json()) as StremioManifest

			const plugin = new Plugin({
				id: manifest.id,
				name: manifest.name,
				version: manifest.version,
			})

			defineCatalogs(plugin, manifest)

			return { status: 'valid', plugin: plugin }
		} catch (e) {
			return { status: 'invalid', reason: e!.toString() }
		}
	},
})

function defineCatalogs(plugin: Plugin, manifest: StremioManifest) {
	for (const catalog of manifest.catalogs) {
		const options = catalog.extra
			?.filter(
				(o) => resourceBrowseOptionArgToTypeConverter(o) !== 'unknown',
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

		plugin.defineCatalogHandler({
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
					'/catalog/' +
					catalog.type +
					'/' +
					catalog.id
				if (args.options) {
					newUrl +=
						'/' +
						args.options
							.map((o) => o.name + '=' + o.input)
							.join('&')
				}
				newUrl += '.json'

				const result = (await (
					await fetch(`${newUrl}`)
				).json()) as StremioCatalogResponse

				const mappedData = result.metas.map((o) => {
					const metaPreview: MetaPreview = {
						id: o.id,
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

function resourceBrowseOptionArgToTypeConverter(
	arg: StremioCatalogEntryExtra,
): string {
	if (arg.name === 'search') {
		return 'string'
	}
	if (arg.name === 'skip') {
		return 'number'
	}
	if (!arg.options) {
		if (!arg.optionsLimit && arg.optionsLimit === 1) {
			return 'radio'
		}
		return 'checkbox'
	}
	return 'unknown'
}

export default plugin
