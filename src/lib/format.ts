const tz = 'Asia/Tokyo';

export const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat('ja-JP', { timeZone: tz, month: 'numeric', day: 'numeric', weekday: 'short' }).format(new Date(iso));

export const fmtTime = (iso: string) =>
  new Intl.DateTimeFormat('ja-JP', { timeZone: tz, hour: '2-digit', minute: '2-digit' }).format(new Date(iso));

export const dateKey = (iso: string) =>
  new Intl.DateTimeFormat('sv-SE', { timeZone: tz }).format(new Date(iso));

/** 今日から何日後か (日本時間の日付ベース) */
export function daysUntil(iso: string, now = new Date()) {
  const a = new Date(dateKey(now.toISOString())).getTime();
  const b = new Date(dateKey(iso)).getTime();
  return Math.round((b - a) / 86_400_000);
}

export function relativeDay(iso: string, now = new Date()) {
  const d = daysUntil(iso, now);
  if (d === 0) return '今日';
  if (d === 1) return '明日';
  if (d > 1) return `${d}日後`;
  return '';
}
