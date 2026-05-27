import * as React from 'react'

// plugins/default-ui/index.ts
import { Plugin } from '@d-najd/universal-media-tracker-sdk'

// plugins/default-ui/features/library/example.tsx
import { useState } from 'react'
function ExampleContent() {
	const [example, setExample] = useState('Test')
	return /* @__PURE__ */ React.createElement(
		React.Fragment,
		null,
		/* @__PURE__ */ React.createElement('p', null, example),
	)
}

// plugins/default-ui/index.ts
import React2 from 'react'
var options = {
	id: 'default-ui',
	name: 'Default UI',
	version: '0.0.1',
}
var plugin = new Plugin(options)
plugin.defineScreenHandler({
	pattern: '/',
	// initialState: createZustandStoreWrapper(''),
	async callback(args) {
		const result = {
			content: ExampleContent,
		}
		return result
	},
	callbackSync(args) {
		const result = {
			content: () => React2.createElement(ExampleContent),
		}
		return result
	},
})
var index_default = plugin
export { index_default as default }
