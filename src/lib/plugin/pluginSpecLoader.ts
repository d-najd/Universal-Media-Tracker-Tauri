import PluginSpec from '@/sdk/types/pluginSpec'

/**
 * Only responsible for loading the plugin spec and not the plugin itself
 */
export default interface PluginSpecLoader {
	readonly id: string
	loadPluginSpec(uri: string): Promise<LoadPluginSpecResponse>
}

export type LoadPluginSpecResponse =
	| { readonly status: 'loaded'; readonly spec: PluginSpec }
	| { readonly status: 'skip'; readonly reason?: string }
	| { readonly status: 'invalid'; readonly reason: string }
