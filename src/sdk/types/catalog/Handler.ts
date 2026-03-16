import BaseHandlerTypes from '@/sdk/types/baseHandlerTypes'

/*
 * Represents a plugin handler.
 *
 * @remarks
 * - `type` can be a predefined `BaseHandlerTypes` value or any custom string.
 *   Custom types must be handled by the plugin author.
 * - `id` is a unique identifier for the handler. If a handler with the same
 *   id exists, it will be overridden.
 * - `callback` callback function that is called when the handler is invoked
 */
type Handler = {
	id: string
	type: BaseHandlerTypes | string
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	callback: (args: any) => Promise<any>
}

export default Handler
