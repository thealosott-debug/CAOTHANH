/**
 * Dữ liệu khởi tạo & Cấu hình nghiên cứu chuẩn
 * Đề tài: Tác động của ‘Cam kết xanh’ kết hợp ứng dụng quản lý chăn nuôi đến hành vi quản lý chất thải tại nguồn của các hộ chăn nuôi
 */

import { Household, ResearchConfig, User } from '../types';

export const PERMANENT_APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycby07SokU46mlK013-tGmlnu0GQFAg_zCpSuPE9l-Sb_geT340XMruiDPlAjVfCC0dQovg/exec';

export const DEFAULT_CONFIG: ResearchConfig = {
  appName: 'Green Farm Research',
  researchTitle: 'Tác động của ‘Cam kết xanh’ kết hợp ứng dụng quản lý chăn nuôi đến hành vi quản lý chất thải tại nguồn của các hộ chăn nuôi',
  totalHouseholds: 40,
  tnTarget: 20,
  dcTarget: 20,
  totalWeeks: 6,
  cwmMaxScore: 6,
  reminderDay: 'Chủ nhật',
  reminderTime: '19:00',
  startDate: '2026-09-01',
  endDate: '2026-11-15',
  spreadsheetId: '',
  appsScriptUrl: PERMANENT_APPS_SCRIPT_URL,
  allowSelfRegistration: false,
  autoLockAfterDays: 7,
};

// Sổ tay định nghĩa 6 tiêu chí CWM
export interface CwmGuideItem {
  code: string;
  title: string;
  definition: string;
  passCriteria: string;
  failCriteria: string;
  notes: string;
}

export const CWM_CRITERIA_GUIDE: CwmGuideItem[] = [
  {
    code: 'B1',
    title: 'Thu gom chất thải đúng cách',
    definition: 'Chất thải chăn nuôi (phân, chất độn chuồng, thức ăn thừa) được thu dọn định kỳ vào thiết bị chứa hoặc khu tập kết.',
    passCriteria: 'Thu gom hàng ngày hoặc theo chu kỳ quy định, không để phát tán vương vãi rõ rệt ra lối đi hoặc khu vực sinh hoạt.',
    failCriteria: 'Chất thải lưu đọng dày đặc trên sàn chuồng không dọn, tràn ra ngoài khu vực chuồng nuôi.',
    notes: 'Quan sát bề mặt chuồng nuôi, dụng cụ xẻng, cào gom phân chuyên dụng.'
  },
  {
    code: 'B2',
    title: 'Phân loại chất thải tại nguồn',
    definition: 'Tách biệt chất thải rắn (phân chuồng, xác thải), chất thải lỏng (nước tiểu, nước rửa chuồng) và bao bì thuốc thú y/hóa chất.',
    passCriteria: 'Có bao bì, thùng riêng biệt cho chất thải nguy hại (vỏ lọ thuốc, kim tiêm); phân tách chất thải rắn khỏi dòng nước xả.',
    failCriteria: 'Tất cả vỏ chai thuốc sát trùng, kim tiêm, rác sinh hoạt bị vứt lẫn vào đống phân hoặc xả xuống rãnh thoát.',
    notes: 'Yêu cầu kiểm tra kỹ góc chuồng xem có bao bì thuốc thú y nguy hại lẫn phân không.'
  },
  {
    code: 'B3',
    title: 'Có nơi lưu chứa phù hợp',
    definition: 'Có hố ủ, nhà chứa phân có mái che, bể lắng, hoặc túi biogas kín đáp ứng quy mô đàn.',
    passCriteria: 'Nơi chứa kiên cố, có tường ngăn hoặc bờ bao, có mái che hoặc bạt phủ chống nước mưa rửa trôi, không rò rỉ.',
    failCriteria: 'Chất thải đổ lộ thiên không che phủ, nước phân ngấm trực tiếp xuống đất hoặc chảy tràn khi trời mưa.',
    notes: 'Đánh giá tỷ lệ thể tích nơi chứa so với sản lượng phân hàng ngày của hộ.'
  },
  {
    code: 'B4',
    title: 'Không xả trực tiếp ra môi trường',
    definition: 'Tuyệt đối không có đường ống, rãnh xả phân tươi hoặc nước thải chuồng nuôi chưa qua xử lý ra kênh, rạch, mương, cống lộ thiên.',
    passCriteria: 'Toàn bộ dòng thải được dẫn vào hệ thống xử lý (hầm biogas, bể lắng, hố ủ). Không có cống xả tắt ra sông/ngòi.',
    failCriteria: 'Phát hiện rãnh dẫn nước phân xả thẳng ra vườn hàng xóm, mương nội đồng, kênh rạch công cộng.',
    notes: 'Quan sát chu vi sau chuồng và các đường ống xả ngầm hoặc hở.'
  },
  {
    code: 'B5',
    title: 'Có xử lý / tái sử dụng phù hợp',
    definition: 'Áp dụng ít nhất một giải pháp xử lý: hầm khí sinh học (biogas), ủ phân hữu cơ vi sinh (compost), nuôi trùn quế, đệm lót sinh học.',
    passCriteria: 'Hệ thống biogas hoạt động sinh khí; hoặc phân được ủ hoai mục bằng chế phẩm vi sinh để bón cây; hoặc tái sử dụng an toàn.',
    failCriteria: 'Không xử lý gì, để phân tự phân hủy tạo mùi hôi thối, hoặc bán phân tươi khi chưa ủ hoai gây mầm bệnh.',
    notes: 'Kiểm tra nhiệt độ đống ủ, ngọn lửa biogas hoặc chế phẩm vi sinh hộ đang dùng.'
  },
  {
    code: 'B6',
    title: 'Duy trì vệ sinh khu vực chăn nuôi',
    definition: 'Vệ sinh chuồng trại sạch sẽ, sát trùng định kỳ, kiểm soát ruồi nhặng, mùi hôi ở mức chấp nhận được.',
    passCriteria: 'Không khí xung quanh không có mùi nồng nặc gây ảnh hưởng khu dân cư; ít ruồi nhặng; có rải vôi bột hoặc phun thuốc sát trùng.',
    failCriteria: 'Mùi hôi xộc lên nồng nặc cách xa 20m, ruồi nhặng bu kín thành từng đàn, nền chuồng nhầy nhụa bùn phân lâu ngày.',
    notes: 'Đánh giá cảm quan thực địa kết hợp kiểm tra lịch sử phun khử trùng.'
  }
];

