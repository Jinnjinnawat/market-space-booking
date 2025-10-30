// ปรับลิสต์อีเมลแอดมินตามจริงของระบบคุณ
export const ADMIN_EMAILS = [
  "admin@example.com",
  "jinnawat.y@ku.th",
];

export function isAdmin(user) {
  if (!user?.email) return false;
  return ADMIN_EMAILS.includes(user.email.toLowerCase());
}
