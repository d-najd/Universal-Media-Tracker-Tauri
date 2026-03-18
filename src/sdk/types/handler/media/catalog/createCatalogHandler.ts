import CreateResourceHandler from '@/sdk/types/handler/media/createResourceHandler'
import CatalogHandlerArgs from '@/sdk/types/handler/media/catalog/catalogHandlerArgs'
import CatalogHandlerResponse from '@/sdk/types/handler/media/catalog/catalogHandlerResponse'
import ResourceHandlerType from '@/sdk/types/handler/media/resourceHandlerType'

type CreateCatalogHandler = Omit<
	CreateResourceHandler<CatalogHandlerArgs, CatalogHandlerResponse>,
	'type'
> & {
	type?: ResourceHandlerType | string
}

export default CreateCatalogHandler