// 10 câu hỏi Kiến thức (Module BC-02)
export const KNOWLEDGE_QUESTIONS = [
  {
    id: 'K01',
    text: 'Chất thải chăn nuôi tươi chưa qua xử lý khi thải trực tiếp ra nguồn nước sẽ gây ra tác hại chính nào?',
    options: [
      'Gây hiện tượng phú dưỡng, ô nhiễm nguồn nước mặt và phát tán mầm bệnh vi khuẩn, ký sinh trùng',
      'Làm nước trong hơn do cá ăn hết cặn bã hữu cơ',
      'Không gây tác hại đáng kể vì chất hữu cơ tự phân hủy nhanh',
      'Tăng lượng oxy hòa tan trong nước'
    ],
    correctAnswer: 0,
    explanation: 'Chất thải tươi chứa nồng độ COD, BOD cao cùng vi khuẩn Coliform, Salmonella gây ô nhiễm nặng và dịch bệnh.'
  },
  {
    id: 'K02',
    text: 'Biện pháp nào sau đây giúp kiểm soát mùi hôi và diệt trừ mầm bệnh trong phân gia súc hiệu quả nhất?',
    options: [
      'Đổ phân ra bờ rào phơi nắng tự nhiên',
      'Ủ phân hiếu khí/kỵ khí có bổ sung chế phẩm vi sinh men vi sinh đạt nhiệt độ 50 - 65°C',
      'Xịt nhiều nước để phân trôi nhanh xuống cống ngầm',
      'Dùng quạt công suất lớn thổi mùi sang phía đối diện'
    ],
    correctAnswer: 1,
    explanation: 'Quá trình ủ phân sinh nhiệt (50-65°C) tiêu diệt trứng giun sán và mầm bệnh nguy hiểm.'
  },
  {
    id: 'K03',
    text: 'Vỏ lọ vắc-xin, bao bì kháng sinh, kim tiêm sau khi sử dụng trong chăn nuôi cần được xử lý như thế nào?',
    options: [
      'Vứt chung vào hố biogas để vi khuẩn tự tiêu hủy kim tiêm',
      'Đốt cùng với rác cỏ ngoài vườn chuồng',
      'Thu gom vào thùng chứa rác thải nguy hại riêng, có nắp đậy và chuyển giao xử lý đúng quy định',
      'Rửa sạch rồi vứt vào nguồn nước'
    ],
    correctAnswer: 2,
    explanation: 'Chất thải thú y thuộc danh mục chất thải y tế/nguy hại, tuyệt đối không xả chung với phân.'
  },
  {
    id: 'K04',
    text: 'Khí sinh học (Biogas) chủ yếu được tạo thành từ thành phần khí chính nào sau đây?',
    options: [
      'Khí Oxy (O2) chiếm 80%',
      'Khí Mê-tan (CH4) chiếm 50-70% và Khí Carbonic (CO2)',
      'Khí Nitơ nguyên chất',
      'Khí Clo khử trùng'
    ],
    correctAnswer: 1,
    explanation: 'Khí sinh học chứa 50-70% CH4, có thể dùng đun nấu thay gas thương phẩm.'
  },
  {
    id: 'K05',
    text: 'Tại sao cần phân tách riêng phân đặc và nước tiểu/nước rửa chuồng tại nguồn?',
    options: [
      'Để giảm thể tích nước thải cần xử lý, tăng hiệu quả ủ phân hữu cơ rắn và giảm quá tải hầm biogas',
      'Để chuồng nuôi luôn trơn trượt',
      'Không cần thiết vì gộp chung sẽ dễ trôi hơn',
      'Làm tăng mùi hôi chuồng nuôi'
    ],
    correctAnswer: 0,
    explanation: 'Phân loại tại nguồn là nguyên tắc cốt lõi giúp xử lý phân hữu cơ chất lượng cao.'
  },
  {
    id: 'K06',
    text: 'Sử dụng đệm lót sinh học trong chăn nuôi mang lại lợi ích chủ yếu nào?',
    options: [
      'Tăng chi phí điện nước rửa chuồng',
      'Tiêu hủy phân tại chỗ, giảm thiểu mùi hôi, không cần rửa chuồng hàng ngày, tiết kiệm nước',
      'Làm vật nuôi chậm lớn do nằm trên đệm',
      'Bắt buộc phải thay đệm lót mỗi ngày 3 lần'
    ],
    correctAnswer: 1,
    explanation: 'Đệm lót sinh học sử dụng men vi sinh phân giải phân và nước tiểu tại chỗ.'
  },
  {
    id: 'K07',
    text: 'Khoảng cách an toàn tối thiểu từ chuồng chăn nuôi gia súc đến nhà ở và nguồn nước sinh hoạt theo khuyến cáo là?',
    options: [
      'Càng gần nhà càng tốt để tiện chăm sóc (dưới 2m)',
      'Tối thiểu 10 - 15 mét trở lên và đặt ở cuối hướng gió chính',
      'Không cần khoảng cách',
      'Chỉ cần cách 50cm'
    ],
    correctAnswer: 1,
    explanation: 'Đảm bảo khoảng cách ly vệ sinh dịch tễ giúp ngăn ngừa bệnh lây từ động vật sang người.'
  },
  {
    id: 'K08',
    text: 'Nước thải sau hầm biogas (nước biogas lỏng) có thể được tận dụng như thế nào là an toàn?',
    options: [
      'Cho gia súc uống trực tiếp thay nước giếng',
      'Ủ lắng lọc tưới cho cây trồng hoặc cỏ chăn nuôi sau khi kiểm tra nồng độ dinh dưỡng',
      'Xả ồ ạt thẳng vào ao nuôi tôm giống',
      'Đổ ra đường làng cho bay hơi'
    ],
    correctAnswer: 1,
    explanation: 'Nước thải sau biogas chứa nhiều dưỡng chất N, P, K rất tốt cho cây trồng nếu dùng liều lượng phù hợp.'
  },
  {
    id: 'K09',
    text: 'Theo Luật Chăn nuôi hiện hành, hành vi nào sau đây bị nghiêm cấm?',
    options: [
      'Xả chất thải chăn nuôi chưa được xử lý hoặc xử lý chưa đạt quy chuẩn kỹ thuật ra môi trường',
      'Ủ phân chuồng thành phân bón hữu cơ vi sinh',
      'Thu gom chất thải hàng ngày',
      'Trồng cây xanh cách ly quanh khu vực trang trại'
    ],
    correctAnswer: 0,
    explanation: 'Luật Chăn nuôi 2018 nghiêm cấm tuyệt đối hành vi xả thải chưa qua xử lý ra môi trường.'
  },
  {
    id: 'K10',
    text: 'Thời gian ủ phân chuồng bằng phương pháp ủ nóng có bổ sung chế phẩm Trichoderma thường kéo dài bao lâu để phân hoai mục hoàn toàn?',
    options: [
      'Chỉ 2 giờ đồng hồ',
      'Từ 25 đến 45 ngày tùy điều kiện nhiệt độ và độ ẩm',
      'Phải đủ 5 năm',
      'Không bao giờ hoai mục'
    ],
    correctAnswer: 1,
    explanation: 'Chu kỳ ủ vi sinh hiếu khí thường từ 25 - 45 ngày phân sẽ hoai mục và hết mùi hôi.'
  }
];

