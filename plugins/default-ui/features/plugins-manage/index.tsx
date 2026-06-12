import {
	Avatar,
	Card,
	CardContent,
	CardHeader,
	createTheme,
	IconButton,
	Stack,
	ThemeProvider,
	Typography,
} from "@mui/material"
import plugin from "../.."
import { Settings } from "@mui/icons-material"

const darkTheme = createTheme({
	cssVariables: true,
	shape: {
		borderRadius: "12px",
	},
	palette: {
		mode: "dark",
	},
})

export default function PluginsManagePage() {
	const localPluginSpecs = plugin.app.plugin.getLocalPluginConfigs()

	return (
		<ThemeProvider theme={darkTheme}>
			<Stack sx={{ px: 2, py: 2 }} spacing={1.5}>
				{localPluginSpecs.map((item) => (
					<Card key={item.id}>
						<CardHeader
							avatar={<Avatar src={item.logo} alt={item.name} />}
							title={item.name}
							subheader={item.status}
							action={
								<IconButton>
									<Settings />
								</IconButton>
							}
						></CardHeader>
						<CardContent>
							<Typography
								variant="body2"
								sx={{ color: "text.secondary" }}
							>
								This impressive paella is a perfect party dish
								and a fun meal to cook together with your
								guests. Add 1 cup of frozen peas along with the
								mussels, if you like.
							</Typography>
						</CardContent>
					</Card>
				))}
			</Stack>
		</ThemeProvider>
	)
}
