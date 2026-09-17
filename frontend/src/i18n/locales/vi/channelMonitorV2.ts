/** Channel Monitor V2 (user + admin passive monitor UI) */
export default {
  channelMonitorV2: {
    title: 'Giám sát kênh',
    updating: 'Đang cập nhật dữ liệu',
    updatedTo: 'Đã cập nhật đến {time}',
    partialCoverage: 'Dữ liệu lịch sử chưa đầy đủ',
    bootstrap: {
      title: 'Đang xây dựng dữ liệu giám sát lịch sử',
      description:
        'Khi bật lần đầu, tổng hợp thụ động sẽ âm thầm lấp đầy các cửa sổ 90m, 24h, 7d và 30d trong nền. Mọi khoảng thời gian sẽ đầy đủ sau khi quá trình này kết thúc.',
      progress: 'Đã hoàn tất {percent}%',
      working: 'Đang tổng hợp trong nền…',
    },
    timeRange: 'Khoảng thời gian',
    clearFilters: 'Đặt lại',
    refreshingFilters: 'Bộ lọc đã thay đổi; đang làm mới ma trận, xu hướng và chi tiết…',
    switchingData: 'Đang chuyển dữ liệu đã lọc…',
    summaryAria: 'Tóm tắt khoảng đã chọn',
    loadFailed: 'Tải giám sát kênh thất bại',
    detailLoadFailed: 'Tải chi tiết giám sát kênh thất bại',
    otherModels: 'Mô hình khác',
    ignored: 'Đã bỏ qua',
    currentUser: 'Người dùng hiện tại',
    ranges: { '90m': '90m', '24h': '24h', '7d': '7d', '30d': '30d' },
    filters: {
      platform: 'Nền tảng', allPlatforms: 'Tất cả', group: 'Nhóm', allGroups: 'Tất cả', model: 'Mô hình', allModels: 'Tất cả',
      empty: 'Không có tùy chọn', selectedCount: '{count}', labelValue: '{label}: {value}'
    },
    groupBy: {
      label: 'Nhóm theo', platform: 'Nền tảng', platformGroup: 'Nền tảng / Nhóm', platformModel: 'Nền tảng / Mô hình', platformGroupModel: 'Nền tảng / Nhóm / Mô hình'
    },
    trendView: { label: 'Kiểu xu hướng', pulse: 'Ma trận xung', line: 'Biểu đồ đường' },
    healthMode: { label: 'Hiển thị sức khỏe', overall: 'Tổng thể', success: 'Tỷ lệ lỗi', ttft: 'Token đầu tiên', cache: 'Tỷ lệ cache' },
    tabs: { aria: 'Chiều chi tiết', models: 'Mô hình', errors: 'Nguyên nhân lỗi', users: 'Xếp hạng người dùng' },
    metrics: {
      rpm: 'RPM',
      tpm: 'TPM',
      tps: 'Token/giây',
      rpmDetail: 'Số yêu cầu mỗi phút',
      tpmDetail: 'Số token mỗi phút',
      tpsDetail: 'Tính bằng TPM ÷ 60',
      errorRate: 'Tỷ lệ lỗi',
      ttft: 'Token đầu tiên',
      ttftP50: 'Token đầu tiên P50',
      durationP50: 'Thời lượng P50',
      cacheRate: 'Tỷ lệ cache',
      cacheDetail: 'Tỷ trọng đọc cache',
      successRate: 'Tỷ lệ thành công',
      successRateValue: 'Tỷ lệ thành công {value}',
      errorRateValue: 'Tỷ lệ lỗi {value}',
      rpmValue: 'RPM {value}',
      tpmValue: 'TPM {value}',
      tpsValue: 'Token/giây {value}',
      ttftValue: 'Token đầu tiên {value}',
      durationValue: 'Thời lượng {value}',
      cacheRateValue: 'Tỷ lệ cache {value}',
    },
    table: { platformModel: 'Nền tảng / Mô hình', rank: 'Hạng', user: 'Người dùng' },
    empty: { title: 'Không có dữ liệu để hiển thị', description: 'Hãy thử thay đổi khoảng thời gian hoặc bộ lọc' },
    bucket: { minutes: 'Khoảng {count} phút', hours: 'Khoảng {count} giờ', days: 'Khoảng {count} ngày' },
    matrix: {
      title: 'Xu hướng khả dụng', description: 'Mỗi hàng là một chiều kênh và mỗi ô là một khoảng tổng hợp; di chuột để xem chi tiết', wheelZoom: 'Cuộn trên các ô để phóng to (khoảng hẹp hơn, ô rộng hơn)', wheelZoomX: 'Cuộn trên các ô để phóng to (khoảng hẹp hơn, ô rộng hơn)', dimension: 'Chiều kênh', emptyTitle: 'Không có dữ liệu ma trận cho cửa sổ đã chọn', legendAria: 'Chú giải điểm sức khỏe', bad: 'Kém', good: 'Tốt', healthyLegend: 'Khỏe (≥80)', warningLegend: 'Cần theo dõi (50–79)', criticalLegend: 'Nghiêm trọng (<50)', unknownLegend: 'Không có lưu lượng / không đủ mẫu', noTraffic: 'Không có lưu lượng trong khoảng này', noTrafficAt: '{time} · không có lưu lượng', scoreLine: 'Điểm sức khỏe {score}', resetZoom: 'Đặt lại thu phóng', axisPlaceholder: 'Nhịp thời gian'
    },
    chart: {
      title: 'Xu hướng khả dụng', description: 'Xu hướng làm mượt: tỷ lệ lỗi · token đầu tiên P50 · tỷ lệ cache', emptyTitle: 'Không có dữ liệu xu hướng cho cửa sổ đã chọn', errorLegend: 'Tỷ lệ lỗi (trục trái %)', cacheLegend: 'Tỷ lệ cache (trục trái %)', ttftLegend: 'Token đầu tiên P50 (trục phải)', errorDataset: 'Xu hướng tỷ lệ lỗi %', cacheDataset: 'Xu hướng tỷ lệ cache %', ttftDataset: 'Xu hướng token đầu tiên P50 (ms)', percentAxis: 'Tỷ lệ %', resetZoom: 'Đặt lại thu phóng'
    },
    errorDetail: { http: 'HTTP {code}', upstream: 'Thượng nguồn {code}', noMessage: 'Không có thông báo lỗi', empty: 'Chỉ có tỷ lệ theo danh mục (thông báo mẫu chỉ dành cho quản trị viên)' },
    errorCategories: {
      content_policy: 'Chính sách nội dung', authentication: 'Xác thực', context_limit: 'Giới hạn ngữ cảnh', invalid_request: 'Yêu cầu không hợp lệ', model_unsupported: 'Mô hình không được hỗ trợ', group_access: 'Quyền truy cập nhóm', quota_or_balance: 'Hạn mức hoặc số dư', account_pool_unavailable: 'Kho tài khoản không khả dụng', rate_or_capacity: 'Tốc độ hoặc dung lượng', timeout: 'Hết thời gian chờ', transport_or_stream: 'Truyền tải hoặc stream', upstream_forbidden: 'Thượng nguồn từ chối', not_found: 'Không tìm thấy', client_cancelled: 'Client đã hủy', upstream_5xx: 'Thượng nguồn 5xx', internal: 'Nội bộ', other: 'Khác'
    },
    rank: {
      gold: 'Hạng 1 vàng',
      silver: 'Hạng 2 bạc',
      bronze: 'Hạng 3 đồng',
      place: 'Hạng {n}',
      unranked: 'Chưa xếp hạng',
    },
    settings: {
      title: 'Cấu hình giám sát dữ liệu V2',
      description:
        'Cấu hình các chiều tổng hợp mức sử dụng thụ động (nền tảng / mô hình / nhóm) và chu kỳ làm mới. Màu sức khỏe và chi tiết trên trang /monitor của người dùng hiển thị tỷ lệ, RPM và TPM — không hiển thị số lượng yêu cầu tuyệt đối.',
      save: 'Lưu',
      loading: 'Đang tải…',
      loadFailed: 'Tải cấu hình V2 thất bại',
      saveSuccess: 'Đã lưu cấu hình giám sát V2',
      saveFailed: 'Lưu cấu hình V2 thất bại',
      modeBanner:
        'Chế độ hệ thống hiện là {mode}. Tổng hợp theo phút của V2 sẽ không chạy; có thể chuẩn bị cấu hình này ngay bây giờ và nó sẽ có hiệu lực sau khi chuyển sang {modeV2}. Đổi chế độ tại Cài đặt hệ thống → Công tắc tính năng.',
      modeClosed: 'Đã tắt giám sát kênh',
      modeV1: 'V1 thăm dò chủ động',
      modeV2: 'V2 giám sát thụ động',
      enableTitle: 'Bật tổng hợp V2',
      enableHint:
        'Áp dụng khi chế độ hệ thống là V2. Tắt mục này chỉ dừng tổng hợp của cấu hình này; công tắc chế độ hệ thống vẫn nằm trong Công tắc tính năng.',
      refreshTitle: 'Chu kỳ tổng hợp',
      refreshHint: 'Ảnh hưởng đến độ chi tiết thời gian của ma trận và chu kỳ làm mới',
      refreshAria: 'Chu kỳ tổng hợp',
      platformsTitle: 'Nền tảng và mô hình',
      platformsHint:
        'Để trống = hiển thị mọi tên mô hình thực; khi điền, chỉ các mô hình được liệt kê có hàng riêng, còn lại gộp vào “Khác”',
      modelsPlaceholder: 'Trống = mọi mô hình thực; hoặc liệt kê các mô hình phổ biến (còn lại → Khác)',
      badgeAllModels: 'Tất cả mô hình',
      badgeOther: '+ Khác',
      groupsTitle: 'Nhóm được giám sát',
      groupsSelected: 'Đã chọn {count} nhóm',
      groupsAll: 'Tất cả nhóm',
      groupsEmpty: 'Không có nhóm nào',
      errorsTitle: 'Danh mục lỗi và bỏ qua',
      errorsHint:
        'Các danh mục được đánh dấu “bỏ qua” bị loại khỏi tỷ lệ lỗi và điểm sức khỏe, nhưng vẫn hiện màu xám trong phân tích lỗi. Các lỗi không khớp được gộp vào “Khác”.',
      ignoredSummary: 'Bỏ qua {ignored} danh mục · tính vào tỷ lệ lỗi {counted} danh mục',
      healthTitle: 'Ngưỡng sức khỏe',
      healthHint:
        'Kiểm soát dải màu hiển thị cho người dùng và điểm tổng thể. Giá trị mặc định khá dễ dãi để tỷ lệ lỗi nhỏ hoặc cache thấp không lập tức bị coi là không khỏe.',
      fields: {
        minimumSample: 'Số mẫu tối thiểu',
        warningError: 'Tỷ lệ lỗi cần theo dõi %',
        criticalError: 'Tỷ lệ lỗi nghiêm trọng %',
        targetTtft: 'TTFT mục tiêu ms',
        warningTtft: 'TTFT cần theo dõi ms',
        criticalTtft: 'TTFT nghiêm trọng ms',
        warningCache: 'Tỷ lệ cache cần theo dõi %',
        criticalCache: 'Tỷ lệ cache nghiêm trọng %',
      },
      namedModelsEmpty: 'Danh sách mô hình của nền tảng đang trống: mọi tên mô hình thực sẽ được hiển thị (không gộp vào “Khác”).',
      namedModelsCount: 'Đang hiển thị {count} chiều mô hình được đặt tên; các mô hình không được liệt kê gộp vào “Khác” theo từng nền tảng.',
      userContractTitle: 'Quy ước hiển thị cho người dùng',
      userContract: {
        health: 'Trọng số màu sức khỏe: tỷ lệ lỗi 60% + token đầu tiên P50 20% + tỷ lệ cache 20% (ngưỡng có thể cấu hình ở trên)',
        trend: 'Xu hướng có thể chuyển giữa ma trận xung và biểu đồ đường (lỗi · cache · token đầu tiên)',
        latency: 'Độ trễ hiển thị AVG · P50 · P90; không hiển thị số lượng yêu cầu / lỗi tuyệt đối',
        models: 'Danh sách mô hình trống sẽ hiển thị tên thực và không bao giờ gộp tất cả vào “Khác”',
      },
    },
    admin: {
      descriptionV1:
        'Chế độ hệ thống là V1 thăm dò chủ động: quản lý các monitor thăm dò và chạy kiểm tra ngay; tổng hợp V2 không chạy.',
      descriptionV2:
        'Chế độ hệ thống là V2 giám sát thụ động: cấu hình các chiều tổng hợp; thăm dò chủ động V1 không chạy.',
      tabAria: 'Quản lý giám sát',
      tabV2: 'Cấu hình giám sát dữ liệu V2',
      tabV1Active: 'V1 thăm dò chủ động',
      tabV1History: 'Lịch sử V1 (thăm dò không hoạt động ở chế độ hiện tại)',
    },
  },
}
