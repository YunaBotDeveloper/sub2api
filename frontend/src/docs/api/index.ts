// Built-in API documentation served at /docs. Each page is one Markdown file
// per locale (`<page>.<locale>.md`); missing translations fall back to English.

export const DOCS_PAGES = ['quickstart', 'endpoints', 'clients', 'errors'] as const
export type DocsPage = (typeof DOCS_PAGES)[number]
export const DOCS_DEFAULT_PAGE: DocsPage = 'quickstart'
export const DOCS_FALLBACK_LOCALE = 'en'

const sources = import.meta.glob<string>('./*.md', { query: '?raw', import: 'default' })

export function isDocsPage(value: string): value is DocsPage {
  return (DOCS_PAGES as readonly string[]).includes(value)
}

export async function loadDocsSource(page: DocsPage, locale: string): Promise<string> {
  const loader = sources[`./${page}.${locale}.md`] ?? sources[`./${page}.${DOCS_FALLBACK_LOCALE}.md`]
  if (!loader) {
    throw new Error(`Missing docs page: ${page}`)
  }
  return loader()
}
