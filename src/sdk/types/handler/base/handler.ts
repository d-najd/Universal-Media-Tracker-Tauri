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

type Handler = {
	id: string
	type: string
	// eslint-disable-next-line
	callback: (args: any) => Promise<any>
}

export default Handler
