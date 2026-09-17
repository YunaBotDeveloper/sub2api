export default {
  imageStudio: {
    title: 'Image Studio',
    description: 'Tạo và chỉnh sửa ảnh; chi phí tính vào API key đã chọn và kết quả được lưu trong thư viện',
    tabs: { create: 'Tạo ảnh', gallery: 'Thư viện' },
    noEligibleKey: 'Bạn cần một API key đang hoạt động thuộc nhóm OpenAI hoặc Grok được phép tạo ảnh.',
    manageKeys: 'Quản lý API key',
    apiKey: 'API key',
    model: 'Model',
    size: 'Kích thước',
    count: 'Số ảnh',
    quality: 'Chất lượng',
    format: 'Định dạng',
    background: 'Nền',
    auto: 'Tự động',
    prompt: 'Prompt',
    addReference: 'Thêm ảnh tham chiếu',
    referenceHint: 'Tùy chọn: tối đa {max} ảnh PNG/JPEG/WebP (mỗi ảnh 20 MB) để chỉnh sửa',
    reference: 'Ảnh tham chiếu {n}',
    referenceError: {
      type: '{name}: chỉ hỗ trợ PNG, JPEG và WebP',
      size: '{name}: tệp lớn hơn 20 MB'
    },
    generate: 'Tạo ảnh',
    edit: 'Chỉnh sửa ảnh',
    reuse: 'Dùng lại thiết lập',
    copyPrompt: 'Sao chép prompt',
    download: 'Tải xuống',
    image: 'Ảnh {id}',
    loadMore: 'Tải thêm',
    emptyGallery: 'Chưa có ảnh nào.',
    status: { queued: 'Đang chờ', running: 'Đang tạo', succeeded: 'Hoàn thành', failed: 'Thất bại' }
  }
}