// 5 phát biểu Thái độ (Module BC-02 - Thang Likert 1-5)
export const ATTITUDE_STATEMENTS = [
  { id: 'T01', text: 'Tôi tin rằng việc thu gom và xử lý chất thải chăn nuôi tại nguồn là trách nhiệm trực tiếp của người chăn nuôi, không phải chỉ của chính quyền.' },
  { id: 'T02', text: 'Quản lý tốt chất thải chăn nuôi giúp bảo vệ sức khỏe của chính gia đình tôi và cộng đồng xung quanh.' },
  { id: 'T03', text: 'Tôi cảm thấy không thoải mái và áy náy nếu chuồng trại của mình phát tán mùi hôi hoặc xả thải làm ảnh hưởng đến bà con lối xóm.' },
  { id: 'T04', text: 'Áp dụng các biện pháp tái sử dụng phân (làm biogas, ủ phân hữu cơ) mang lại lợi ích kinh tế thiết thực hơn là xả bỏ.' },
  { id: 'T05', text: 'Chăn nuôi thân thiện với môi trường là xu thế tất yếu để nghề chăn nuôi của gia đình phát triển bền vững lâu dài.' }
];

// 5 câu hỏi Ý định thay đổi (Module BC-03 - Thang Likert 1-5)
export const INTENTION_QUESTIONS = [
  { id: 'YD01', text: 'Tôi có ý định rõ ràng sẽ cải thiện quy trình thu gom và lưu chứa chất thải tại chuồng nuôi của gia đình trong thời gian tới.' },
  { id: 'YD02', text: 'Tôi sẵn sàng đầu tư thêm công sức và chi phí hợp lý để xây dựng hố ủ hoặc cải tạo hệ thống xử lý chất thải.' },
  { id: 'YD03', text: 'Tôi hoàn toàn tin tưởng vào khả năng của bản thân trong việc thực hiện phân loại và xử lý chất thải đúng kỹ thuật.' },
  { id: 'YD04', text: 'Tôi coi việc không xả thải trực tiếp ra kênh rạch là nguyên tắc đạo đức nghề nghiệp bắt buộc của gia đình tôi.' },
  { id: 'YD05', text: 'Tôi có ý định duy trì việc quản lý chất thải chu đáo liên tục ngay cả khi chương trình nghiên cứu kết thúc.' }
];

