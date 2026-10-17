import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest"
import IDBDirStorage from "../../../../../src/lib/storage/directory-storage/IDBDirStorage"
import DirIdStorage from "../../../../../src/lib/storage/id-storage/DirIdStorage"
import { DirStorage, IdStorage } from "@d-najd/universal-media-tracker-sdk"

describe("DirIdStorage.write", () => {
	let dirStorage: DirStorage
	let idStorage: IdStorage

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
			await idStorage.write(["A"], "hello")

			expect(await idStorage.readById("A")).toEqual("hello")
		})

		it("creates a new entry with multiple ids", async () => {
			await idStorage.write(["A", "B", "C"], "hello")

			expect(await idStorage.readById("A")).toEqual("hello")
			expect(await idStorage.readById("B")).toEqual("hello")
			expect(await idStorage.readById("C")).toEqual("hello")
		})

		it("preserves empty string data", async () => {
			await idStorage.write(["A"], "")

			expect(await idStorage.readById("A")).toEqual("")
		})

		it("stores binary data", async () => {
			const data = new Uint8Array([1, 2, 3])
			await idStorage.write(["A"], data)

			expect(await idStorage.readById("A")).toEqual(data)
		})

		it("stores JSON strings", async () => {
			const data = JSON.stringify({ name: "test", value: 123 })
			await idStorage.write(["A"], data)

			expect(await idStorage.readById("A")).toEqual(data)
		})
	})

	describe("updating existing entries", () => {
		it("overrides data when an existing id is passed", async () => {
			await idStorage.write(["A"], "first")
			await idStorage.write(["A"], "second")

			expect(await idStorage.readById("A")).toEqual("second")
		})

		it("targets the same doc when a different alias is passed", async () => {
			await idStorage.write(["A", "B"], "first")
			await idStorage.write(["B"], "second")

			expect(await idStorage.readById("B")).toEqual("second")
		})
	})

	describe("alias semantics (override behavior)", () => {
		it("replaces the alias set with exactly the provided ids", async () => {
			await idStorage.write(["A", "B"], "hello")
			// Writing with just A should drop B from the aliases
			await idStorage.write(["A"], "new data")

			expect(await idStorage.readById("A")).toEqual("new data")
			await expect(idStorage.readById("B")).rejects.toThrow()
		})

		it("does not affect aliases of other entries", async () => {
			await idStorage.write(["A", "B"], "one")
			await idStorage.write(["C", "D"], "two")

			await idStorage.write(["A"], "one updated")

			expect(await idStorage.readById("C")).toEqual("two")
			expect(await idStorage.readById("D")).toEqual("two")
		})

		it("can re-add an alias that was previously removed", async () => {
			await idStorage.write(["A", "B"], "hello")
			await idStorage.write(["A"], "no b")
			await idStorage.write(["A", "B"], "b is back")

			expect(await idStorage.readById("B")).toEqual("b is back")
		})
	})

	describe("validation and errors", () => {
		it("throws on empty ids array", async () => {
			await expect(idStorage.write([], "hello")).rejects.toThrow()
		})

		it("throws when ids resolve to more than one entry", async () => {
			await idStorage.write(["A"], "one")
			await idStorage.write(["B"], "two")

			await expect(
				idStorage.write(["A", "B"], "conflict"),
			).rejects.toThrow()
		})

		it("does not write partial state when a conflict is detected", async () => {
			await idStorage.write(["A"], "one")
			await idStorage.write(["B"], "two")

			await expect(
				idStorage.write(["A", "B", "C"], "conflict"),
			).rejects.toThrow()

			// Neither entry should have gained C
			await expect(idStorage.readById("C")).rejects.toThrow()
			expect(await idStorage.readById("A")).toEqual("one")
			expect(await idStorage.readById("B")).toEqual("two")
		})
	})

	describe("profile isolation", () => {
		it("keeps entries separate across profiles", async () => {
			await idStorage.write(["A"], "profile-a", { profile: "a" })
			await idStorage.write(["A"], "profile-b", { profile: "b" })

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

			await idStorage.write(["A"], "from-first")
			await other.write(["A"], "from-second")

			expect(await idStorage.readById("A")).toEqual("from-first")
			expect(await other.readById("A")).toEqual("from-second")
		})
	})
})
