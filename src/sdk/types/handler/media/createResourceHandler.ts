import ResourceHandler from '@/sdk/types/handler/media/resourceHandler'
import BaseHandlerArgs from '@/sdk/types/handler/base/baseHandlerArgs'
import BaseHandlerResponse from '@/sdk/types/handler/base/baseHandlerResponse'

type CreateResourceHandler<
	T extends BaseHandlerArgs = BaseHandlerArgs,
	R extends BaseHandlerResponse = BaseHandlerResponse
> = Omit<ResourceHandler<T, R>, 'id' | 'name'> & {
	id?: string
	name?: string
}

export default CreateResourceHandler
