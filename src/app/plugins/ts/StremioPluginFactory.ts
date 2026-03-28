import {
	CatalogHandlerArgs,
	CatalogHandlerResponse,
	MetaPreview,
	Plugin,
	PluginConfig,
	PluginFactoryHandlerArgs,
	PluginFactoryHandlerResponse
} from '@d-najd/universal-media-tracker-sdk'

const options: PluginConfig = {
	id: 'stremio-plugin-factory',
	name: 'Stremio Plugin Factory',
	version: '0.0.1'
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
	poster: string
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
		args: PluginFactoryHandlerArgs
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
				version: manifest.version
			})

			defineCatalogs(plugin, manifest)

			return { status: 'valid', plugin: plugin }
		} catch (e) {
			return { status: 'invalid', reason: e!.toString() }
		}
	}
})

function defineCatalogs(plugin: Plugin, manifest: StremioManifest) {
	for (const catalog of manifest.catalogs) {
		console.log(catalog)
		plugin.defineCatalogHandler({
			id: catalog.id,
			name: catalog.name,
			resourceType: catalog.type,
			async callback(
				args: CatalogHandlerArgs
			): Promise<CatalogHandlerResponse> {
				// const size = args.pageSize ?? 20
				const urlExceptManifest = inputArgs.url.slice(
					0,
					-MANIFEST_STRING.length
				)

				const newUrl =
					urlExceptManifest +
					'/catalog/' +
					catalog.type +
					'/' +
					catalog.id +
					'.json'
				const result = (await (
					await fetch(`${newUrl}`)
				).json()) as StremioCatalogResponse

				const mappedData = result.metas.map((o) => {
					const metaPreview: MetaPreview = {
						id: o.id,
						name: o.name,
						poster: o.poster,
						type: o.type
					}
					return metaPreview
				})

				return {
					data: mappedData
				}
			}
		})
	}
}

export default plugin
