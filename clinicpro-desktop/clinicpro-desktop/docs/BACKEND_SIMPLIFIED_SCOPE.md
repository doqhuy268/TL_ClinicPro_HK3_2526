# Đặc tả phạm vi tối giản – Đồng bộ Backend & Desktop/Kiosk

Tài liệu này mô tả **các chức năng được giữ nguyên, đơn giản hóa hoặc vô hiệu hóa** trong phạm vi đề tài, để team Backend (NestJS) biết rõ cần **bắt kịp / thay đổi / tắt bớt** cho phù hợp với client Desktop/Kiosk và mục tiêu tập trung vào AI gợi ý chẩn đoán.

---

## 1. Auth & Người dùng

| Hạng mục | Trạng thái | Yêu cầu đối với Backend |
|----------|------------|--------------------------|
| Đăng nhập / phân quyền cơ bản | **GIỮ** | Giữ nguyên: JWT, role (admin, staff, doctor…). Desktop/Kiosk có thể chạy **không bắt buộc auth** cho một số endpoint công khai (ví dụ Kiosk bốc số, lấy danh sách quầy) nếu triển khai ở mạng nội bộ tin cậy; hoặc dùng API key / token thiết bị đơn giản. |
| Quản lý user phức tạp (2FA, OAuth, session phức tạp) | **BỎ BỚT / KHÔNG CẦN** | Không triển khai 2FA, OAuth social login, session phức tạp cho phiên bản tối giản. |

**Kết luận Backend:** Giữ auth cơ bản (login + JWT). Không cần mở rộng tính năng bảo mật nâng cao trong scope đề tài.

---

## 2. Quản lý hồ sơ bệnh nhân & Bệnh án

| Hạng mục | Trạng thái | Yêu cầu đối với Backend |
|----------|------------|--------------------------|
| CRUD hồ sơ bệnh nhân (patient profile) | **GIỮ** | Giữ đủ để: tạo/sửa/xem hồ sơ, có `profileCode`, `name`, `dateOfBirth`/`age`, `gender`, `phone`, `isPregnant`, `isDisabled`. |
| Tra cứu hồ sơ theo mã (`/api/patient-profiles/code/:code`) | **GIỮ** | Desktop Kiosk gọi khi quét QR PP. Backend trả về thông tin cơ bản (name, age, gender, profileCode, isPregnant, isDisabled). |
| Tra cứu hồ sơ theo SĐT (`/api/patient-profiles/search?phone=`) | **GIỮ** | Kiosk dùng để tự điền form khi bệnh nhân nhập số điện thoại. Trả về profile đầu tiên (hoặc mới nhất) nếu có. |
| Bệnh án / EMR đầy đủ (lịch sử khám, kết quả cận lâm sàng chi tiết) | **GIỮ TỐI THIỂU** | Đủ để bác sĩ tạo/đọc bệnh án, ghi chú tóm tắt phục vụ **AI gợi ý chẩn đoán**. Không cần lịch sử phức tạp, versioning chi tiết trong scope tối giản. |

**Kết luận Backend:** Giữ API patient-profiles (code, search by phone). Bệnh án chỉ cần mô hình đơn giản: bác sĩ tạo bệnh án, có trường “ghi chú/tóm tắt” để gửi sang AI.

---

## 3. Lịch làm việc & Ca khám bác sĩ

| Hạng mục | Trạng thái | Yêu cầu đối với Backend |
|----------|------------|--------------------------|
| Lịch làm việc bác sĩ (ngày, ca, phòng) | **GIỮ** | Giữ: bác sĩ có lịch theo ngày/ca; trạng thái ca (đang mở / đã kết thúc). |
| Trạng thái ca (mở/đóng) | **GIỮ** | Cần biết ca hiện tại có đang nhận bệnh nhân hay không. |
| Tối ưu slot / xếp lịch tự động phức tạp | **BỎ** | Không cần thuật toán tối ưu slot, gợi ý slot “tốt nhất”, cân bằng tải phức tạp. Chỉ cần slot cố định theo ca (ví dụ 30 phút/slot) hoặc “số lượng tối đa/ca” đơn giản. |
| Kiểm tra conflict lịch chi tiết | **ĐƠN GIẢN HÓA** | Chỉ cần tránh double-book cơ bản (một ca một bác sĩ một phòng). Không cần tối ưu toàn cục. |

