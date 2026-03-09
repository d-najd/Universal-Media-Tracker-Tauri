import ExampleCatalogPlugin from '@/app/plugins/exampleCatalogPlugin'

const basePlugins = Object.keys(import.meta.glob('@/app/plugins/*.ts'))

export default basePlugins