# Timezone Utility - Múi giờ Việt Nam

Chuẩn hóa xử lý múi giờ cho toàn bộ backend Revita.

## Quy tắc

| Ngữ cảnh | Chuẩn |
|----------|-------|
| **DB (Prisma DateTime)** | Luôn lưu UTC |
| **API nhận từ frontend** | Giờ VN (Asia/Ho_Chi_Minh, UTC+7) |
| **API trả về cho user** | Format giờ VN (HH:mm) |

## API

```typescript
import {
  getVnDayRangeUtc,
  formatTimeVn,
  vnTimeToUtcDate,
  parseIsoAsVnToUtc,
  vnDateToUtcMidnight,
  getTodayVnDateStr,
} from '../common/timezone';

// Khoảng 00:00–23:59 VN của ngày (YYYY-MM-DD) → UTC
const { startOfDay, endOfDay } = getVnDayRangeUtc('2026-03-01');

// Format Date UTC → HH:mm VN
formatTimeVn(date); // "08:00"

// Parse "08:00" VN ngày 2026-03-01 → Date UTC
vnTimeToUtcDate('2026-03-01', '08:00');

// Parse ISO string: có Z = UTC, không Z = VN → UTC
parseIsoAsVnToUtc('2026-03-01T08:00:00'); // 01:00 UTC

// Ngày hôm nay VN (YYYY-MM-DD)
getTodayVnDateStr();
```

## Các module đã dùng

- `appointment-booking` – đặt lịch, slot, parse time
- `work-session` – tạo lịch, query theo ngày
- `receptionist` – tạo appointment
