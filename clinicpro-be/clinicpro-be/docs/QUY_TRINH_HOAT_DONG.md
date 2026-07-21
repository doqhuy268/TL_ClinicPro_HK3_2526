# Quy trình hoạt động Revita (FE + BE + Desktop/Kiosk)

## Tổng quan

Revita là hệ thống quản lý khám bệnh gồm 3 phần:
- **FE (Next.js)**: Web cho bệnh nhân đặt lịch, bác sĩ quản lý lịch, admin quản lý
- **BE (NestJS)**: API backend
- **Desktop/Kiosk (Electron)**: Ứng dụng tại phòng khám (bốc số, màn hình gọi số)

## Quy trình đúng (thứ tự thiết lập)

### Bước 1: Chuẩn bị dữ liệu (chạy seed)

```bash
cd revita-be-main
npx prisma migrate deploy   # hoặc migrate dev
npx prisma db seed          # Tạo dữ liệu mẫu
```

Seed sẽ tạo:
- Chuyên khoa, phòng khám, booth
- Dịch vụ + liên kết phòng (ClinicRoomService)
- **BoothService** (booth ↔ dịch vụ) – mới thêm
- Bác sĩ, kỹ thuật viên, admin, bệnh nhân
- Lịch làm việc mẫu cho bác sĩ

### Bước 2: Chạy Backend

```bash
cd revita-be-main
npm run start:dev
```

### Bước 3: Chạy Frontend

```bash
cd revita-fe-main
npm run dev
```

### Bước 4: Luồng sử dụng

#### 4.1. Bác sĩ tạo lịch làm việc (trước khi bệnh nhân đặt)

1. Đăng nhập FE với tài khoản bác sĩ (vd: `doctor@gmail.com`)
2. Vào **Quản lý lịch làm việc** (Calendar)
3. Chọn ngày, giờ bắt đầu/kết thúc, dịch vụ
4. Lưu → Hệ thống tự gán booth phù hợp

**Lưu ý:** Nếu lỗi "Không tìm được buồng khám":
- Chạy lại `npx prisma db seed` để tạo BoothService
- Khởi động lại BE để áp dụng code mới

#### 4.2. Bệnh nhân đặt lịch

1. Đăng nhập FE với tài khoản bệnh nhân
2. Vào **Đặt lịch khám**
3. Chọn chuyên khoa hoặc bác sĩ → Chọn ngày → Chọn dịch vụ → Chọn giờ
4. Xác nhận đặt lịch

**Điều kiện:** Phải có bác sĩ đã tạo lịch làm việc trước (bước 4.1).

#### 4.3. Tại phòng khám (Desktop/Kiosk)

1. Bệnh nhân đến → Bốc số tại Kiosk
2. Màn hình gọi số hiển thị hàng đợi
3. Nhân viên quầy gọi số tiếp theo
4. Bệnh nhân vào khám theo hướng dẫn routing

## Tài khoản mẫu (sau khi seed)

| Vai trò   | Email            | Mật khẩu (thường) |
|-----------|------------------|-------------------|
| Admin     | admin@gmail.com  | (xem seed)        |
| Bác sĩ    | doctor@gmail.com | (xem seed)        |
| Bệnh nhân | patient@gmail.com| (xem seed)        |
| Kỹ thuật viên | technician@gmail.com | (xem seed) |

*(Mật khẩu mặc định thường là `123456` hoặc tương tự – kiểm tra trong `prisma/seed.ts`)*

## Khắc phục lỗi thường gặp

| Lỗi | Cách xử lý |
|-----|------------|
| Không tìm được buồng khám | Chạy `npx prisma db seed`, khởi động lại BE |
| Không thấy bác sĩ khi đặt lịch | Bác sĩ cần tạo lịch làm việc trước (Calendar) |
| Work sessions loaded: 0 | Bình thường nếu chưa tạo lịch; tạo lịch mới |
| 401 Unauthorized | Kiểm tra token, đăng nhập lại |
