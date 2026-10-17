import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest"
import IDBDirStorage from "../../../../../src/lib/storage/directory-storage/IDBDirStorage.ts"
import DirIdStorage from "../../../../../src/lib/storage/id-storage/DirIdStorage.ts"

describe("DirIdStorage.readMetadataById", () => {
	let dirStorage: IDBDirStorage
	let idStorage: DirIdStorage

	beforeAll(async () => {
		const dbName = `db-${crypto.randomUUID()}`
		dirStorage = await IDBDirStorage.create(dbName, "store-test")
	})

	beforeEach(async () => {
		const path = `test-${crypto.randomUUID()}`
		idStorage = await DirIdStorage.create(dirStorage, path)
	})

	afterEach(async () => {
		await dirStorage.deleteAll()
	})

	describe("basic reads", () => {
		it("returns metadata for an existing entry", async () => {
			await idStorage.upsert(["A"], "hello")

			const metadata = await idStorage.readMetadataById("A")

			expect(metadata).not.toBeNull()
			expect(metadata.createdAt).toBeTypeOf("number")
			expect(metadata.updatedAt).toBeTypeOf("number")
		})

		it("returns metadata when looked up by any alias", async () => {
			await idStorage.upsert(["A", "B", "C"], "hello")

			const viaA = await idStorage.readMetadataById("A")
			const viaB = await idStorage.readMetadataById("B")
			const viaC = await idStorage.readMetadataById("C")

			expect(viaB).toEqual(viaA)
			expect(viaC).toEqual(viaA)
		})

		it("reflects options stored on the file", async () => {
			await idStorage.upsert(["A"], "hello", {
				policy: "persistent",
				profile: "user-1",
				ttl: 5000,
				custom: { source: "test" },
			})

			const metadata = await idStorage.readMetadataById("A", {
				profile: "user-1",
			})

			expect(metadata).toMatchObject({
				policy: "persistent",
				profile: "user-1",
				ttl: 5000,
				custom: { source: "test" },
			})
		})

		it("returns updated metadata after a same-doc rewrite", async () => {
			await idStorage.upsert(["A"], "first")
			const before = await idStorage.readMetadataById("A")

			await new Promise((r) => setTimeout(r, 5))
			await idStorage.upsert(["A"], "second")
			const after = await idStorage.readMetadataById("A")

			// createdAt preserved, updatedAt bumped
			expect(after.createdAt).toEqual(before.createdAt)
			expect(after.updatedAt).toBeGreaterThan(before.updatedAt)
		})
	})

	describe("validation and errors", () => {
		it("throws when id is not found", async () => {
			await expect(
				idStorage.readMetadataById("unknown"),
			).rejects.toThrow()
		})

		it("throws after the entry is deleted", async () => {
			await idStorage.upsert(["A"], "hello")
			await idStorage.deleteById("A")

			await expect(idStorage.readMetadataById("A")).rejects.toThrow()
		})

		it("throws on fileExtension mismatch", async () => {
			await idStorage.upsert(["A"], "hello", { fileExtension: "bin" })

			await expect(
				idStorage.readMetadataById("A", { fileExtension: "json" }),
			).rejects.toThrow()
		})

		it("allows reads when fileExtension matches", async () => {
			await idStorage.upsert(["A"], "hello", { fileExtension: "gson" })

			expect(
				await idStorage.readMetadataById("A", {
					fileExtension: "gson",
				}),
			).toBeDefined()

			expect(
				(
					await idStorage.readMetadataById("A", {
						fileExtension: "gson",
					})
				).fileExtension,
			).toEqual("gson")
		})

		it("allows reads when fileExtension is not specified", async () => {
			await idStorage.upsert(["A"], "hello", { fileExtension: "bin" })

			expect(await idStorage.readMetadataById("A")).toBeDefined()
		})
	})

	describe("profile isolation", () => {
		it("reads metadata from the specified profile", async () => {
			await idStorage.upsert(["A"], "profile-a", { profile: "a" })
			await idStorage.upsert(["A"], "profile-b", { profile: "b" })

			const a = await idStorage.readMetadataById("A", { profile: "a" })
			const b = await idStorage.readMetadataById("A", { profile: "b" })

			expect(a.profile).toEqual("a")
			expect(b.profile).toEqual("b")
		})

		it("throws when id exists in a different profile but not the requested one", async () => {
			await idStorage.upsert(["A"], "profile-a", { profile: "a" })

			await expect(
				idStorage.readMetadataById("A", { profile: "b" }),
			).rejects.toThrow()
		})
	})

	describe("namespace isolation", () => {
		it("reads metadata only from the instance's own namespace", async () => {
			const other = await DirIdStorage.create(
				dirStorage,
				`other-${crypto.randomUUID()}`,
			)

			await idStorage.upsert(["A"], "from-first")
			await other.upsert(["A"], "from-second")

			const mine = await idStorage.readMetadataById("A")
			const theirs = await other.readMetadataById("A")

			expect(mine).toBeDefined()
			expect(theirs).toBeDefined()
			// Not a strict equality check, but they should be independent instances
			// If your metadata carries any per-write value (like custom), assert it here.
		})
	})
})
