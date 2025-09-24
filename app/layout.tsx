import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/hooks/use-auth'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    template: '%s | AI 銷售賦能平台',
    default: 'AI 銷售賦能平台',
  },
  description: '專為銷售團隊打造的 AI 驅動銷售賦能平台，提升銷售效率和客戶體驗',
  keywords: ['AI', '銷售', '賦能', 'CRM', '智能客服', '銷售分析'],
  authors: [{ name: 'AI 銷售賦能平台團隊' }],
  creator: 'AI 銷售賦能平台',
  publisher: 'AI 銷售賦能平台',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'zh_TW',
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: 'AI 銷售賦能平台',
    description: '專為銷售團隊打造的 AI 驅動銷售賦能平台，提升銷售效率和客戶體驗',
    siteName: 'AI 銷售賦能平台',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI 銷售賦能平台',
    description: '專為銷售團隊打造的 AI 驅動銷售賦能平台，提升銷售效率和客戶體驗',
    creator: '@ai_sales_platform',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  other: {
    'theme-color': '#3b82f6',
    'color-scheme': 'light dark',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <head />
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}