**Kết luận Backend:** Module lịch bác sĩ: giữ dữ liệu lịch + trạng thái ca; bỏ hoặc không triển khai logic tối ưu slot và xếp lịch phức tạp.

---

## 4. Đặt lịch & Hàng chờ khám

| Hạng mục | Trạng thái | Yêu cầu đối với Backend |
|----------|------------|--------------------------|
| Đặt lịch khám (appointment booking) | **GIỮ** | Luồng cơ bản: tạo lịch hẹn (bệnh nhân, bác sĩ, ngày, giờ, chuyên khoa/dịch vụ). Có `appointmentCode` (dạng APT-xxx) để Kiosk quét QR. |
| API lấy thông tin lịch theo mã (`/api/appointment-booking/appointments/code/:code`) | **GIỮ** | Kiosk gọi khi quét QR APT. Trả về: appointmentCode, patientProfile, doctor, specialty, appointmentDate, startTime, endTime. |
| Xếp hàng đợi (queue) – FIFO cơ bản | **GIỮ** | Bệnh nhân bốc số → vào hàng đợi theo quầy (counter). Thứ tự phục vụ: **FIFO** trong từng nhóm. |
| Ưu tiên – chỉ 1–2 nhóm | **ĐƠN GIẢN HÓA** | Chỉ cần **một lớp ưu tiên** (priority) dựa trên cờ: ví dụ `isElderly` (≥75 tuổi), `isChild` (trẻ em), `isPregnant`, `isDisabled`, `isVIP`. Backend có thể gộp thành “priority level” (NORMAL / PRIORITY) và xếp PRIORITY trước, trong mỗi nhóm vẫn FIFO. **Bỏ** logic ưu tiên nhiều cấp, điểm số phức tạp, ưu tiên theo thời gian hẹn phức tạp. |
| Kiểm tra “đến sớm 15 phút” (appointment) | **TÙY CHỌN** | Desktop Kiosk hiện có kiểm tra phía client (cảnh báo “đến quá sớm”). Backend **không bắt buộc** từ chối hay chặn; có thể chỉ ghi nhận và vẫn cho bốc số. Nếu giữ: một endpoint hoặc field `isTooEarly` trong response đủ dùng. |
| API bốc số `POST /api/take-number/take` | **GIỮ** | Body: `TakeNumberRequest` (patientName, patientAge, patientGender, patientPhone, isPregnant, isDisabled, isElderly, isVIP, notes, patientProfileCode, appointmentCode). Backend: tạo ticket, gán quầy, tính queue number, lưu DB, emit WebSocket. |
| API quầy: danh sách quầy, snapshot hàng đợi, gọi số tiếp theo, bỏ qua | **GIỮ** | Giữ nguyên các endpoint Desktop đang dùng: `GET /api/counter-assignment/counters`, `GET /api/counter-assignment/queue/:counterId`, `POST /api/counter-assignment/next-patient/:counterId`, `POST /api/counter-assignment/skip-current/:counterId`. |
| WebSocket kênh `/counters` | **GIỮ** | Events: `new_ticket`, `queue_update`, `queue_position_changes` (hoặc tương đương) để Desktop cập nhật real-time. |
| Logic “hẹn trước đúng giờ” tách riêng hàng | **ĐƠN GIẢN HÓA HOẶC BỎ** | Có thể **không** tách hàng “scheduled” riêng; chỉ cần gắn cờ ưu tiên (ví dụ có appointment → ưu tiên nhẹ hoặc bình thường). Desktop có thể vẫn hiển thị 2 cột (ưu tiên / chờ) dựa trên flag từ API, backend chỉ cần trả về đúng flag. |

**Kết luận Backend:**  
- Giữ: take-number, counter-assignment, appointment by code, WebSocket counters.  
- Đơn giản: ưu tiên = 1 lớp (PRIORITY vs NORMAL), FIFO trong từng lớp. Bỏ ưu tiên đa cấp và logic “đến sớm” phức tạp (tùy chọn hỗ trợ nhẹ).

---

## 5. Dịch vụ khám & Thanh toán

