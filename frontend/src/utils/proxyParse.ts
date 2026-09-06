import type { ProxyProtocol } from '@/types'

export interface ParsedProxy {
  protocol: ProxyProtocol
  host: string
  port: number
  username: string
  password: string
}

// Scheme aliases accepted on input. Backend only stores http/https/socks5/socks5h.
const PROTOCOL_ALIASES: Record<string, ProxyProtocol> = {
  http: 'http',
  https: 'https',
  socks: 'socks5',
  socks5: 'socks5',
  socks5h: 'socks5h'
}

const isPort = (value: string): boolean => /^\d{1,5}$/.test(value) && +value >= 1 && +value <= 65535

// Split the address part into [host, ...rest]; keeps a bracketed IPv6 literal intact.
const splitFields = (addr: string): string[] => {
  const ipv6 = addr.match(/^\[([0-9a-fA-F:.]+)\](?::(.*))?$/)
  if (ipv6) {
    const rest = ipv6[2]
    return [ipv6[1], ...(rest ? rest.split(':') : [])]
  }
  return addr.split(':')
}

/**
 * Parse one proxy line. Accepted shapes (scheme optional, defaults to http):
 *   scheme://user:pass@host:port      scheme://host:port
 *   user:pass@host:port               host:port
 *   host:port:user:pass               user:pass:host:port
 *   scheme://host:port:user:pass
 * Fields may also be separated by spaces, tabs, commas or `|` instead of `:`.
 * Host may be a domain, IPv4, or bracketed IPv6 ([2001:db8::1]).
 */
export const parseProxyLine = (line: string): ParsedProxy | null => {
  let rest = line.trim().replace(/^["']|["']$/g, '')
  if (!rest) return null

  let protocol: ProxyProtocol = 'http'
  const scheme = rest.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):\/\/(.*)$/)
  if (scheme) {
    const mapped = PROTOCOL_ALIASES[scheme[1].toLowerCase()]
    if (!mapped) return null
    protocol = mapped
    rest = scheme[2]
  }

  let username = ''
  let password = ''
  const at = rest.lastIndexOf('@')
  if (at >= 0) {
    const creds = rest.slice(0, at)
    rest = rest.slice(at + 1)
    const sep = creds.indexOf(':')
    username = sep >= 0 ? creds.slice(0, sep) : creds
    password = sep >= 0 ? creds.slice(sep + 1) : ''
  }

  // Normalize alternative separators to ':' so one splitter handles every shape.
  rest = rest.trim().replace(/[\s,|]+/g, ':')
  const fields = splitFields(rest)

  let host: string
  let port: string
  if (fields.length >= 4 && !isPort(fields[1]) && isPort(fields[3])) {
    // user:pass:host:port — only when the trailing pair is the address.
    if (username) return null
    username = fields[0]
    password = fields[1]
    host = fields[2]
    port = fields[3]
  } else {
    host = fields[0]
    port = fields[1] ?? ''
    if (fields.length > 2) {
      if (username) return null
      username = fields[2]
      password = fields.slice(3).join(':')
    }
  }

  host = host.replace(/^\[|\]$/g, '').trim()
  if (!host || /[\s/@]/.test(host) || !isPort(port)) return null

  return {
    protocol,
    host,
    port: parseInt(port, 10),
    username: username.trim(),
    password: password.trim()
  }
}
