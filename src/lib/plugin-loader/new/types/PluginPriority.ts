import { PluginConfig, PluginSpec } from "@d-najd/universal-media-tracker-sdk"

export const classifyPluginPriority = (spec: PluginSpec): number => {
	return spec.handlers
		.flatMap((o) => {
			if (o.type === "plugin-factory") {
				return -20000
			}

			if (o.type === "decorator") {
				return -10000
			}

			return 0
		})
		.sort()[0]
}

export const effectivePluginPriority = (
	spec: PluginSpec,
	config: PluginConfig,
) => {
	const specPriority = classifyPluginPriority(spec)

	if (config.priority) {
		return Math.min(specPriority, config.priority)
	}
	return specPriority
}
