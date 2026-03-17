/*
 * Represents a plugin handler.
 *
 * @remarks
 * - `type` can be a predefined `MediaHandlerTypes` value or any custom string.
 *   Custom types must be handled by the plugin author.
 * - `id` is a unique identifier for the handler. If a handler with the same
 *   id exists, it will be overridden.
 * - `name` name of the handler that will be displayed in the app
 * - `callback` callback function that is called when the handler is invoked
 */

// eslint-disable-next-line
type Handler<T = any, R = any> = {
	id: string
	type: string
	callback: (args: T) => Promise<R>
}

export default Handler
