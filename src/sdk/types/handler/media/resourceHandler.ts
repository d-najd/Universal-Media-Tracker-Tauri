import ResourceHandlerType from '@/sdk/types/handler/media/resourceHandlerType'
import BaseHandlerArgs from '@/sdk/types/handler/base/baseHandlerArgs'
import BaseHandlerResponse from '@/sdk/types/handler/base/baseHandlerResponse'
import Handler from '@/sdk/types/handler/base/handler'
import ResourceType from '@/sdk/types/handler/media/resourceType'

// TODO add media type
type ResourceHandler<
	T extends BaseHandlerArgs = BaseHandlerArgs,
	R extends BaseHandlerResponse = BaseHandlerResponse
> = Handler<T, R> & {
	/**
	 * Displayed in the app
	 */
	name: string
	type: ResourceHandlerType | string
	resourceType: ResourceType | string
}

export default ResourceHandler
