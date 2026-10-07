export const BUILTIN_DOCS_PATH = '/docs'

export interface DocsLink {
  href: string
  external: boolean
}

/**
 * Resolves where "Docs" links point: the admin-configured documentation URL
 * (already sanitized) when set, otherwise the built-in /docs pages.
 */
export function resolveDocsLink(configuredUrl: string): DocsLink {
  return configuredUrl
    ? { href: configuredUrl, external: true }
    : { href: BUILTIN_DOCS_PATH, external: false }
}
