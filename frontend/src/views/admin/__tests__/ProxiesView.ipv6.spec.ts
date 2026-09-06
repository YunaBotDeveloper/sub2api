import { describe, expect, it } from 'vitest'
import { parseProxyLine } from '@/utils/proxyParse'

// parseProxyLine backs the proxy batch-import textarea in ProxiesView.vue.
describe('proxy batch line parsing (IPv6 support)', () => {
  it.each([
    ['socks5://[2001:db8::1]:1080', true],
    ['socks5h://[2001:db8::1]:1080', true],
    ['http://[::1]:8080', true],
    ['socks5://user:pass@[2001:db8::1]:1080', true],
    ['socks5://proxy.example.com:1080', true],
    ['http://192.168.1.1:8080', true],
    ['socks5://user:pass@proxy.example.com:1080', true],
    // bare IPv6 without brackets is ambiguous with host:port — rejected
    ['socks5://2001:db8::1:1080', false],
    // unsupported schemes / malformed ports stay invalid
    ['ftp://example.com:21', false],
    ['socks5://example.com:port', false]
  ])('%s => %s', (line, expected) => {
    expect(parseProxyLine(line) !== null).toBe(expected)
  })

  it('extracts bracketed IPv6 host without brackets', () => {
    expect(parseProxyLine('socks5://user:pass@[2001:db8::1]:1080')).toEqual({
      protocol: 'socks5',
      host: '2001:db8::1',
      port: 1080,
      username: 'user',
      password: 'pass'
    })
  })
})

describe('proxy batch line parsing (extra formats)', () => {
  it('defaults to http when the scheme is omitted', () => {
    expect(parseProxyLine('192.168.1.1:8080')).toEqual({
      protocol: 'http',
      host: '192.168.1.1',
      port: 8080,
      username: '',
      password: ''
    })
  })

  it('parses host:port:user:pass', () => {
    expect(parseProxyLine('192.168.1.1:8080:bob:s3cret')).toEqual({
      protocol: 'http',
      host: '192.168.1.1',
      port: 8080,
      username: 'bob',
      password: 's3cret'
    })
  })

  it('parses user:pass:host:port', () => {
    expect(parseProxyLine('bob:s3cret:proxy.example.com:3128')).toEqual({
      protocol: 'http',
      host: 'proxy.example.com',
      port: 3128,
      username: 'bob',
      password: 's3cret'
    })
  })

  it('parses user:pass@host:port without a scheme', () => {
    expect(parseProxyLine('bob:s3cret@proxy.example.com:3128')).toEqual({
      protocol: 'http',
      host: 'proxy.example.com',
      port: 3128,
      username: 'bob',
      password: 's3cret'
    })
  })

  it('keeps a colon inside the password', () => {
    expect(parseProxyLine('1.2.3.4:8080:bob:a:b')).toEqual({
      protocol: 'http',
      host: '1.2.3.4',
      port: 8080,
      username: 'bob',
      password: 'a:b'
    })
  })

  it('keeps the last @ as the credential separator', () => {
    expect(parseProxyLine('socks5://bob:p@ss@1.2.3.4:1080')).toEqual({
      protocol: 'socks5',
      host: '1.2.3.4',
      port: 1080,
      username: 'bob',
      password: 'p@ss'
    })
  })

  it('accepts space, comma and pipe separated fields', () => {
    for (const line of [
      '1.2.3.4 8080 bob s3cret',
      '1.2.3.4,8080,bob,s3cret',
      '1.2.3.4|8080|bob|s3cret'
    ]) {
      expect(parseProxyLine(line)).toEqual({
        protocol: 'http',
        host: '1.2.3.4',
        port: 8080,
        username: 'bob',
        password: 's3cret'
      })
    }
  })

  it('maps the socks alias to socks5 and trims quotes', () => {
    expect(parseProxyLine('"socks://1.2.3.4:1080"')).toEqual({
      protocol: 'socks5',
      host: '1.2.3.4',
      port: 1080,
      username: '',
      password: ''
    })
  })

  it.each(['', '   ', 'example.com', 'example.com:0', 'example.com:70000', 'socks4://1.2.3.4:1080'])(
    'rejects %s',
    (line) => {
      expect(parseProxyLine(line)).toBeNull()
    }
  )
})
