import {
	LocalPluginConfig,
	Plugin,
	PluginSpec,
} from "@d-najd/universal-media-tracker-sdk"

/**
 * In-memory state of a plugin known to the PluginManager.
 *
 *   unresolved ──resolve──► stored-pending ──load──► enabled
 *        │                        ▲                    │
 *        │                        └─────unload─────────┘
 *        │
 *        └──resolve fails──► error
 *
 * `config.status` (on disk) holds user intent ("enabled" | "disabled").
 * `PluginEntry.status` (in memory) holds load state. They are independent.
 */
type PluginEntry =
	/** Loaded, instance in memory, `onLoad()` has run. */
	| {
			readonly status: "enabled"
			readonly plugin: Plugin
			readonly spec: PluginSpec
			readonly config: LocalPluginConfig
	  }
	/** On disk, not loaded. Becomes `enabled` on next load, if user-enabled. */
	| {
			readonly status: "stored-pending"
			readonly config: LocalPluginConfig
	  }
	/** URL known, not yet resolved or persisted. */
	| {
			readonly status: "unresolved"
			readonly url: string
	  }
	/** Resolution or activation failed. `config` present if failure was post-persist. */
	| {
			readonly status: "error"
			readonly url: string
			readonly config?: LocalPluginConfig
			readonly error: Error
	  }

export default PluginEntry
