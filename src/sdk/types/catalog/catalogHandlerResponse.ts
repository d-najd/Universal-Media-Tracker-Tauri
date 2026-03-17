import MetaPreview from '@/sdk/types/catalog/metaPreview'
import BaseHandlerResponse from '@/sdk/types/catalog/baseHandlerResponse'

type CatalogHandlerResponse = BaseHandlerResponse & {
	readonly data: MetaPreview[]
}

export default CatalogHandlerResponse
