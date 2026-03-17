import MediaHandlerTypes from '@/sdk/types/handler/media/mediaHandlerTypes'
import BaseHandlerArgs from '@/sdk/types/handler/base/baseHandlerArgs'
import BaseHandlerResponse from '@/sdk/types/handler/base/baseHandlerResponse'
import Handler from '@/sdk/types/handler/base/handler'

type MediaHandler = Handler & {
	name: string
	type: MediaHandlerTypes | string
	callback: (args: BaseHandlerArgs) => Promise<BaseHandlerResponse>
}

export default MediaHandler
