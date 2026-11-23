// TODO maybe move this to the sdk? or atleast part of it?
// TODO finish this
export class StorageError extends Error {
	constructor(
		message: string,
		readonly cause?: unknown,
	) {
		super(message)
		this.name = new.target.name
	}
}
