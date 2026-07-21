# Phạm vi tối giản – Backend (NestJS) đã triển khai

Tài liệu tóm tắt các thay đổi Backend theo đặc tả đồng bộ với Desktop/Kiosk và đề tài tiểu luận.

## 1. Auth & Người dùng

- **Giữ nguyên:** Đăng nhập JWT, phân quyền (admin, staff, doctor, receptionist, cashier…).
- **Không triển khai trong scope tối giản:** 2FA, OAuth social login, session phức tạp.

## 2. Hồ sơ bệnh nhân & Bệnh án

- **API giữ nguyên:**  
  - `GET /api/patient-profiles/code/:code` — tra cứu theo mã (QR PP).  
  - `GET /api/patient-profiles/search?phone=...` — tra cứu theo SĐT.  
- Bệnh án: đủ để bác sĩ tạo/đọc, có trường ghi chú phục vụ AI gợi ý chẩn đoán.

## 3. Lịch làm việc & Ca khám

- **Giữ:** Lịch theo ngày/ca, trạng thái ca (mở/đóng).
- **Không triển khai:** Tối ưu slot, xếp lịch tự động phức tạp. Chỉ kiểm tra trùng lịch cơ bản (double-book).

## 4. Đặt lịch & Hàng chờ

- **Giữ:**  
  - `POST /api/take-number/take` — bốc số.  
  - `GET /api/counter-assignment/counters` — danh sách quầy.  
  - `GET /api/counter-assignment/queue/:counterId` — snapshot hàng đợi.  
  - `POST /api/counter-assignment/next-patient/:counterId` — gọi số tiếp.  
  - `POST /api/counter-assignment/skip-current/:counterId` — bỏ qua.  
  - `GET /api/appointment-booking/appointments/code/:code` — lịch theo mã (QR APT).  
  - WebSocket kênh `/counters` (new_ticket, queue_update…).
- **Đơn giản hóa ưu tiên:** Một lớp: **PRIORITY** (người già ≥75, trẻ &lt;6, khuyết tật, mang thai, VIP) vs **NORMAL**. Trong mỗi nhóm: FIFO theo thứ tự đến (sequence). Đã sửa trong `take-number.service.ts` (`calculateQueuePriority`).
- **Routing:** `POST /api/routing/status/completed` và các endpoint routing được đánh dấu `@Public()` để Desktop/Kiosk gọi không bắt buộc JWT (mạng nội bộ).

## 5. Dịch vụ & Thanh toán

- **Giữ:** Tạo hóa đơn, đánh dấu đã thanh toán, phương thức `CASH` / `BANK_TRANSFER`.
- **Tắt PayOS:** Khi `DISABLE_PAYOS=true` trong `.env`, `PayOsService.isEnabled()` = false, thanh toán chuyển khoản qua PayOS không tạo link (trả lỗi rõ ràng). Chỉ dùng tiền mặt hoặc ghi nhận chuyển khoản thủ công.

## 6. AI gợi ý chẩn đoán & Chatbot

- **Endpoint mới:**  
  - `POST /api/ai/suggest-diagnosis`  
  - Body: `{ "age": number, "gender": string, "note": string, "topK"?: number }`  
  - Trả về: `{ "predictions": [{ "icd_code", "probability", "disease_name" }], "patient_info" }`  
  - Gọi service AI tại `RECOMMENDER_BASE_URL/predict`. Nếu chưa cấu hình `RECOMMENDER_BASE_URL` thì trả về `predictions: []`.
- Chatbot (Gemini): tùy chọn; khi không có `GEMINI_API_KEY` thì chatbot tắt, server vẫn chạy.

## 7. File storage (Supabase)

- Đã xử lý trước: khi không cấu hình `SUPABASE_URL`, `FileStorageService` không khởi tạo client, upload chỉ log/stub.

## 8. Email & SMS

- **Email:** `EMAIL_DRY_RUN=true` → chỉ log, không gửi thật (đã có sẵn).
- **SMS:** Khi `DISABLE_SMS=true` → không gọi AWS SNS, chỉ log OTP ra console.

## 9. Checklist API Desktop/Kiosk

| # | Method | Endpoint | Ghi chú |
|---|--------|----------|--------|
| 1 | GET | `/api/counter-assignment/counters` | @Public |
| 2 | GET | `/api/counter-assignment/queue/:counterId` | @Public |
| 3 | POST | `/api/counter-assignment/next-patient/:counterId` | @Public |
| 4 | POST | `/api/counter-assignment/skip-current/:counterId` | @Public |
| 5 | POST | `/api/take-number/take` | @Public |
| 6 | GET | `/api/patient-profiles/code/:code` | @Public |
| 7 | GET | `/api/patient-profiles/search?phone=` | Cần JWT (role phù hợp) |
| 8 | GET | `/api/appointment-booking/appointments/code/:code` | @Public |
| 9 | POST | `/api/routing/status/completed` | Public (RoutingController @Public) |
| 10 | GET | `/api/clinic-rooms` | Có trong ClinicModule |
| 11 | GET | `/api/clinic-rooms/:id/prescription-services` | Có |
| 12 | GET | `/api/prescriptions/pending-services/:code` | @Public |
| 13 | POST | `/api/prescriptions/start-services` | @Public |

WebSocket: namespace `/counters` (hoặc theo cấu hình gateway), events: `new_ticket`, `queue_update` / `queue_position_changes`.

## 10. Biến môi trường thêm cho scope tối giản

- `DISABLE_PAYOS=true` — tắt tích hợp PayOS.  
- `DISABLE_SMS=true` — tắt gửi SMS, chỉ log OTP.  
- `RECOMMENDER_BASE_URL=<url>` — URL service AI gợi ý chẩn đoán (FastAPI/predict). Để trống thì `POST /api/ai/suggest-diagnosis` trả về `predictions: []`.

Xem thêm `.env.example` trong thư mục gốc project.
