import { afterEach, beforeAll, describe, expect, it } from "vitest"
import IDBDirStorage from "../../../../../src/lib/storage/directory-storage/IDBDirStorage.ts"

describe("IDBDirStorage.delete", () => {
	let storage: IDBDirStorage

	beforeAll(async () => {
		const dbName = `db-${crypto.randomUUID()}`
		storage = await IDBDirStorage.create(dbName, "store-test")
	})

	afterEach(async () => {
		await storage.deleteAll()
	})

	describe("files", () => {
		it("deletes an existing file", async () => {
			await storage.write("test.json", "Hello")
			await storage.delete("test.json")

			await expect(storage.read("test.json")).rejects.toThrow()
		})

		it("does not delete sibling files", async () => {
			await storage.write("a.json", "A")
			await storage.write("b.json", "B")

			await storage.delete("a.json")

			await expect(storage.read("a.json")).rejects.toThrow()
			expect(await storage.read("b.json")).toEqual("B")
		})

		it("deleting a missing file does not throw", async () => {
			await expect(storage.delete("missing.json")).resolves.not.toThrow()
		})
	})

	describe("directories", () => {
		it("deletes a directory recursively", async () => {
			await storage.write("folder/a.json", "A")
			await storage.write("folder/b.json", "B")

			await storage.delete("folder")

			await expect(storage.read("folder/a.json")).rejects.toThrow()
			await expect(storage.read("folder/b.json")).rejects.toThrow()
		})

		it("removes empty parent directories after deleting file", async () => {
			await storage.write("a/b/test.json", "Hello")
			await storage.delete("a/b/test.json")

			const result = await storage.list("")
			expect(result).toEqual([])
		})

		it("keeps parent directories containing other files", async () => {
			await storage.write("a/one.json", "one")
			await storage.write("a/two.json", "two")

			await storage.delete("a/one.json")

			const result = await storage.list("a")
			expect(result).toContainEqual({
				name: "two.json",
				path: "a/two.json",
				type: "file",
			})
		})
	})

	describe("policy behavior", () => {
		it("deletes only from selected policy", async () => {
			await storage.write("test.json", "cache", {
				policy: "cache",
			})
			await storage.write("test.json", "persistent", {
				policy: "persistent",
			})

			await storage.delete("test.json", {
				policy: "cache",
			})

			await expect(
				storage.read("test.json", {
					policy: "cache",
				}),
			).rejects.toThrow()
			expect(
				await storage.read("test.json", {
					policy: "persistent",
				}),
			).toEqual("persistent")
		})

		it("deletes from all policies when policy is omitted", async () => {
			await storage.write("test.json", "cache", {
				policy: "cache",
			})
			await storage.write("other.json", "persistent", {
				policy: "persistent",
			})

			await storage.delete("test.json")

			await expect(storage.read("test.json")).rejects.toThrow()
			expect(await storage.read("other.json")).toEqual("persistent")
		})
	})

	describe("profile behavior", () => {
		it("deletes only from selected profile", async () => {
			await storage.write("test.json", "profile-a", {
				profile: "a",
			})
			await storage.write("test.json", "profile-b", {
				profile: "b",
			})

			await storage.delete("test.json", {
				profile: "a",
			})

			await expect(
				storage.read("test.json", {
					profile: "a",
				}),
			).rejects.toThrow()
			expect(
				await storage.read("test.json", {
					profile: "b",
				}),
			).toEqual("profile-b")
		})
	})
})
