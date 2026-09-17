export default {
  imageStudio: {
    title: '图片工作室',
    description: '生成与编辑图片；按所选 API Key 计费，结果保存在图库中',
    tabs: { create: '创作', gallery: '图库' },
    noEligibleKey: '需要一个属于允许生图的 OpenAI 或 Grok 分组的可用 API Key。',
    manageKeys: '管理 API Key',
    apiKey: 'API Key',
    model: '模型',
    size: '尺寸',
    count: '张数',
    quality: '质量',
    format: '格式',
    background: '背景',
    auto: '自动',
    prompt: '提示词',
    addReference: '添加参考图',
    referenceHint: '可选：最多 {max} 张 PNG/JPEG/WebP（每张 20 MB 以内）用于编辑',
    reference: '参考图 {n}',
    referenceError: {
      type: '{name}：仅支持 PNG、JPEG、WebP',
      size: '{name}：文件超过 20 MB'
    },
    generate: '生成',
    edit: '编辑图片',
    reuse: '复用参数',
    copyPrompt: '复制提示词',
    download: '下载',
    image: '图片 {id}',
    loadMore: '加载更多',
    emptyGallery: '暂无图片。',
    status: { queued: '排队中', running: '生成中', succeeded: '已完成', failed: '失败' }
  }
}
