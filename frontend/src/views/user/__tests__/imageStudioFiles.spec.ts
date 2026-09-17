import { describe, expect, it } from 'vitest'
import { IMAGE_STUDIO_MAX_INPUT_BYTES, defaultImageModel, validateInputImage } from '../imageStudioFiles'

describe('imageStudioFiles', () => {
  it('accepts png/jpeg/webp within the size limit', () => {
    expect(validateInputImage({ type: 'image/webp', size: 1024 })).toBeNull()
  })

  it('rejects other types and oversized files', () => {
    expect(validateInputImage({ type: 'image/gif', size: 10 })).toBe('type')
    expect(validateInputImage({ type: 'image/png', size: IMAGE_STUDIO_MAX_INPUT_BYTES + 1 })).toBe('size')
  })

  it('picks the platform default model', () => {
    expect(defaultImageModel('grok')).toBe('grok-imagine-image')
    expect(defaultImageModel('openai')).toBe('gpt-image-2')
  })
})
