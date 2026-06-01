import { Box } from '@mui/material'
import plugin from '../..'

export default function PluginsManagePage() {
	const localPluginSpecs = plugin.app.plugin.getLocalPluginConfigs()

	console.log('COUNT IS ' + localPluginSpecs.length)

	return (
		<>
			{localPluginSpecs.map((item) => (
				<Box key={item.id}>{item.name}</Box>
			))}
		</>
	)
}
