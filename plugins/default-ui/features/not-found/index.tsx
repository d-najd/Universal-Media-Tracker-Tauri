import {
	ErrorView,
	ErrorHeader,
	ErrorDescription,
	ErrorActions,
} from './components/error-base'
import { Button } from '../../components/button'
import plugin from '../..'

export default function NotFoundErrorPage() {
	return (
		<>
			<ErrorView>
				<ErrorHeader>Page not found</ErrorHeader>
				<ErrorDescription>
					Sorry, we couldn’t find the page you’re looking for.
				</ErrorDescription>
				<ErrorActions>
					<Button
						size="lg"
						onClick={() => plugin.app.ui.navigator.pop()}
					>
						Go back
					</Button>
					<Button size="lg" variant="ghost">
						Contact support{' '}
						<span aria-hidden="true" className="ml-1">
							&rarr;
						</span>
					</Button>
				</ErrorActions>
			</ErrorView>
		</>
	)
}

// Necessary for react router to lazy load.
export const Component = NotFoundErrorPage
