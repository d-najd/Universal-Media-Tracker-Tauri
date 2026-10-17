import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest"
import IDBDirStorage from "../../../../../src/lib/storage/directory-storage/IDBDirStorage.ts"
import DirIdStorage from "../../../../../src/lib/storage/id-storage/DirIdStorage.ts"
import IdStorage from "../../../../../src/lib/storage/id-storage/IdStorage.ts"
import DirStorage from "../../../../../src/lib/storage/directory-storage/DirStorage.ts"

describe("DirIdStorage.deleteById", () => {
	let dirStorage: DirStorage
	let idStorage: IdStorage

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

	describe("basic deletes", () => {
		it("deletes an entry when one of its ids is passed", async () => {
			await idStorage.write(["A"], "hello")
			await idStorage.deleteById("A")

			await expect(idStorage.readById("A")).rejects.toThrow()
		})

		it("deletes the data file along with the entry", async () => {
			await idStorage.write(["A"], "hello")

			// capture the actual data path via metadata read
			const meta = await idStorage.readMetadataById("A")
			expect(meta).toBeDefined()

			await idStorage.deleteById("A")

			await expect(idStorage.readById("A")).rejects.toThrow()
			await expect(idStorage.readMetadataById("A")).rejects.toThrow()
		})

		it("removes all aliases pointing at the deleted entry", async () => {
			await idStorage.write(["A", "B", "C"], "hello")

			await idStorage.deleteById("A")

			await expect(idStorage.readById("A")).rejects.toThrow()
			await expect(idStorage.readById("B")).rejects.toThrow()
			await expect(idStorage.readById("C")).rejects.toThrow()
		})

		it("does not delete entries with different docIds", async () => {
			await idStorage.write(["A"], "one")
			await idStorage.write(["B"], "two")

			await idStorage.deleteById("A")

			expect(await idStorage.readById("B")).toEqual("two")
		})
	})

	describe("alias resolution", () => {
		it("works when the passed id is not the first alias", async () => {
			await idStorage.write(["A", "B"], "hello")

			await idStorage.deleteById("B")

			await expect(idStorage.readById("A")).rejects.toThrow()
			await expect(idStorage.readById("B")).rejects.toThrow()
		})

		it("does not affect other entries that share no aliases", async () => {
			await idStorage.write(["A", "B"], "first")
			await idStorage.write(["C", "D"], "second")

			await idStorage.deleteById("B")

			expect(await idStorage.readById("C")).toEqual("second")
			expect(await idStorage.readById("D")).toEqual("second")
		})
	})

	describe("validation and errors", () => {
		it("throws when id is not found", async () => {
			await expect(idStorage.deleteById("unknown")).rejects.toThrow()
		})

		it("throws when deleting the same id twice", async () => {
			await idStorage.write(["A"], "hello")
			await idStorage.deleteById("A")

			await expect(idStorage.deleteById("A")).rejects.toThrow()
		})
	})

	describe("fileExtension validation", () => {
		it("throws when fileExtension doesn't match", async () => {
			await idStorage.write(["A"], "hello", { fileExtension: "bin" })

			await expect(
				idStorage.deleteById("A", { fileExtension: "json" }),
			).rejects.toThrow()
		})

		it("deletes when fileExtension matches", async () => {
			await idStorage.write(["A"], "hello", { fileExtension: "gson" })

			await idStorage.deleteById("A", { fileExtension: "gson" })

			await expect(
				idStorage.readById("A", { fileExtension: "gson" }),
			).rejects.toThrow()
		})
	})

	describe("profile isolation", () => {
		it("deletes only from the selected profile", async () => {
			await idStorage.write(["A"], "profile-a", { profile: "a" })
			await idStorage.write(["A"], "profile-b", { profile: "b" })

			await idStorage.deleteById("A", { profile: "a" })

			await expect(
				idStorage.readById("A", { profile: "a" }),
			).rejects.toThrow()
			expect(await idStorage.readById("A", { profile: "b" })).toEqual(
				"profile-b",
			)
		})
	})

	describe("namespace isolation", () => {
		it("deletes only from the instance's own namespace", async () => {
			const other = await DirIdStorage.create(
				dirStorage,
				`other-${crypto.randomUUID()}`,
			)

			await idStorage.write(["A"], "from-first")
			await other.write(["A"], "from-second")

			await idStorage.deleteById("A")

			await expect(idStorage.readById("A")).rejects.toThrow()
			expect(await other.readById("A")).toEqual("from-second")
		})
	})

	describe("idempotency of the index", () => {
		it("leaves other aliases in the index intact", async () => {
			await idStorage.write(["A"], "one")
			await idStorage.write(["B"], "two")

			await idStorage.deleteById("A")

			// B must still resolve after A's cleanup ran
			expect(await idStorage.readById("B")).toEqual("two")
		})

		it("can re-add a deleted id as a new entry", async () => {
			await idStorage.write(["A"], "first")
			await idStorage.deleteById("A")

			await idStorage.write(["A"], "second")

			expect(await idStorage.readById("A")).toEqual("second")
		})
	})
})
