// 客戶端安全的認證工具 - 不包含 JWT_SECRET

/**
 * 密碼強度驗證
 */
export function validatePassword(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('密碼長度至少需要 8 個字符')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('密碼必須包含至少一個大寫字母')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('密碼必須包含至少一個小寫字母')
  }

  if (!/\d/.test(password)) {
    errors.push('密碼必須包含至少一個數字')
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('密碼必須包含至少一個特殊字符')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Email 格式驗證
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}