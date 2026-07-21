# Revita Desktop App

Ứng dụng desktop quản lý hàng đợi bệnh nhân được xây dựng bằng Electron, React và TypeScript.

## Yêu cầu hệ thống

- Node.js >= 16.x
- npm hoặc yarn
- Backend API server đang chạy (mặc định: `http://localhost:3000`)

## Cài đặt

1. Clone repository:
```bash
git clone <repository-url>
cd revita-desktop
```

2. Cài đặt dependencies:
```bash
npm install
```

## Cấu hình

1. Tạo file `.env` từ file mẫu:
```bash
cp .env.example .env
```

2. Chỉnh sửa file `.env` với cấu hình của bạn:
```env
# API Configuration
API_BASE_URL=http://localhost:3000

# WebSocket Configuration (use ws:// for WebSocket protocol)
WEBSOCKET_URL=ws://localhost:3000/counters
```

**Lưu ý**: 
- Nếu backend sử dụng HTTPS, thay `http://` bằng `https://` và `ws://` bằng `wss://`
- Đảm bảo backend API server đang chạy trước khi khởi động ứng dụng

## Chạy ứng dụng

### Development mode

Chạy ứng dụng ở chế độ development (port 9000):
```bash
npm start
```

Chạy nhiều instance cùng lúc (cho testing):
```bash
npm run start:2  # Port 9003
npm run start:3  # Port 9004
```

### Build ứng dụng

Package ứng dụng:
```bash
npm run package
```

Tạo installer:
```bash
npm run make
```

## Các chức năng chính

- **Quầy Tiếp Nhận**: Quản lý hàng đợi, gọi bệnh nhân, bỏ qua bệnh nhân
- **Phòng Khám**: Quản lý bệnh nhân trong phòng khám
- **Kiosk Bốc Số**: Bệnh nhân tự thao tác để lấy số
- **Xác nhận bắt đầu dịch vụ**: Quét mã QR phiếu chỉ định và khởi động dịch vụ

## Cấu trúc thư mục

```
src/
├── components/      # React components
├── services/        # API và WebSocket services
├── types/           # TypeScript type definitions
├── assets/          # Hình ảnh và tài nguyên
└── app.tsx          # Entry point của ứng dụng
```

## Scripts

- `npm start` - Chạy ứng dụng ở chế độ development (port 9000)
- `npm run start:2` - Chạy instance thứ 2 (port 9003)
- `npm run start:3` - Chạy instance thứ 3 (port 9004)
- `npm run package` - Package ứng dụng thành file có thể chạy được
- `npm run make` - Tạo installer cho các platform
- `npm run lint` - Kiểm tra code style

## Troubleshooting

### Lỗi kết nối API/WebSocket

- Kiểm tra backend server đã chạy chưa
- Kiểm tra file `.env` có đúng URL không
- Kiểm tra firewall/network settings

### Lỗi camera không hoạt động

- Kiểm tra quyền truy cập camera trên hệ điều hành
- Đảm bảo ứng dụng có quyền truy cập camera (macOS: System Preferences > Security & Privacy)

### Lỗi build

- Xóa `node_modules` và `package-lock.json`, sau đó chạy lại `npm install`
- Kiểm tra Node.js version >= 16.x

## License

MIT
