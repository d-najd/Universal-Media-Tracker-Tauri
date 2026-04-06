import { JSDOM } from 'jsdom'
import { readFileSync, rmSync, writeFileSync } from 'node:fs'
import stripJsonComments from 'strip-json-comments'
import { mkdirSync } from 'fs'

function extractImportMap() {
	const htmlString = readFileSync('index.html', 'utf-8')
	const dom = new JSDOM(htmlString)
	const importMapScript = dom.window.document.querySelector(
		'script[type="importmap"]'
	)
	const importMap = (
		importMapScript ? JSON.parse(importMapScript.textContent) : null
	) as ImportMap

	return Object.entries(importMap.imports).map((o) => o[0])
}

function extractInstalledPackages() {
	const packageJsonString = readFileSync('package-lock.json', 'utf-8')
	const packageJson = JSON.parse(packageJsonString) as PackageLockJson

	return Object.entries(packageJson.packages[''].dependencies)
}

function extractTSConfigModule() {
	const packageJsonString = stripJsonComments(
		readFileSync('tsconfig.json', 'utf-8')
	)

	const packageJson = JSON.parse(packageJsonString) as TSConfigJson
	return packageJson.compilerOptions.module
}

const downloadSource = 'https://esm.sh'
let moduleVersion = ''

async function downloadPackages(input: [string, string][]) {
	input.forEach(([pkg, version]) => {
		getRealLocationFromBase([pkg, version], input).then((o) =>
			downloadAndSaveBundled(o, pkg)
		)
	})
}

async function getRealLocationFromBase(
	input: [string, string],
	others: [string, string][]
) {
	if (moduleVersion === '') {
		moduleVersion = extractTSConfigModule()
	}
	const external = others
		.filter((o) => o[0] !== input[0])
		.map((o) => o[0])
		.join(',')

	const url =
		downloadSource +
		'/' +
		input[0] +
		'@' +
		input[1] +
		`?target=${moduleVersion}&standalone&external=${external}`

	const fetchedData = await fetch(url)
	if (!fetchedData.ok) {
		throw Error(`FAILED WITH ${fetchedData.statusText}`)
	}

	const text = await fetchedData.text()
	const lines = text.split('\n').slice(0, -1) // last line is always empty it seems
	const importCount = lines.filter((line) => line.startsWith('import')).length
	if (importCount !== 0) {
		throw Error(`Found import for ${text}`)
	}

	return lines[lines.length - 1].match(/"(.*)"/)![1]
}

const saveFolder = 'vendor/packages/'

async function downloadAndSaveBundled(url: string, packageName: string) {
	const request = await fetch(`${downloadSource}${url}`)
	const requestMap = await fetch(`${downloadSource}${url}.map`)

	if (!request.ok) {
		throw Error(`failed to download and save with url ${url}`)
	}

	if (!requestMap.ok) {
		throw Error(`failed to download and save map with url ${url}`)
	}

	const text = await request.text()
	const mapText = await requestMap.text()
	mkdirSync(`${saveFolder}${getUntilFirstSlash(packageName)}`, {
		recursive: true
	})
	writeFileSync(`${saveFolder}${packageName}.bundle.mjs`, text)
	writeFileSync(`${saveFolder}${packageName}.bundle.mjs.map`, mapText)
}

function getUntilFirstSlash(str: string): string {
	const index = str.lastIndexOf('/')
	return index !== -1 ? str.substring(0, index) : ''
}

type ImportMap = {
	imports: Record<string, string>
}

type PackageLockJson = {
	packages: Record<string, { dependencies: Record<string, string> }>
}

type TSConfigJson = {
	compilerOptions: {
		module: string
	}
}

const importMap = extractImportMap()
const installedPackages = extractInstalledPackages()
const packagesToDownload = installedPackages.filter((installed) =>
	importMap.some((imported) => installed[0] === imported)
)
rmSync('vendor/packages', { recursive: true, force: true })
downloadPackages(packagesToDownload).then()
