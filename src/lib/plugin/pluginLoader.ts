import PluginSpec from '@/sdk/types/pluginSpec'

export default interface PluginLoader {
	id: string,
	loadPlugin(uri: string): Promise<LoadPluginResponse>
}

export type LoadPluginResponse =
	| { status: 'loaded'; spec: PluginSpec }
	| { status: 'skip'; reason?: string }
	| { status: 'invalid'; reason: string }