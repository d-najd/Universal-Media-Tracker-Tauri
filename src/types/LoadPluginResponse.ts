import PluginSpec from '@/sdk/types/pluginSpec'

export type LoadPluginResponse =
	| { readonly status: 'loaded'; readonly spec: PluginSpec }
	| { readonly status: 'skip'; readonly reason?: string }
	| { readonly status: 'invalid'; readonly reason: string }

export default LoadPluginResponse
