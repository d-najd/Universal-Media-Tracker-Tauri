/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import * as LucideReact from 'lucide-react'
import * as RadixUi from 'radix-ui'
import * as MelancholySdk from '@d-najd/universal-media-tracker-sdk'
import * as ReactJSXRuntime from 'react/jsx-runtime'
import * as RadixUiReactSlot from '@radix-ui/react-slot'

// Expose to window for dynamic plugins
export default async function initAppGlobals() {
	;(window as any).React = React
	;(window as any).ReactDOM = ReactDOM
	;(window as any).LucideReact = LucideReact
	;(window as any).RadixUi = RadixUi
	;(window as any).MelancholySdk = MelancholySdk
	;(window as any).ReactJSXRuntime = ReactJSXRuntime
	;(window as any).RadixUiReactSlot = RadixUiReactSlot
}
