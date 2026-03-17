import BaseHandlerTypes from '@/sdk/types/baseHandlerTypes'
import BaseHandlerArgs from '@/sdk/types/catalog/baseHandlerArgs'
import BaseHandlerResponse from '@/sdk/types/catalog/baseHandlerResponse'
import Handler from '@/sdk/types/catalog/handler'

type MediaHandler = Handler & {
	name: string
	type: BaseHandlerTypes | string
	callback: (args: BaseHandlerArgs) => Promise<BaseHandlerResponse>
}

export default MediaHandler
