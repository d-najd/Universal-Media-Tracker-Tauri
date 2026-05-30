import { NavigateFunction } from 'react-router'

let navigate: NavigateFunction | undefined = undefined

export const setNavigator = (nav: NavigateFunction) => {
	navigate = nav
}

export const navigator = () => {
	if (!navigate) {
		throw Error('Navigator not initialized, did you call appInit?')
	}
	return navigate
}