| Hạng mục | Trạng thái | Yêu cầu đối với Backend |
|----------|------------|--------------------------|
| Tạo hóa đơn / phiếu thu (invoice) | **GIỮ** | Có thể tạo hóa đơn, gắn dịch vụ, tính tổng tiền. |
| Đánh dấu đã thanh toán | **GIỮ** | Trạng thái: đã thanh toán (paid). Có thể dùng field `paymentMethod`: `CASH` hoặc `BANK_TRANSFER` (hoặc tương đương). |
| Tích hợp PayOS (thanh toán online) | **TẮT / KHÔNG TRIỂN KHAI** | Không tích hợp PayOS trong scope tối giản. Chỉ ghi nhận “đã trả tiền mặt” hoặc “đã chuyển khoản” (lưu vào DB, không gọi gateway). |
| Mã giao dịch / link thanh toán online | **KHÔNG CẦN** | Không tạo link thanh toán, không xử lý webhook PayOS. |

**Kết luận Backend:** Module thanh toán: giữ tạo hóa đơn + đánh dấu đã thanh toán với phương thức CASH / BANK_TRANSFER. Tắt hoàn toàn tích hợp PayOS (và các gateway thanh toán online khác) cho phiên bản tối giản.

---

## 6. AI gợi ý chẩn đoán & Chatbot

| Hạng mục | Trạng thái | Yêu cầu đối với Backend |
|----------|------------|--------------------------|
| AI gợi ý chẩn đoán (từ ghi chú bệnh án) | **TÍCH HỢP** | Backend (NestJS) gọi service AI (FastAPI hoặc script Python): input = age, gender, note (tóm tắt bệnh án). Output = danh sách gợi ý (mã ICD / tên bệnh, xác suất). NestJS expose API cho web/mobile bác sĩ, ví dụ: `GET /api/records/:id/ai-suggestions` hoặc `POST /api/ai/suggest-diagnosis`. |
| Chatbot hỗ trợ bệnh nhân | **TÙY CHỌN / ĐƠN GIẢN** | Nếu giữ: dùng một LLM (Gemini API) với prompt cố định “hỗ trợ FAQ, không chẩn đoán”. Endpoint `POST /api/chatbot` (hoặc tương đương). **Desktop/Kiosk không gọi chatbot**; chỉ web/mobile. Backend có thể stub (trả về message cố định) nếu chưa tích hợp LLM. |

**Kết luận Backend:**  
- Bắt buộc cho đề tài: **một endpoint gợi ý chẩn đoán** gọi sang mô hình AI (TF-IDF + SGD hoặc API bên ngoài), nhận (age, gender, note) → trả về top-K bệnh.  
- Chatbot: tùy chọn; nếu có thì đơn giản (FAQ, không chẩn đoán). Desktop không cần gọi.

---

## 7. File storage (Supabase)

| Hạng mục | Trạng thái | Yêu cầu đối với Backend |
|----------|------------|--------------------------|
| Upload file (kết quả cận lâm sàng, đơn thuốc, ảnh) | **STUB / TẮT BỚT** | Giữ API (signature, URL) nhưng **không upload thật** lên Supabase: chỉ log metadata (tên file, size) hoặc lưu path giả. Hoặc lưu file tạm local server. Desktop/Kiosk **không upload file** trong luồng chính; chỉ có thể có tính năng in phiếu (local). |

**Kết luận Backend:** Supabase (hoặc S3 tương đương) có thể tắt thật; API file trả về success và URL giả hoặc chỉ ghi log để demo luồng.

---

## 8. Email & SMS thông báo

| Hạng mục | Trạng thái | Yêu cầu đối với Backend |
|----------|------------|--------------------------|
| Gửi email (Resend) – OTP, thông báo lịch hẹn | **CHẾ ĐỘ KHÔ (DRY RUN)** | Giữ luồng logic (tạo OTP, gọi service gửi email) nhưng khi `EMAIL_DRY_RUN=true`: **không gửi thật**, chỉ log nội dung ra console hoặc vào bảng log. Không cần key Resend thật trong môi trường dev/demo. |
| Gửi SMS (AWS SNS) – OTP | **TẮT** | **Bỏ hẳn** gửi SMS trong scope tối giản. Không gọi SNS; có thể log “SMS would be sent to …” nếu cần kiểm tra luồng. |

**Kết luận Backend:** Email: dry run (log only). SMS: tắt hoàn toàn. Desktop/Kiosk không gửi email/SMS trực tiếp.

---

