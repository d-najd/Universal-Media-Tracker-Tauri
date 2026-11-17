import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest"
import IDBDirStorage from "../../../../../src/lib/storage/directory-storage/IDBDirStorage.ts"
import {
	DirIdStorage,
	DirStorage,
	IdStorage,
} from "@d-najd/universal-media-tracker-sdk"

describe("DirIdStorage.readById", () => {
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

	describe("basic reads", () => {
		it("reads an entry by id", async () => {
			await idStorage.write(["A"], "hello")

			expect(await idStorage.readById("A")).toEqual("hello")
		})

		it("reads by any registered alias", async () => {
			await idStorage.write(["A", "B", "C"], "hello")

			expect(await idStorage.readById("A")).toEqual("hello")
			expect(await idStorage.readById("B")).toEqual("hello")
			expect(await idStorage.readById("C")).toEqual("hello")
		})

		it("returns empty string when data is empty string", async () => {
			await idStorage.write(["A"], "")

			expect(await idStorage.readById("A")).toEqual("")
		})

		it("returns binary data unchanged", async () => {
			const data = new Uint8Array([1, 2, 3, 4])
			await idStorage.write(["A"], data)

			expect(await idStorage.readById("A")).toEqual(data)
		})

		it("returns JSON strings unchanged", async () => {
			const data = JSON.stringify({ name: "test", value: 123 })
			await idStorage.write(["A"], data)

			expect(await idStorage.readById("A")).toEqual(data)
		})
	})

	describe("id normalization", () => {
		it("reads an entry using a bare id when it was saved as a bare id", async () => {
			await idStorage.write(["A"], "hello")

			expect(await idStorage.readById("unknown:A")).toEqual("hello")
			expect(await idStorage.readById("A")).toEqual("hello")
		})

		it("throws when reading a bare id that was saved with a provider", async () => {
			await idStorage.write(["imdb:A"], "hello")

			await expect(idStorage.readById("A")).rejects.toThrow()
		})

		it("throws if an ID contains more than one colon", async () => {
			await expect(
				idStorage.readById("imdb:tt123:extra"),
			).rejects.toThrow()
		})

		it("throws if the provider is empty", async () => {
			await idStorage.write(["imdb:tt123"], "hello")

			await expect(idStorage.readById(":tt123")).rejects.toThrow()
		})

		it("throws if the id part is empty", async () => {
			await idStorage.write(["imdb:tt123"], "hello")

			await expect(idStorage.readById("imdb:")).rejects.toThrow()
		})
	})

	describe("alias updates", () => {
		it("removes other aliases when using write (override behavior)", async () => {
			await idStorage.write(["A", "B"], "hello")
			await idStorage.write(["A"], "hello again")

			expect(await idStorage.readById("A")).toEqual("hello again")
			// B was removed because write overrides the alias set
			await expect(idStorage.readById("B")).rejects.toThrow()
		})
	})

	describe("validation and errors", () => {
		it("throws when id is not found", async () => {
			await expect(idStorage.readById("unknown")).rejects.toThrow()
		})

		it("throws after the entry is deleted", async () => {
			await idStorage.write(["A"], "hello")
			await idStorage.deleteById("A")

			await expect(idStorage.readById("A")).rejects.toThrow()
		})

		it("throws when accessing a removed alias", async () => {
			await idStorage.write(["A", "B"], "hello")
			await idStorage.removeAliases("A", ["B"])

			await expect(idStorage.readById("B")).rejects.toThrow()
		})

		it("throws on fileExtension mismatch", async () => {
			await idStorage.write(["A"], "hello", { fileExtension: "gson" })

			await expect(
				idStorage.readById("A", { fileExtension: "json" }),
			).rejects.toThrow()
		})
	})

	describe("fileExtension validation", () => {
		it("allows reads when fileExtension matches", async () => {
			await idStorage.write(["A"], "hello", { fileExtension: "gson" })

			expect(
				await idStorage.readById("A", { fileExtension: "gson" }),
			).toEqual("hello")
		})

		it("allows reads when fileExtension is not specified", async () => {
			await idStorage.write(["A"], "hello", { fileExtension: "bin" })

			expect(await idStorage.readById("A")).toEqual("hello")
		})
	})

	describe("profile isolation", () => {
		it("reads from the specified profile", async () => {
			await idStorage.write(["A"], "profile-a", { profile: "a" })
			await idStorage.write(["A"], "profile-b", { profile: "b" })

			expect(await idStorage.readById("A", { profile: "a" })).toEqual(
				"profile-a",
			)
			expect(await idStorage.readById("A", { profile: "b" })).toEqual(
				"profile-b",
			)
		})

		it("throws when id exists in a different profile but not the requested one", async () => {
			await idStorage.write(["A"], "profile-a", { profile: "a" })

			await expect(
				idStorage.readById("A", { profile: "b" }),
			).rejects.toThrow()
		})
	})

	describe("namespace isolation", () => {
		it("reads only from the instance's own namespace", async () => {
			const other = await DirIdStorage.create(
				dirStorage,
				`other-${crypto.randomUUID()}`,
			)

			await idStorage.write(["A"], "from-first")
			await other.write(["A"], "from-second")

			expect(await idStorage.readById("A")).toEqual("from-first")
			expect(await other.readById("A")).toEqual("from-second")
		})

		it("throws when id is not present in this instance", async () => {
			const other = await DirIdStorage.create(
				dirStorage,
				`other-${crypto.randomUUID()}`,
			)

			await other.write(["A"], "from-other")

			await expect(idStorage.readById("A")).rejects.toThrow()
		})
	})
})
