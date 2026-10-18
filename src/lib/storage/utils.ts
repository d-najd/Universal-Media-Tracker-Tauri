export function ensureTrailingSlash(path: string): string {
	if (path === "") return path
	return path.endsWith("/") ? path : `${path}/`
}
