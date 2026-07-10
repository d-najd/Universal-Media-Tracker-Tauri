import { describe, expect, it } from "vitest"
import IDBDirStorage from "../../../../../src/lib/storage/directory-storage/IDBDirStorage.ts"

describe("IDBDirStorage", () => {
	it("Test", async () => {
		const storage = await IDBDirStorage.create("db-test", "store-test")

		await storage.write("test.json", "Hello")
		const result = await storage.read("test.json")

		expect(result).toEqual({
			content: "Hello",
		})
	})
})
