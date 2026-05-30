import { relaunch } from '@tauri-apps/plugin-process'
import {
	ErrorView,
	ErrorHeader,
	ErrorDescription,
	ErrorActions,
} from './error-base'
import { Button } from '../../../components/button'

export default function AppErrorPage() {
	return (
		<ErrorView>
			<ErrorHeader>We&apos;re fixing it</ErrorHeader>
			<ErrorDescription>
				The app encountered an error and needs to be restarted.
				<br />
				We know about it and we&apos;re working to fix it.
			</ErrorDescription>
			<ErrorActions>
				<Button size="lg" onClick={relaunch}>
					Relaunch app
				</Button>
			</ErrorActions>
		</ErrorView>
	)
}
