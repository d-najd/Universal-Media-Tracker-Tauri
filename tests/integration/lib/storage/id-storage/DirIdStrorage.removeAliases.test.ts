import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest"
import IDBDirStorage from "../../../../../src/lib/storage/directory-storage/IDBDirStorage"
import DirIdStorage from "../../../../../src/lib/storage/id-storage/DirIdStorage"
import IdStorage from "../../../../../src/lib/storage/id-storage/IdStorage"
import DirStorage from "../../../../../src/lib/storage/directory-storage/DirStorage"

describe("DirIdStorage.removeIds", () => {
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

	describe("basic removals", () => {
		it("removes a single alias but leaves the entry intact", async () => {
			await idStorage.write(["A", "B"], "hello")
			await idStorage.removeAliases("A", ["B"])

			expect(await idStorage.readById("A")).toEqual("hello")
			await expect(idStorage.readById("B")).rejects.toThrow()
		})

		it("removes multiple aliases at once", async () => {
			await idStorage.write(["A", "B", "C", "D"], "hello")
			await idStorage.removeAliases("A", ["B", "C"])

			expect(await idStorage.readById("A")).toEqual("hello")
			expect(await idStorage.readById("D")).toEqual("hello")
			await expect(idStorage.readById("B")).rejects.toThrow()
			await expect(idStorage.readById("C")).rejects.toThrow()
		})

		it("can target the entry using an alias that is being removed", async () => {
			await idStorage.write(["A", "B"], "hello")

			await idStorage.removeAliases("B", ["B"])

			expect(await idStorage.readById("A")).toEqual("hello")
			await expect(idStorage.readById("B")).rejects.toThrow()
		})
	})

	describe("auto-deletion (orphan prevention)", () => {
		it("deletes the file and metadata when the last alias is removed", async () => {
			await idStorage.write(["A"], "hello")
			await idStorage.removeAliases("A", ["A"])

			await expect(idStorage.readById("A")).rejects.toThrow()
			await expect(idStorage.readMetadataById("A")).rejects.toThrow()
		})

		it("deletes the file when all remaining aliases are removed at once", async () => {
			await idStorage.write(["A", "B"], "hello")
			await idStorage.removeAliases("A", ["A", "B"])

			await expect(idStorage.readById("A")).rejects.toThrow()
			await expect(idStorage.readById("B")).rejects.toThrow()
		})
	})

	describe("safety and validation", () => {
		it("throws when trying to remove an alias that belongs to a different entry", async () => {
			await idStorage.write(["A"], "doc1")
			await idStorage.write(["B"], "doc2")

			await expect(idStorage.removeAliases("A", ["B"])).rejects.toThrow()
		})

		it("does not apply partial changes if one of the aliases conflicts", async () => {
			await idStorage.write(["A", "C"], "doc1")
			await idStorage.write(["B"], "doc2")

			await expect(
				idStorage.removeAliases("A", ["C", "B"]),
			).rejects.toThrow()

			expect(await idStorage.readById("C")).toEqual("doc1")
			expect(await idStorage.readById("B")).toEqual("doc2")
		})

		it("handles removing a non-existent alias gracefully", async () => {
			await idStorage.write(["A"], "hello")

			await expect(
				idStorage.removeAliases("A", ["C"]),
			).resolves.not.toThrow()
			expect(await idStorage.readById("A")).toEqual("hello")
		})

		it("handles an empty array gracefully", async () => {
			await idStorage.write(["A"], "hello")
			await expect(
				idStorage.removeAliases("A", []),
			).resolves.not.toThrow()
			expect(await idStorage.readById("A")).toEqual("hello")
		})

		it("throws when the target ID does not exist", async () => {
			await expect(
				idStorage.removeAliases("unknown", ["B"]),
			).rejects.toThrow()
		})
	})

	describe("profile isolation", () => {
		it("only affects aliases within the specified profile", async () => {
			await idStorage.write(["A", "B"], "profile-a", { profile: "a" })
			await idStorage.write(["A", "B"], "profile-b", { profile: "b" })

			await idStorage.removeAliases("A", ["B"], { profile: "a" })

			await expect(
				idStorage.readById("B", { profile: "a" }),
			).rejects.toThrow()
			expect(await idStorage.readById("B", { profile: "b" })).toEqual(
				"profile-b",
			)
		})
	})
})
