import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest"
import IDBDirStorage from "../../../../../src/lib/storage/directory-storage/IDBDirStorage"
import {
	DirIdStorage,
	DirStorage,
	IdStorage,
} from "@d-najd/universal-media-tracker-sdk"

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

	describe("id normalization", () => {
		it("normalizes bare ids to unknown: when removing", async () => {
			await idStorage.write(["imdb:tt123", "bare-id"], "hello")

			// Pass bare id, should normalize to unknown:bare-id and remove
			await idStorage.removeAliases("imdb:tt123", ["bare-id"])

			expect(await idStorage.readById("imdb:tt123")).toEqual("hello")
			await expect(
				idStorage.readById("unknown:bare-id"),
			).rejects.toThrow()
		})

		it("throws if an ID contains more than one colon", async () => {
			await idStorage.write(["imdb:tt123"], "hello")

			await expect(
				idStorage.removeAliases("imdb:tt123", ["imdb:tt123:extra"]),
			).rejects.toThrow()
		})

		it("throws if the provider is empty", async () => {
			await idStorage.write(["imdb:tt123"], "hello")

			await expect(
				idStorage.removeAliases("imdb:tt123", [":tt123"]),
			).rejects.toThrow()
		})

		it("throws if the id part is empty", async () => {
			await idStorage.write(["imdb:tt123"], "hello")

			await expect(
				idStorage.removeAliases("imdb:tt123", ["imdb:"]),
			).rejects.toThrow()
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

		it("does not remove any aliases if the incoming array contains an invalid format", async () => {
			await idStorage.write(["imdb:tt123", "tmdb:456"], "hello")

			await expect(
				idStorage.removeAliases("imdb:tt123", [
					"tmdb:456",
					"invalid:id:with:colons",
				]),
			).rejects.toThrow()

			expect(await idStorage.readById("tmdb:456")).toEqual("hello")
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
