import { Plugin } from '@d-najd/universal-media-tracker-sdk'

/**
 * Only responsible for loading the plugin spec and not the plugin itself
 */
export default interface PluginSpecParser {
	readonly id: string
	loadPlugin(uri: string): Promise<ParsePluginResponse>
}

export type ParsePluginResponse =
	| { readonly status: 'valid'; readonly code: string }
	| { readonly status: 'validOld'; readonly plugin: Plugin }
	| { readonly status: 'skip'; readonly reason?: string }
	| { readonly status: 'invalid'; readonly reason: string }
