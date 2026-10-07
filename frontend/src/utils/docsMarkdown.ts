import { Marked, type Tokens } from 'marked'
import DOMPurify from 'dompurify'

export interface DocsTocItem {
  id: string
  text: string
}

export interface RenderedDoc {
  html: string
  toc: DocsTocItem[]
}

export interface DocsPlaceholders {
  baseUrl: string
  siteName: string
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Keeps Unicode letters so Vietnamese and Chinese headings still get readable anchors.
export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Normalizes the gateway base URL shown in docs: no trailing slash and no
 * trailing /v1, because the docs append /v1 explicitly where a client needs it.
 */
export function normalizeDocsBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, '').replace(/\/v1$/, '')
}

export function applyDocsPlaceholders(source: string, placeholders: DocsPlaceholders): string {
  return source
    .replace(/\{\{BASE_URL\}\}/g, placeholders.baseUrl)
    .replace(/\{\{SITE_NAME\}\}/g, placeholders.siteName)
}

function plainText(tokens: Tokens.Heading['tokens']): string {
  return tokens
    .map((token) => ('tokens' in token && token.tokens ? plainText(token.tokens) : 'text' in token ? token.text : ''))
    .join('')
}

export function renderDocsMarkdown(source: string, options: { copyLabel: string }): RenderedDoc {
  const usedIds = new Map<string, number>()
  const toc: DocsTocItem[] = []

  const uniqueId = (text: string): string => {
    const base = slugifyHeading(text) || 'section'
    const count = usedIds.get(base) ?? 0
    usedIds.set(base, count + 1)
    return count === 0 ? base : `${base}-${count}`
  }

  const marked = new Marked({
    gfm: true,
    renderer: {
      heading({ tokens, depth }) {
        const text = plainText(tokens)
        const inner = this.parser.parseInline(tokens)
        if (depth === 1) return `<h1>${inner}</h1>\n`
        const id = uniqueId(text)
        if (depth === 2) toc.push({ id, text })
        return `<h${depth} id="${id}"><a class="docs-anchor" href="#${id}" aria-hidden="true">#</a>${inner}</h${depth}>\n`
      },
      code({ text, lang }) {
        const language = (lang || '').trim().split(/\s+/)[0] || ''
        const langClass = language ? ` class="language-${escapeHtml(language)}"` : ''
        return (
          '<div class="docs-code">' +
          '<div class="docs-code-bar">' +
          `<span class="docs-code-lang">${escapeHtml(language || 'text')}</span>` +
          `<button type="button" class="docs-copy" data-docs-copy="">${escapeHtml(options.copyLabel)}</button>` +
          '</div>' +
          `<pre><code${langClass}>${escapeHtml(text)}</code></pre>` +
          '</div>\n'
        )
      },
      link({ href, title: linkTitle, tokens }) {
        const inner = this.parser.parseInline(tokens)
        const titleAttr = linkTitle ? ` title="${escapeHtml(linkTitle)}"` : ''
        const external = /^https?:\/\//i.test(href)
        const targetAttr = external ? ' target="_blank" rel="noopener noreferrer"' : ''
        return `<a href="${escapeHtml(href)}"${titleAttr}${targetAttr}>${inner}</a>`
      },
    },
  })

  const rawHtml = marked.parse(source, { async: false }) as string
  const html = DOMPurify.sanitize(rawHtml, { ADD_ATTR: ['target'] })
  return { html, toc }
}
