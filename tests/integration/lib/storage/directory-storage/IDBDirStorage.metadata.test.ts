import { afterEach, beforeAll, describe, expect, it } from "vitest"
import IDBDirStorage from "../../../../../src/lib/storage/directory-storage/IDBDirStorage.ts"
import DirStorageOptions from "../../../../../src/lib/storage/directory-storage/DirStorageOptions.ts"

describe("IDBDirStorage.metadata", () => {
	let storage: IDBDirStorage

	beforeAll(async () => {
		const dbName = `db-${crypto.randomUUID()}`
		storage = await IDBDirStorage.create(dbName, "store-test")
	})

	afterEach(async () => {
		await storage.deleteAll()
	})

	describe("readMetadata", () => {
		it("returns metadata for an existing file", async () => {
			await storage.write("test.json", "Hello")

			const metadata = await storage.readMetadata("test.json")

			expect(metadata).not.toBeNull()
			expect(metadata).toMatchObject({
				backend: "indexeddb",
				profile: "default",
			})
		})

		it("throw for missing file", async () => {
			await expect(storage.readMetadata("missing.json")).rejects.toThrow()
		})

		it("stores createdAt and updatedAt", async () => {
			await storage.write("test.json", "Hello")

			const metadata = await storage.readMetadata("test.json")

			expect(metadata?.createdAt).toBeTypeOf("number")
			expect(metadata?.updatedAt).toBeTypeOf("number")
		})

		it("uses default profile when profile is omitted", async () => {
			await storage.write("test.json", "Hello")

			const metadata = await storage.readMetadata("test.json")

			expect(metadata?.profile).toEqual("default")
		})

		it("uses provided profile", async () => {
			await storage.write("test.json", "Hello", {
				profile: "user-1",
			})
			const metadata = await storage.readMetadata("test.json", {
				profile: "user-1",
			})

			expect(metadata?.profile).toEqual("user-1")
		})

		it("stores custom metadata", async () => {
			await storage.write("test.json", "Hello", {
				custom: {
					source: "test",
				},
			})

			const metadata = await storage.readMetadata("test.json")

			expect(metadata?.custom).toEqual({
				source: "test",
			})
		})

		it("stores ttl metadata", async () => {
			await storage.write("test.json", "Hello", {
				ttl: 5000,
			})

			const metadata = await storage.readMetadata("test.json")

			expect(metadata?.ttl).toEqual(5000)
		})
	})

	describe("metadata", () => {
		it("stores metadata options", async () => {
			const options: Partial<DirStorageOptions> = {
				policy: "persistent",
				profile: "custom",
				ttl: 1000,
				custom: {
					source: "test",
				},
			}
			await storage.write("test.json", "Hello", options)

			const metadata = await storage.readMetadata("test.json", options)

			expect(metadata).toMatchObject({
				policy: "persistent",
				profile: "custom",
				ttl: 1000,
				custom: {
					source: "test",
				},
			})
		})

		it("keeps createdAt when overwriting", async () => {
			await storage.write("test.json", "First")

			const before = await storage.readMetadata("test.json")
			await storage.write("test.json", "Second")

			const after = await storage.readMetadata("test.json")
			expect(after?.createdAt).toEqual(before?.createdAt)
		})

		it("updates updatedAt when overwriting", async () => {
			await storage.write("test.json", "First")

			const before = await storage.readMetadata("test.json")
			await new Promise((resolve) => setTimeout(resolve, 5))

			await storage.write("test.json", "Second")
			const after = await storage.readMetadata("test.json")

			expect(after?.updatedAt).toBeGreaterThanOrEqual(before!.updatedAt)
		})
	})

	describe("policy", () => {
		it("stores explicitly provided policy", async () => {
			await storage.write("test.json", "Hello", {
				policy: "persistent",
			})

			const metadata = await storage.readMetadata("test.json")

			expect(metadata?.policy).toEqual("persistent")
		})

		it("reads metadata only from selected policy", async () => {
			await storage.write("test.json", "Hello", {
				policy: "persistent",
			})

			await expect(
				storage.readMetadata("test.json", { policy: "cache" }),
			).rejects.toThrow()
		})

		it("reads metadata from matching policy", async () => {
			await storage.write("test.json", "Hello", {
				policy: "persistent",
			})

			const metadata = await storage.readMetadata("test.json", {
				policy: "persistent",
			})

			expect(metadata?.policy).toEqual("persistent")
		})
	})

	describe("profile isolation", () => {
		it("does not return metadata from another profile", async () => {
			await storage.write("test.json", "Hello", {
				profile: "user-a",
			})

			await expect(
				storage.readMetadata("test.json", { profile: "user-b" }),
			).rejects.toThrow()
		})

		it("returns metadata from matching profile", async () => {
			await storage.write("test.json", "Hello", {
				profile: "user-a",
			})

			const metadata = await storage.readMetadata("test.json", {
				profile: "user-a",
			})

			expect(metadata?.profile).toEqual("user-a")
		})

		it("uses default profile when reading without profile", async () => {
			await storage.write("test.json", "custom", {
				profile: "user-1",
			})

			await expect(storage.readMetadata("test.json")).rejects.toThrow()
		})
	})
})
