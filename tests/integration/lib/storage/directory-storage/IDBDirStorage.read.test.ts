import { afterEach, beforeAll, describe, expect, it } from "vitest"
import IDBDirStorage from "../../../../../src/lib/storage/directory-storage/IDBDirStorage.ts"

describe("IDBDirStorage.read", () => {
	let storage: IDBDirStorage

	beforeAll(async () => {
		const dbName = `db-${crypto.randomUUID()}`
		storage = await IDBDirStorage.create(dbName, "store-test")
	})

	afterEach(async () => {
		await storage.deleteAll()
	})

	describe("basic reads", () => {
		it("reads an existing file", async () => {
			await storage.write("test.json", "Hello")

			expect(await storage.read("test.json")).toEqual("Hello")
		})

		it("reads nested files", async () => {
			await storage.write("a/b/test.json", "Hello")

			expect(await storage.read("a/b/test.json")).toEqual("Hello")
		})
	})

	describe("validation and errors", () => {
		it("throws when file does not exist", async () => {
			await expect(storage.read("missing.json")).rejects.toThrow()
		})

		it("throws when path has no extension", async () => {
			await expect(storage.read("missing")).rejects.toThrow()
		})
	})

	describe("policy behavior", () => {
		it("reads from specified policy", async () => {
			await storage.write("test.json", "cache", {
				policy: "cache",
			})

			expect(
				await storage.read("test.json", {
					policy: "cache",
				}),
			).toEqual("cache")
		})

		it("does not fallback when policy is specified", async () => {
			await storage.write("test.json", "persistent", {
				policy: "persistent",
			})

			await expect(
				storage.read("test.json", {
					policy: "cache",
				}),
			).rejects.toThrow()
		})

		it("searches policies when policy is omitted", async () => {
			await storage.write("test.json", "persistent", {
				policy: "persistent",
			})

			expect(await storage.read("test.json")).toEqual("persistent")
		})
	})

	describe("profile behavior", () => {
		it("reads from specified profile", async () => {
			await storage.write("test.json", "profile-data", {
				profile: "custom",
			})

			expect(
				await storage.read("test.json", {
					profile: "custom",
				}),
			).toEqual("profile-data")
		})

		it("does not read a file from another profile", async () => {
			await storage.write("test.json", "profile-a", {
				profile: "a",
			})

			await expect(
				storage.read("test.json", {
					profile: "b",
				}),
			).rejects.toThrow()
		})
	})

	describe("profile and policy interaction", () => {
		it("searches policies only inside the selected profile", async () => {
			await storage.write("test.json", "custom-profile-cache", {
				profile: "user-1",
				policy: "cache",
			})

			expect(
				await storage.read("test.json", {
					profile: "user-1",
				}),
			).toEqual("custom-profile-cache")
			await expect(
				storage.read("test.json", {
					profile: "user-2",
				}),
			).rejects.toThrow()
		})
	})
})
