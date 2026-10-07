import { readdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { DOCS_PAGES } from '@/docs/api'
import {
  applyDocsPlaceholders,
  normalizeDocsBaseUrl,
  renderDocsMarkdown,
  slugifyHeading,
} from '../docsMarkdown'
import { resolveDocsLink } from '../docsLink'

const docsDir = resolve(dirname(fileURLToPath(import.meta.url)), '../../docs/api')

describe('docsMarkdown', () => {
  it('normalizes the gateway base URL', () => {
    expect(normalizeDocsBaseUrl('https://api.example.com/')).toBe('https://api.example.com')
    expect(normalizeDocsBaseUrl('https://api.example.com/v1/')).toBe('https://api.example.com')
    expect(normalizeDocsBaseUrl('https://api.example.com/gateway')).toBe('https://api.example.com/gateway')
  })

  it('replaces every placeholder occurrence', () => {
    const out = applyDocsPlaceholders('{{BASE_URL}}/v1 {{BASE_URL}} {{SITE_NAME}}', {
      baseUrl: 'https://x.test',
      siteName: 'Demo',
    })
    expect(out).toBe('https://x.test/v1 https://x.test Demo')
  })

  it('keeps Unicode letters in heading slugs', () => {
    expect(slugifyHeading('Bước 1: Tạo API key')).toBe('bước-1-tạo-api-key')
    expect(slugifyHeading('快速开始')).toBe('快速开始')
  })

  it('renders headings, toc, code blocks and links', () => {
    const doc = renderDocsMarkdown(
      [
        '# Title',
        '## Section',
        '## Section',
        '```bash',
        'echo "<b>"',
        '```',
        '[ext](https://example.com) [int](/docs/clients)',
      ].join('\n\n'),
      { copyLabel: 'Copy' }
    )
    expect(doc.html).toContain('<h1>Title</h1>')
    expect(doc.toc).toEqual([
      { id: 'section', text: 'Section' },
      { id: 'section-1', text: 'Section' },
    ])
    expect(doc.html).toContain('<h2 id="section-1">')
    expect(doc.html).toContain('data-docs-copy')
    expect(doc.html).toContain('echo "&lt;b&gt;"')
    expect(doc.html).toContain('target="_blank"')
    expect(doc.html).toContain('href="/docs/clients"')
    expect(doc.html).not.toMatch(/href="\/docs\/clients"[^>]*target=/)
  })

  it('sanitizes raw HTML in markdown', () => {
    const doc = renderDocsMarkdown('<img src=x onerror="alert(1)"><script>alert(1)</script>', { copyLabel: 'Copy' })
    expect(doc.html).not.toContain('onerror')
    expect(doc.html).not.toContain('<script')
  })
})

describe('built-in docs content', () => {
  const files = readdirSync(docsDir).filter((name) => name.endsWith('.md'))

  it.each(['en', 'vi', 'zh'])('has every page in %s', (locale) => {
    for (const page of DOCS_PAGES) {
      expect(files).toContain(`${page}.${locale}.md`)
    }
  })

  it('only links to existing docs pages', () => {
    for (const file of files) {
      const source = readFileSync(resolve(docsDir, file), 'utf8')
      for (const match of source.matchAll(/\]\(\/docs\/([a-z-]+)/g)) {
        expect(DOCS_PAGES, `${file} links to /docs/${match[1]}`).toContain(match[1])
      }
    }
  })
})

describe('resolveDocsLink', () => {
  it('prefers the configured external URL', () => {
    expect(resolveDocsLink('https://docs.example.com/')).toEqual({ href: 'https://docs.example.com/', external: true })
  })

  it('falls back to the built-in docs', () => {
    expect(resolveDocsLink('')).toEqual({ href: '/docs', external: false })
  })
})
