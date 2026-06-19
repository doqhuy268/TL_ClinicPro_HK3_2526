import api from "@/lib/config"
import { authApi } from "@/lib/api"
import type { AuthUser } from "@/lib/types/auth"

export const GOOGLE_LOGIN_ERROR_MESSAGE = "Đăng nhập Google thất bại. Vui lòng thử lại."

export async function exchangeGoogleAuthCode(code: string): Promise<AuthUser | null> {
  const response = await authApi.googleLogin({ code })
  const data = response.data ?? response

  const token = data.token ?? data.accessToken
  if (!token) {
    throw new Error("Token không hợp lệ từ Google")
  }

  localStorage.setItem("auth_token", token)
  if (data.refreshToken) {
    localStorage.setItem("refresh_token", data.refreshToken)
  }
  api.defaults.headers.common.Authorization = `Bearer ${token}`

  let user: AuthUser | null = data.user || null
  if (!user) {
    try {
      const meResponse = await authApi.getMe()
      user = meResponse.data as AuthUser
    } catch (error) {
      console.error("Không thể lấy thông tin người dùng sau khi đăng nhập Google:", error)
    }
  }

  if (user) {
    localStorage.setItem("auth_user", JSON.stringify(user))
  }

  return user
}

