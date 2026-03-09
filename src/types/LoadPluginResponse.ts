import PluginSpec from '@/sdk/types/pluginSpec'

export type LoadPluginResponse =
	| { status: 'loaded'; spec: PluginSpec }
	| { status: 'skip'; reason?: string }
	| { status: 'invalid'; reason: string }