import { MeiliSearch } from 'meilisearch'

const host = import.meta.env.VITE_MEILI_HOST as string
const apiKey = import.meta.env.VITE_MEILI_API_KEY as string

if (!host) {
  console.error('❌ VITE_MEILI_HOST is not set. Please create a .env file with VITE_MEILI_HOST=your-meilisearch-url')
  throw new Error('VITE_MEILI_HOST environment variable is required')
}

if (!host.startsWith('http://') && !host.startsWith('https://')) {
  console.error('❌ VITE_MEILI_HOST must start with http:// or https://', { host })
  throw new Error('VITE_MEILI_HOST must be a valid URL starting with http:// or https://')
}

console.log('🔍 Connecting to MeiliSearch at:', host)

export const meili = new MeiliSearch({
  host,
  apiKey
})

export type IndexInfo = {
  uid: string
  primaryKey?: string | null
}
