import { afterEach, beforeAll, describe, expect, it } from "vitest"
import IDBDirStorage from "../../../../../src/lib/storage/directory-storage/IDBDirStorage.ts"

describe("IDBDirStorage.write", () => {
	let storage: IDBDirStorage

	beforeAll(async () => {
		const dbName = `db-${crypto.randomUUID()}`
		storage = await IDBDirStorage.create(dbName, "store-test")
	})

	afterEach(async () => {
		await storage.deleteAll()
	})

	describe("basic writes", () => {
		it("writes a new file", async () => {
			await storage.write("test.json", "Hello")

			const result = await storage.read("test.json")

			expect(result).toEqual("Hello")
		})

		it("overwrites an existing file", async () => {
			await storage.write("test.json", "First")
			await storage.write("test.json", "Second")

			const result = await storage.read("test.json")

			expect(result).toEqual("Second")
		})

		it("writes files in nested directories", async () => {
			await storage.write("movies/action/movie.json", "Matrix")

			const result = await storage.read("movies/action/movie.json")

			expect(result).toEqual("Matrix")
		})

		it("creates parent directories automatically", async () => {
			await storage.write("a/b/c/test.json", "Hello")

			const root = await storage.list("a/")

			expect(root).toHaveLength(1)
			expect(root[0].name).toEqual("b")
		})
	})

	describe("validation", () => {
		it("rejects files without extensions", async () => {
			await expect(storage.write("test", "Hello")).rejects.toThrow()
		})
		it("rejects directory paths", async () => {
			await expect(storage.write("folder/", "Hello")).rejects.toThrow()
		})
	})

	describe("stored data types", () => {
		it("stores empty strings", async () => {
			await storage.write("empty.json", "")

			const result = await storage.read("empty.json")

			expect(result).toEqual("")
		})

		it("stores JSON strings", async () => {
			const data = JSON.stringify({
				name: "test",
				value: 123,
			})
			await storage.write("data.json", data)

			const result = await storage.read("data.json")

			expect(result).toEqual(data)
		})

		it("stores binary data", async () => {
			const data = new Uint8Array([1, 2, 3])
			await storage.write("data.bin", data)

			const result = await storage.read("data.bin")

			expect(result).toEqual(data)
		})
	})

	describe("policy behavior", () => {
		it("writes file into specified policy", async () => {
			await storage.write("test.json", "Hello", {
				policy: "cache",
			})

			expect(
				await storage.read("test.json", {
					policy: "cache",
				}),
			).toEqual("Hello")
		})

		it("moves a file when written to another policy", async () => {
			await storage.write("test.json", "Cache", {
				policy: "cache",
			})
			await storage.write("test.json", "Persistent", {
				policy: "persistent",
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
			).toEqual("Persistent")
		})

		it("keeps existing policy when overwriting without policy", async () => {
			await storage.write("test.json", "old", {
				policy: "persistent",
			})
			await storage.write("test.json", "new")

			let result = await storage.read("test.json")

			expect(result).toEqual("new")

			// Try with different policy in case previous was default
			await storage.write("test.json", "old", {
				policy: "cache",
			})
			await storage.write("test.json", "new")

			result = await storage.read("test.json")

			expect(result).toEqual("new")
		})
	})

	describe("profile behaviour", () => {
		it("writes data into a specific profile", async () => {
			await storage.write("test.json", "Hello", {
				profile: "user-1",
			})

			expect(
				await storage.read("test.json", {
					profile: "user-1",
				}),
			).toEqual("Hello")
		})

		it("does not overwrite the same path in another profile", async () => {
			await storage.write("test.json", "profile-a", {
				profile: "a",
			})
			await storage.write("test.json", "profile-b", {
				profile: "b",
			})

			expect(
				await storage.read("test.json", {
					profile: "a",
				}),
			).toEqual("profile-a")
			expect(
				await storage.read("test.json", {
					profile: "b",
				}),
			).toEqual("profile-b")
		})
	})
})
