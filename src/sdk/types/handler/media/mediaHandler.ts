import MediaHandlerTypes from '@/sdk/types/handler/media/mediaHandlerTypes'
import BaseHandlerArgs from '@/sdk/types/handler/base/baseHandlerArgs'
import BaseHandlerResponse from '@/sdk/types/handler/base/baseHandlerResponse'
import Handler from '@/sdk/types/handler/base/handler'

// TODO add media type
type MediaHandler = Handler<BaseHandlerArgs, BaseHandlerResponse> & {
	name: string
	type: MediaHandlerTypes | string
}

export default MediaHandler
