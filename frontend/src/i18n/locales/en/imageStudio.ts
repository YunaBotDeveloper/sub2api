export default {
  imageStudio: {
    title: 'Image Studio',
    description: 'Generate and edit images; results are billed to the selected API key and kept in your gallery',
    tabs: { create: 'Create', gallery: 'Gallery' },
    noEligibleKey: 'You need an active API key in an OpenAI or Grok group that allows image generation.',
    manageKeys: 'Manage API keys',
    apiKey: 'API key',
    model: 'Model',
    size: 'Size',
    count: 'Images',
    quality: 'Quality',
    format: 'Format',
    background: 'Background',
    auto: 'Auto',
    prompt: 'Prompt',
    addReference: 'Add reference images',
    referenceHint: 'Optional: up to {max} PNG/JPEG/WebP images (20 MB each) to edit',
    reference: 'Reference image {n}',
    referenceError: {
      type: '{name}: only PNG, JPEG and WebP are supported',
      size: '{name}: file is larger than 20 MB'
    },
    generate: 'Generate',
    edit: 'Edit images',
    reuse: 'Reuse settings',
    copyPrompt: 'Copy prompt',
    download: 'Download',
    image: 'Image {id}',
    loadMore: 'Load more',
    emptyGallery: 'No images yet.',
    status: { queued: 'Queued', running: 'Running', succeeded: 'Succeeded', failed: 'Failed' }
  }
}
