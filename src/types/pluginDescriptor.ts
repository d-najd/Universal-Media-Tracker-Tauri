import PluginSpec from '@/sdk/types/pluginSpec'

type PluginDescriptor =
	| { uri: string; status: 'enabled'; spec?: PluginSpec }
	| { uri: string; status: 'disabled'; spec?: PluginSpec }
	| { uri: string; status: 'error'; }

export default PluginDescriptor