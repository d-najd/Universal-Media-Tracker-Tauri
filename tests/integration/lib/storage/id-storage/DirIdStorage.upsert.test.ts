import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest"
import IDBDirStorage from "../../../../../src/lib/storage/directory-storage/IDBDirStorage"
import DirIdStorage from "../../../../../src/lib/storage/id-storage/DirIdStorage"

describe("DirIdStorage.upsert", () => {
	let dirStorage: IDBDirStorage
	let idStorage: DirIdStorage

	beforeAll(async () => {
		const dbName = `db-${crypto.randomUUID()}`
		dirStorage = await IDBDirStorage.create(dbName, "store-test")
	})

	beforeEach(async () => {
		// fresh namespace per test to avoid state bleeding
		const path = `test-${crypto.randomUUID()}`
		idStorage = await DirIdStorage.create(dirStorage, path)
	})

	afterEach(async () => {
		await dirStorage.deleteAll()
	})

	describe("basic writes", () => {
		it("creates a new entry with a single id", async () => {
			await idStorage.upsert(["A"], "hello")

			expect(await idStorage.readById("A")).toEqual("hello")
		})

		it("creates a new entry with multiple ids", async () => {
			await idStorage.upsert(["A", "B", "C"], "hello")

			expect(await idStorage.readById("A")).toEqual("hello")
			expect(await idStorage.readById("B")).toEqual("hello")
			expect(await idStorage.readById("C")).toEqual("hello")
		})

		it("preserves empty string data", async () => {
			await idStorage.upsert(["A"], "")

			expect(await idStorage.readById("A")).toEqual("")
		})

		it("stores binary data", async () => {
			const data = new Uint8Array([1, 2, 3])
			await idStorage.upsert(["A"], data)

			expect(await idStorage.readById("A")).toEqual(data)
		})

		it("stores JSON strings", async () => {
			const data = JSON.stringify({ name: "test", value: 123 })
			await idStorage.upsert(["A"], data)

			expect(await idStorage.readById("A")).toEqual(data)
		})
	})

	describe("updating existing entries", () => {
		it("updates data when an existing id is passed", async () => {
			console.error("FIRST")
			await idStorage.upsert(["A"], "first")
			console.error("SECOND")
			await idStorage.upsert(["A"], "second")
			console.error("THIRD")

			expect(await idStorage.readById("A")).toEqual("second")
		})

		it("targets the same doc when a different alias is passed", async () => {
			await idStorage.upsert(["A", "B"], "first")
			await idStorage.upsert(["B"], "second")

			expect(await idStorage.readById("A")).toEqual("second")
			expect(await idStorage.readById("B")).toEqual("second")
		})
	})

	describe("alias semantics", () => {
		describe("merge mode", () => {
			it("adds new ids without removing existing ones", async () => {
				await idStorage.upsert(["A", "B"], "hello", {
					idsMode: "merge",
				})
				await idStorage.upsert(["A", "C"], undefined, {
					idsMode: "merge",
				})

				expect(await idStorage.readById("A")).toEqual("hello")
				expect(await idStorage.readById("B")).toEqual("hello")
				expect(await idStorage.readById("C")).toEqual("hello")
			})

			it("does not remove ids that are not in the new set", async () => {
				await idStorage.upsert(["A", "B", "C"], "hello", {
					idsMode: "merge",
				})
				await idStorage.upsert(["A"], undefined, { idsMode: "merge" })

				expect(await idStorage.readById("B")).toEqual("hello")
				expect(await idStorage.readById("C")).toEqual("hello")
			})

			it("is the default mode when idsMode is not specified", async () => {
				await idStorage.upsert(["A", "B"], "hello")
				await idStorage.upsert(["A", "C"])

				expect(await idStorage.readById("B")).toEqual("hello")
				expect(await idStorage.readById("C")).toEqual("hello")
			})

			it("keeps targeting the existing doc when a new id is added", async () => {
				await idStorage.upsert(["A", "B"], "hello", {
					idsMode: "merge",
				})

				// Passing a fresh id alongside an existing one must not lose the doc
				await idStorage.upsert(["A", "C"], undefined, {
					idsMode: "merge",
				})

				// All three ids still resolve to the original entry
				expect(await idStorage.readById("A")).toEqual("hello")
				expect(await idStorage.readById("B")).toEqual("hello")
				expect(await idStorage.readById("C")).toEqual("hello")
			})

			it("does not throw or create a new entry when the same ids are written twice", async () => {
				await idStorage.upsert(["A", "B"], "hello", {
					idsMode: "merge",
				})
				await idStorage.upsert(["A", "B"], undefined, {
					idsMode: "merge",
				})

				// Same entry, same data — no split, no error
				expect(await idStorage.readById("A")).toEqual("hello")
				expect(await idStorage.readById("B")).toEqual("hello")
			})
		})

		describe("replace mode", () => {
			it("drops ids not present in the new set", async () => {
				await idStorage.upsert(["A", "B"], "hello", {
					idsMode: "replace",
				})
				await idStorage.upsert(["A", "C"], undefined, {
					idsMode: "replace",
				})

				expect(await idStorage.readById("A")).toEqual("hello")
				expect(await idStorage.readById("C")).toEqual("hello")
				await expect(idStorage.readById("B")).rejects.toThrow()
			})

			it("does not affect aliases of other entries", async () => {
				await idStorage.upsert(["A", "B"], "one", {
					idsMode: "replace",
				})
				await idStorage.upsert(["C", "D"], "two", {
					idsMode: "replace",
				})

				await idStorage.upsert(["A"], undefined, { idsMode: "replace" })

				expect(await idStorage.readById("C")).toEqual("two")
				expect(await idStorage.readById("D")).toEqual("two")
			})
		})
	})

	describe("partial updates", () => {
		it("preserves data when only ids are passed", async () => {
			await idStorage.upsert(["A"], "hello")
			await idStorage.upsert(["A", "B"])

			expect(await idStorage.readById("A")).toEqual("hello")
			expect(await idStorage.readById("B")).toEqual("hello")
		})
	})

	describe("validation and errors", () => {
		it("throws on empty ids array", async () => {
			await expect(idStorage.upsert([], "hello")).rejects.toThrow()
		})

		it("throws when no entry matches and no data is provided", async () => {
			await expect(idStorage.upsert(["unknown"])).rejects.toThrow()
		})

		it("throws when ids resolve to more than one entry", async () => {
			await idStorage.upsert(["A"], "one")
			await idStorage.upsert(["B"], "two")

			await expect(
				idStorage.upsert(["A", "B"], "conflict"),
			).rejects.toThrow()
		})

		it("does not write partial state when a conflict is detected", async () => {
			await idStorage.upsert(["A"], "one")
			await idStorage.upsert(["B"], "two")

			await expect(
				idStorage.upsert(["A", "B", "C"], "conflict"),
			).rejects.toThrow()

			// Neither entry should have gained C
			await expect(idStorage.readById("C")).rejects.toThrow()
			expect(await idStorage.readById("A")).toEqual("one")
			expect(await idStorage.readById("B")).toEqual("two")
		})
	})

	describe("profile isolation", () => {
		it("keeps entries separate across profiles", async () => {
			await idStorage.upsert(["A"], "profile-a", { profile: "a" })
			await idStorage.upsert(["A"], "profile-b", { profile: "b" })

			expect(await idStorage.readById("A", { profile: "a" })).toEqual(
				"profile-a",
			)
			expect(await idStorage.readById("A", { profile: "b" })).toEqual(
				"profile-b",
			)
		})
	})

	describe("namespace isolation", () => {
		it("keeps entries separate across DirIdStorage instances", async () => {
			const other = await DirIdStorage.create(
				dirStorage,
				`other-${crypto.randomUUID()}`,
			)

			await idStorage.upsert(["A"], "from-first")
			await other.upsert(["A"], "from-second")

			expect(await idStorage.readById("A")).toEqual("from-first")
			expect(await other.readById("A")).toEqual("from-second")
		})
	})
})
