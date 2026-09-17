// Mirrors backend limits in service/image_studio.go.
export const IMAGE_STUDIO_MAX_INPUT_IMAGES = 4
export const IMAGE_STUDIO_MAX_INPUT_BYTES = 20 * 1024 * 1024
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp']

export type InputImageError = 'type' | 'size'

export function validateInputImage(file: Pick<File, 'type' | 'size'>): InputImageError | null {
  if (!ALLOWED_TYPES.includes(file.type)) return 'type'
  if (file.size > IMAGE_STUDIO_MAX_INPUT_BYTES) return 'size'
  return null
}

export function readAsDataURL(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export function defaultImageModel(platform: string | undefined): string {
  return platform === 'grok' ? 'grok-imagine-image' : 'gpt-image-2'
}
