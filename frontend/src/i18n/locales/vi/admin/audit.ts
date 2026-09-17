export default {
  audit: {
    title: 'Nhật ký kiểm toán',
    description: 'Ghi lại các thao tác trên mặt phẳng quản lý của quản trị viên và người dùng. Thông tin xác thực trong header chỉ giữ ký tự đầu/cuối và phần thân yêu cầu được ẩn thông tin. Không thể xóa từng mục riêng lẻ; xóa toàn bộ yêu cầu xác minh hai yếu tố.',
    clearAll: 'Xóa tất cả',
    empty: 'Chưa có nhật ký kiểm toán',
    loadFailed: 'Tải nhật ký kiểm toán thất bại',
    filters: {
      all: 'Tất cả',
      q: 'Từ khóa',
      qPlaceholder: 'Đường dẫn / thao tác / email người thực hiện',
      actorEmail: 'Email người thực hiện',
      action: 'Thao tác',
      clientIp: 'IP client',
      method: 'Phương thức',
      authMethod: 'Phương thức xác thực',
      result: 'Kết quả',
      resultSuccess: 'Thành công',
      resultFailure: 'Thất bại',
      startTime: 'Thời gian bắt đầu',
      endTime: 'Thời gian kết thúc'
    },
    columns: {
      time: 'Thời gian',
      actor: 'Người thực hiện',
      action: 'Thao tác',
      method: 'Phương thức',
      result: 'Kết quả',
      clientIp: 'IP client',
      detail: 'Chi tiết'
    },
    detail: {
      title: 'Chi tiết nhật ký kiểm toán',
      actorRole: 'Vai trò',
      methodPath: 'Phương thức / Đường dẫn',
      latency: 'Độ trễ',
      requestId: 'Request ID',
      credential: 'Thông tin xác thực (đã che)',
      userAgent: 'User-Agent',
      requestBody: 'Thân yêu cầu (đã ẩn thông tin)',
      extra: 'Bổ sung'
    },
    clearConfirm: {
      title: 'Xóa toàn bộ nhật ký kiểm toán',
      message: 'Thao tác này xóa vĩnh viễn toàn bộ nhật ký kiểm toán và không thể hoàn tác. Bản thân thao tác xóa sẽ được ghi lại. Tiếp tục?',
      totpTitle: 'Nhập mã xác thực hai yếu tố',
      totpHint: 'Xóa nhật ký kiểm toán yêu cầu xác minh TOTP mới.',
      success: 'Đã xóa {count} nhật ký kiểm toán',
      failed: 'Xóa nhật ký kiểm toán thất bại'
    }
  }
}
