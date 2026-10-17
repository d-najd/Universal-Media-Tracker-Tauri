import { afterEach, beforeAll, describe, expect, it } from "vitest"
import IDBDirStorage from "../../../../../src/lib/storage/directory-storage/IDBDirStorage.ts"

describe("IDBDirStorage.list", () => {
	let storage: IDBDirStorage

	beforeAll(async () => {
		const dbName = `db-${crypto.randomUUID()}`
		storage = await IDBDirStorage.create(dbName, "store-test")
	})

	afterEach(async () => {
		await storage.deleteAll()
	})

	describe("basic listing", () => {
		it("returns empty list for empty directory", async () => {
			const result = await storage.list("")

			expect(result).toEqual([])
		})

		it("lists files with correct DirEntry data", async () => {
			await storage.write("test.json", "Hello")

			const result = await storage.list("")

			expect(result).toContainEqual({
				name: "test.json",
				path: "test.json",
				type: "file",
			})
		})

		it("lists multiple files", async () => {
			await storage.write("a.json", "A")
			await storage.write("b.json", "B")

			const result = await storage.list("")

			expect(result).toEqual(
				expect.arrayContaining([
					{
						name: "a.json",
						path: "a.json",
						type: "file",
					},
					{
						name: "b.json",
						path: "b.json",
						type: "file",
					},
				]),
			)
			expect(result).toHaveLength(2)
		})
	})

	describe("directory behaviour", () => {
		it("lists directories with correct DirEntry data", async () => {
			await storage.write("folder/test.json", "Hello")

			const result = await storage.list("")

			expect(result).toContainEqual({
				name: "folder",
				path: "folder",
				type: "directory",
			})
		})

		it("lists only direct children", async () => {
			await storage.write("a/b/c.json", "Hello")

			const result = await storage.list("a")

			expect(result).toEqual([
				{
					name: "b",
					path: "a/b",
					type: "directory",
				},
			])
		})

		it("lists files inside nested directory", async () => {
			await storage.write("a/b.json", "Hello")

			const result = await storage.list("a")

			expect(result).toEqual([
				{
					name: "b.json",
					path: "a/b.json",
					type: "file",
				},
			])
		})
	})

	describe("profile behavior", () => {
		it("lists only files from the selected profile", async () => {
			await storage.write("a.json", "profile-a", {
				profile: "a",
			})
			await storage.write("b.json", "profile-b", {
				profile: "b",
			})

			const result = await storage.list("", {
				profile: "a",
			})

			expect(result).toHaveLength(1)
			expect(result).toEqual([
				{
					name: "a.json",
					path: "a.json",
					type: "file",
				},
			])
		})
	})

	describe("policy behavior", () => {
		it("lists all policies when policy is omitted", async () => {
			await storage.write("cache.json", "cache", {
				policy: "cache",
			})
			await storage.write("persistent.json", "persistent", {
				policy: "persistent",
			})

			const result = await storage.list("")

			expect(result).toEqual(
				expect.arrayContaining([
					{
						name: "cache.json",
						path: "cache.json",
						type: "file",
					},
					{
						name: "persistent.json",
						path: "persistent.json",
						type: "file",
					},
				]),
			)
		})

		it("only lists selected policy", async () => {
			await storage.write("cache.json", "cache", {
				policy: "cache",
			})
			await storage.write("persistent.json", "persistent", {
				policy: "persistent",
			})

			const result = await storage.list("", {
				policy: "cache",
			})

			expect(result).toEqual([
				{
					name: "cache.json",
					path: "cache.json",
					type: "file",
				},
			])
		})

		it("does not include files from another policy in the same directory", async () => {
			await storage.write("users/cache.json", "cache", {
				policy: "cache",
			})
			await storage.write("users/persistent.json", "persistent", {
				policy: "persistent",
			})

			const result = await storage.list("users", {
				policy: "cache",
			})

			expect(result).toEqual([
				{
					name: "cache.json",
					path: "users/cache.json",
					type: "file",
				},
			])
		})
	})
})
