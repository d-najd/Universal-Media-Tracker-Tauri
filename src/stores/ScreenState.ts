import { RouteObject } from 'react-router'

// TODO mobx.reaction can be used to notify the SessionScreenStackStore when an screen gets modified
export default interface ScreenState {
	route: RouteObject
}
