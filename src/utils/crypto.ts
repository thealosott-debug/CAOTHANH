/**
 * Tiện ích mã hóa & bảo mật thông tin tài khoản
 * Không bao giờ lưu mật khẩu dạng plaintext.
 * Sử dụng Web Crypto API SHA-256 kết hợp Salt ngẫu nhiên.
 */

// Sinh chuỗi muối ngẫu nhiên (salt)
export function generateSalt(length: number = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let salt = '';
  const array = new Uint8Array(length);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
      salt += chars[array[i] % chars.length];
    }
  } else {
    for (let i = 0; i < length; i++) {
      salt += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  return salt;
}

// Băm mật khẩu bằng SHA-256 với Salt
export async function hashPassword(password: string, salt: string): Promise<string> {
  const salted = `${salt}:${password}:green_farm_secret_salt_2026`;
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(salted);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } else {
    // Fallback simple hash implementation if crypto.subtle is unavailable
    let hash = 0;
    for (let i = 0; i < salted.length; i++) {
      const char = salted.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(32, '0');
  }
}

// Kiểm tra mật khẩu nhập vào có khớp với hash lưu trữ không
export async function verifyPassword(password: string, salt: string, storedHash: string): Promise<boolean> {
  const computedHash = await hashPassword(password, salt);
  return computedHash === storedHash;
}

// Sinh ID duy nhất cho các bản ghi nghiên cứu
export function generateRecordId(prefix: string = 'REC'): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 7);
  return `${prefix}_${timestamp}_${random}`.toUpperCase();
}
