/**
 * Only responsible for loading the plugin spec and not the plugin itself
 */
export type ParsePluginResponse =
	| { readonly status: 'valid'; readonly code: string }
	| { readonly status: 'skip'; readonly reason?: string }
	| { readonly status: 'invalid'; readonly reason: string }
