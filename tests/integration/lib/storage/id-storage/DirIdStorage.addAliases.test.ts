import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest"
import IDBDirStorage from "../../../../../src/lib/storage/directory-storage/IDBDirStorage"
import {
	DirIdStorage,
	DirStorage,
	IdStorage,
} from "@d-najd/universal-media-tracker-sdk"

describe("DirIdStorage.addAliases", () => {
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

	describe("basic additions", () => {
		it("adds a single new alias to an existing entry", async () => {
			await idStorage.write(["A"], "hello")
			await idStorage.addAliases("A", ["B"])

			expect(await idStorage.readById("A")).toEqual("hello")
			expect(await idStorage.readById("B")).toEqual("hello")
		})

		it("adds multiple new aliases at once", async () => {
			await idStorage.write(["A"], "hello")
			await idStorage.addAliases("A", ["B", "C", "D"])

			expect(await idStorage.readById("B")).toEqual("hello")
			expect(await idStorage.readById("C")).toEqual("hello")
			expect(await idStorage.readById("D")).toEqual("hello")
		})

		it("can target the entry using any existing alias", async () => {
			await idStorage.write(["A", "B"], "hello")

			await idStorage.addAliases("B", ["C"])

			expect(await idStorage.readById("A")).toEqual("hello")
			expect(await idStorage.readById("C")).toEqual("hello")
		})

		it("does not modify the underlying data", async () => {
			await idStorage.write(["A"], "original data")
			const metaBefore = await idStorage.readMetadataById("A")

			await idStorage.addAliases("A", ["B"])

			expect(await idStorage.readById("B")).toEqual("original data")
			const metaAfter = await idStorage.readMetadataById("A")

			// Metadata shouldn't change (except potentially updatedAt)
			expect(metaAfter.createdAt).toEqual(metaBefore.createdAt)
		})
	})

	describe("id normalization", () => {
		it("normalizes bare ids to unknown: when adding", async () => {
			await idStorage.write(["imdb:tt123"], "hello")
			await idStorage.addAliases("imdb:tt123", ["bare-id"])

			expect(await idStorage.readById("unknown:bare-id")).toEqual("hello")
			expect(await idStorage.readById("bare-id")).toEqual("hello")
		})

		it("throws if an ID contains more than one colon", async () => {
			await idStorage.write(["imdb:tt123"], "hello")

			await expect(
				idStorage.addAliases("imdb:tt123", ["imdb:tt123:extra"]),
			).rejects.toThrow()
		})

		it("throws if the provider is empty", async () => {
			await idStorage.write(["imdb:tt123"], "hello")

			await expect(
				idStorage.addAliases("imdb:tt123", [":tt123"]),
			).rejects.toThrow()
		})

		it("throws if the id part is empty", async () => {
			await idStorage.write(["imdb:tt123"], "hello")

			await expect(
				idStorage.addAliases("imdb:tt123", ["imdb:"]),
			).rejects.toThrow()
		})
	})

	describe("idempotency", () => {
		it("does not throw when adding an alias that already exists on the same entry", async () => {
			await idStorage.write(["A", "B"], "hello")

			await idStorage.addAliases("A", ["B", "C"])

			expect(await idStorage.readById("B")).toEqual("hello")
			expect(await idStorage.readById("C")).toEqual("hello")
		})

		it("handles an empty array gracefully", async () => {
			await idStorage.write(["A"], "hello")
			await expect(idStorage.addAliases("A", [])).resolves.not.toThrow()
		})
	})

	describe("validation and errors", () => {
		it("throws when the target ID does not exist", async () => {
			await expect(
				idStorage.addAliases("unknown", ["B"]),
			).rejects.toThrow()
		})

		it("throws when trying to claim an alias that belongs to a different entry", async () => {
			await idStorage.write(["A"], "doc1")
			await idStorage.write(["B"], "doc2")

			await expect(idStorage.addAliases("A", ["B"])).rejects.toThrow()
		})

		it("does not apply partial changes if one of the new aliases conflicts", async () => {
			await idStorage.write(["A"], "doc1")
			await idStorage.write(["B"], "doc2")

			await expect(
				idStorage.addAliases("A", ["C", "B"]),
			).rejects.toThrow()
			await expect(idStorage.readById("C")).rejects.toThrow()
		})

		it("does not add any aliases if the incoming array contains an invalid format", async () => {
			await idStorage.write(["imdb:tt123"], "hello")

			await expect(
				idStorage.addAliases("imdb:tt123", [
					"tmdb:456",
					"invalid:id:with:colons",
				]),
			).rejects.toThrow()

			await expect(idStorage.readById("tmdb:456")).rejects.toThrow()
		})
	})

	describe("profile isolation", () => {
		it("only affects aliases within the specified profile", async () => {
			await idStorage.write(["A"], "profile-a", { profile: "a" })
			await idStorage.write(["A"], "profile-b", { profile: "b" })

			await idStorage.addAliases("A", ["B"], { profile: "a" })

			expect(await idStorage.readById("B", { profile: "a" })).toEqual(
				"profile-a",
			)
			await expect(
				idStorage.readById("B", { profile: "b" }),
			).rejects.toThrow()
		})
	})
})
