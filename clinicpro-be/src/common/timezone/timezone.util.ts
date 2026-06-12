/**
 * Timezone utility - Chuẩn hóa múi giờ cho toàn bộ backend ClinicPro
 *
 * QUY TẮC:
 * - DB (Prisma DateTime): luôn lưu UTC
 * - API nhận từ frontend: giờ VN (Asia/Ho_Chi_Minh, UTC+7)
 * - API trả về: format giờ VN cho user (HH:mm)
 *
 * @see https://en.wikipedia.org/wiki/Asia/Ho_Chi_Minh
 */
export const TIMEZONE_VN = 'Asia/Ho_Chi_Minh';
const UTC_OFFSET_HOURS = 7;

/**
 * Chuyển giờ VN (HH:mm) sang UTC Date.
 * VD: "08:00" VN ngày 2026-03-01 → 2026-03-01T01:00:00.000Z
 */
export function vnTimeToUtcDate(
  dateStr: string,
  timeStr: string,
): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  let utcHours = hours - UTC_OFFSET_HOURS;
  let utcDay = d;
  if (utcHours < 0) {
    utcHours += 24;
    utcDay -= 1;
  }
  if (utcHours >= 24) {
    utcHours -= 24;
    utcDay += 1;
  }
  return new Date(Date.UTC(y, m - 1, utcDay, utcHours, minutes, 0, 0));
}

/**
 * Lấy khoảng 00:00–23:59 VN của một ngày (YYYY-MM-DD) dưới dạng UTC.
 * Dùng cho query work session, appointment, v.v.
 */
export function getVnDayRangeUtc(dateStr: string): {
  startOfDay: Date;
  endOfDay: Date;
} {
  const [y, m, d] = dateStr.split('-').map(Number);
  const msOffset = UTC_OFFSET_HOURS * 60 * 60 * 1000;
  const startOfDay = new Date(
    Date.UTC(y, m - 1, d, 0, 0, 0, 0) - msOffset,
  );
  const endOfDay = new Date(
    Date.UTC(y, m - 1, d, 23, 59, 59, 999) - msOffset,
  );
  return { startOfDay, endOfDay };
}

/**
 * Format Date (UTC) sang giờ VN HH:mm
 */
export function formatTimeVn(date: Date): string {
  return date.toLocaleTimeString('en-GB', {
    timeZone: TIMEZONE_VN,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Parse ISO string. Nếu không có 'Z', coi là giờ VN và chuyển sang UTC.
 * Dùng khi nhận từ frontend (VD: work session creation).
 */
export function parseIsoAsVnToUtc(isoString: string): Date {
  if (isoString.includes('Z')) {
    return new Date(isoString);
  }
  const match = isoString.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?(?:\.(\d+))?/,
  );
  if (!match) {
    return new Date(isoString + 'Z');
  }
  const [, y, m, d, h, min] = match.map(Number);
  return vnTimeToUtcDate(
    `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
    `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`,
  );
}

/**
 * Tạo Date UTC từ ngày VN (YYYY-MM-DD), 00:00 VN
 */
export function vnDateToUtcMidnight(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
}

/**
 * Lấy ngày hôm nay theo múi giờ VN (YYYY-MM-DD)
 */
export function getTodayVnDateStr(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: TIMEZONE_VN });
}
