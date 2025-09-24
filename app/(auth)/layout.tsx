import { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    template: '%s | AI 銷售賦能平台',
    default: '認證 | AI 銷售賦能平台',
  },
  description: '登入或註冊 AI 銷售賦能平台，開始您的智能銷售之旅',
}

interface AuthLayoutProps {
  children: React.ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  )
}