// Danh sách các rào cản phổ biến (Module BC-06 & BC-07)
export const COMMON_BARRIERS = [
  { id: 'B_TIME', label: 'Thiếu thời gian chăm sóc chuồng trại do bận rộn' },
  { id: 'B_TOOLS', label: 'Thiếu dụng cụ thu gom chuyên dụng (xe cút kít, xẻng gạt, ủng cao su, thùng)' },
  { id: 'B_COST', label: 'Chi phí mua chế phẩm sinh học, hóa chất khử trùng hoặc xây hầm chứa' },
  { id: 'B_KNOWLEDGE', label: 'Chưa nắm vững kỹ thuật ủ phân compost hoặc vận hành hầm biogas' },
  { id: 'B_HABIT', label: 'Khó thay đổi thói quen rửa trôi phân bằng vòi nước truyền thống' },
  { id: 'B_STORAGE', label: 'Diện tích đất chật hẹp, không có nơi làm hố lưu chứa phân' },
  { id: 'B_ODOR', label: 'Mùi hôi nồng nặc khi thu dọn phân bằng tay' },
  { id: 'B_WEATHER', label: 'Thời tiết mưa bão gây ngập úng tràn phân' }
];

// Dữ liệu tài khoản quản trị viên duy nhất ban đầu
export const DEFAULT_USERS: User[] = [
  {
    id: 'USR_ADMIN_01',
    username: 'admin',
    fullName: 'Quản trị viên (Chủ nhiệm đề tài)',
    email: 'admin@research.vn',
    phone: '',
    role: 'ADMIN',
    status: 'ACTIVE',
    passwordHash: '', // Sẽ được tính với salt khi khởi tạo
    salt: 'SALT_ADMIN_999',
    plainPasswordHint: '123456',
    createdAt: new Date().toISOString(),
  }
];

// Danh sách hộ chăn nuôi ban đầu: Để trống hoàn toàn để nhập dữ liệu thực tế
export function generateInitialHouseholds(): Household[] {
  return [];
}