## 9. Các API Desktop/Kiosk đang dùng – Checklist Backend

Để Desktop/Kiosk chạy đúng với phiên bản tối giản, Backend cần **đảm bảo** các endpoint sau (giữ nguyên hoặc đơn giản hóa theo bảng trên):

| # | Method | Endpoint | Mục đích | Ghi chú |
|---|--------|----------|----------|--------|
| 1 | GET | `/api/counter-assignment/counters` | Danh sách quầy | Giữ. Trả về `counters[]` (counterId, counterCode, counterName, location). |
| 2 | GET | `/api/counter-assignment/queue/:counterId` | Snapshot hàng đợi quầy | Giữ. Trả về `QueueSnapshot` (current, next, queue, ordered) với các trường ưu tiên đơn giản (isElderly, isPregnant, isDisabled, isVIP, isOnTime…). |
| 3 | POST | `/api/counter-assignment/next-patient/:counterId` | Gọi bệnh nhân tiếp theo | Giữ. |
| 4 | POST | `/api/counter-assignment/skip-current/:counterId` | Bỏ qua bệnh nhân hiện tại | Giữ. |
| 5 | POST | `/api/take-number/take` | Kiosk bốc số | Giữ. Body = TakeNumberRequest; trả về ticket + patientInfo. |
| 6 | GET | `/api/patient-profiles/code/:code` | Tra cứu hồ sơ theo mã (QR PP) | Giữ. |
| 7 | GET | `/api/patient-profiles/search?phone=` | Tra cứu hồ sơ theo SĐT | Giữ. |
| 8 | GET | `/api/appointment-booking/appointments/code/:code` | Tra cứu lịch hẹn theo mã (QR APT) | Giữ. |
| 9 | POST | `/api/routing/status/completed` | Hoàn thành phục vụ (patientProfileId, roomId) | Giữ nếu vẫn dùng ClinicDashboard. |
| 10 | GET | `/api/clinic-rooms` | Danh sách phòng khám | Giữ nếu giữ ClinicDashboard (mở rộng). |
| 11 | GET | `/api/clinic-rooms/:id/prescription-services` | Dịch vụ theo phiếu chỉ định theo phòng | Giữ nếu giữ ClinicDashboard. |
| 12 | GET | `/api/prescriptions/pending-services/:code` | Dịch vụ chờ theo mã phiếu | Giữ nếu giữ StartServices (mở rộng). |
| 13 | POST | `/api/prescriptions/start-services` | Bắt đầu dịch vụ (services[]) | Giữ nếu giữ StartServices. |

**WebSocket**

- Path/namespace: `/counters` (hoặc theo cấu hình hiện tại).
- Events Backend emit: ít nhất `new_ticket`, `queue_update` hoặc `queue_position_changes` để CounterDashboard cập nhật real-time.

---

## 10. Tóm tắt hành động cho Backend

| Nhóm | Hành động |
|------|-----------|
| **Giữ nguyên** | Auth cơ bản, Patient profiles (code + search by phone), Appointment (create + get by code), Take-number, Counter-assignment (counters, queue, next, skip), WebSocket counters, Tạo hóa đơn + đánh dấu thanh toán (CASH/TRANSFER), Lịch bác sĩ + trạng thái ca, Bệnh án tối thiểu (ghi chú cho AI). |
| **Đơn giản hóa** | Ưu tiên hàng đợi: 1 lớp (PRIORITY vs NORMAL), FIFO trong từng lớp; bỏ tối ưu slot lịch bác sĩ; bỏ logic ưu tiên phức tạp (nhiều cấp, điểm số). |
| **Tắt / Stub** | PayOS và thanh toán online; gửi SMS; upload file thật (Supabase) – có thể stub/log. |
| **Dry run** | Email: chỉ log khi EMAIL_DRY_RUN=true. |
| **Tích hợp mới (đề tài)** | Endpoint gợi ý chẩn đoán AI (gọi FastAPI/Python), nhận (age, gender, note) → trả về top-K bệnh. Chatbot: tùy chọn, đơn giản. |

---

*Tài liệu này có thể đặt trong repo Backend (ví dụ `docs/SIMPLIFIED_SCOPE.md` hoặc `docs/DESKTOP_BACKEND_ALIGNMENT.md`) và cập nhật khi hai bên thống nhất thay đổi.*
