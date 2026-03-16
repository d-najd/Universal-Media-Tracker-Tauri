import Plugin from '@/sdk/pluginSdk'

/**
 * Only responsible for loading the plugin spec and not the plugin itself
 */
export default interface PluginSpecLoader {
	readonly id: string
	loadPlugin(uri: string): Promise<LoadPluginResponse>
}

export type LoadPluginResponse =
	| { readonly status: 'valid'; readonly plugin: Plugin }
	| { readonly status: 'skip'; readonly reason?: string }
	| { readonly status: 'invalid'; readonly reason: string }
