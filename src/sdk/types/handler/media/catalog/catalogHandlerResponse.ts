import MetaPreview from '@/sdk/types/handler/media/catalog/metaPreview'
import BaseHandlerResponse from '@/sdk/types/handler/base/baseHandlerResponse'

type CatalogHandlerResponse = BaseHandlerResponse & {
	readonly data: MetaPreview[]
}

export default CatalogHandlerResponse
