'use client'

import { useState } from 'react'
import {
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  Mail,
  Phone,
  Building,
  Save,
  Camera
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'

export default function SettingsPage() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  // 個人資料狀態
  const [profile, setProfile] = useState({
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    email: user?.email || '',
    phone: '',
    department: user?.department || '',
    bio: '',
    avatar: ''
  })

  // 通知設置
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    taskReminders: true,
    customerUpdates: true,
    systemAlerts: true
  })

  // 系統設置
  const [systemSettings, setSystemSettings] = useState({
    language: 'zh-TW',
    timezone: 'Asia/Taipei',
    dateFormat: 'YYYY-MM-DD',
    theme: 'light'
  })

  const handleProfileSave = async () => {
    setIsLoading(true)
    // 模擬API調用
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsLoading(false)
    // 顯示成功消息
  }

  const handleNotificationSave = async () => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsLoading(false)
  }

  const handleSystemSave = async () => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsLoading(false)
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">設定</h1>
        <p className="text-gray-600">
          管理您的帳戶設定和偏好
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span>個人資料</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span>通知</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>安全</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center space-x-2">
            <Globe className="h-4 w-4" />
            <span>系統</span>
          </TabsTrigger>
        </TabsList>

        {/* 個人資料 */}
        <TabsContent value="profile">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>基本資料</CardTitle>
                <CardDescription>
                  更新您的個人資料和聯絡資訊
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 頭像 */}
                <div className="flex items-center space-x-4">
                  <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center">
                    {user?.first_name ? (
                      <span className="text-2xl font-semibold text-gray-600">
                        {user.first_name.charAt(0)}
                      </span>
                    ) : (
                      <User className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <Button variant="outline" size="sm">
                      <Camera className="h-4 w-4 mr-2" />
                      更換頭像
                    </Button>
                    <p className="text-sm text-gray-500 mt-1">
                      建議尺寸: 400x400px
                    </p>
                  </div>
                </div>

                {/* 基本資料表單 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">名字</Label>
                    <Input
                      id="firstName"
                      value={profile.firstName}
                      onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">姓氏</Label>
                    <Input
                      id="lastName"
                      value={profile.lastName}
                      onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">電子郵件</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">電話號碼</Label>
                    <Input
                      id="phone"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">部門</Label>
                  <Select value={profile.department} onValueChange={(value) => setProfile({ ...profile, department: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="選擇部門" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sales">銷售部門</SelectItem>
                      <SelectItem value="marketing">行銷部門</SelectItem>
                      <SelectItem value="customer_service">客戶服務</SelectItem>
                      <SelectItem value="management">管理層</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">個人簡介</Label>
                  <Textarea
                    id="bio"
                    placeholder="簡單介紹一下自己..."
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  />
                </div>

                <Button onClick={handleProfileSave} disabled={isLoading}>
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? '儲存中...' : '儲存變更'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 通知設定 */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>通知偏好</CardTitle>
              <CardDescription>
                管理您希望接收的通知類型
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { key: 'emailNotifications', label: '電子郵件通知', description: '透過電子郵件接收重要更新' },
                { key: 'pushNotifications', label: '推播通知', description: '在瀏覽器中接收即時通知' },
                { key: 'smsNotifications', label: '簡訊通知', description: '透過簡訊接收緊急通知' },
                { key: 'taskReminders', label: '任務提醒', description: '任務截止日期前的提醒' },
                { key: 'customerUpdates', label: '客戶更新', description: '客戶狀態變更通知' },
                { key: 'systemAlerts', label: '系統警告', description: '系統維護和更新通知' },
              ].map((setting) => (
                <div key={setting.key} className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">{setting.label}</Label>
                    <p className="text-sm text-gray-500">{setting.description}</p>
                  </div>
                  <Switch
                    checked={notifications[setting.key as keyof typeof notifications]}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, [setting.key]: checked })
                    }
                  />
                </div>
              ))}

              <Button onClick={handleNotificationSave} disabled={isLoading}>
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? '儲存中...' : '儲存設定'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 安全設定 */}
        <TabsContent value="security">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>密碼設定</CardTitle>
                <CardDescription>
                  更新您的登入密碼
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">目前密碼</Label>
                  <Input id="currentPassword" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">新密碼</Label>
                  <Input id="newPassword" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">確認新密碼</Label>
                  <Input id="confirmPassword" type="password" />
                </div>
                <Button>更新密碼</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>登入記錄</CardTitle>
                <CardDescription>
                  檢視最近的登入活動
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { date: '2024-09-24 14:30', location: '台北市', ip: '192.168.1.1', status: '成功' },
                    { date: '2024-09-23 09:15', location: '台北市', ip: '192.168.1.1', status: '成功' },
                    { date: '2024-09-22 16:45', location: '台北市', ip: '192.168.1.1', status: '成功' },
                  ].map((login, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{login.date}</p>
                        <p className="text-sm text-gray-500">{login.location} • {login.ip}</p>
                      </div>
                      <Badge variant="outline" className="bg-green-100 text-green-700">
                        {login.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 系統設定 */}
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>系統偏好</CardTitle>
              <CardDescription>
                自訂您的系統設定和偏好
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="language">語言</Label>
                  <Select value={systemSettings.language} onValueChange={(value) => setSystemSettings({ ...systemSettings, language: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="zh-TW">繁體中文</SelectItem>
                      <SelectItem value="zh-CN">简体中文</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">時區</Label>
                  <Select value={systemSettings.timezone} onValueChange={(value) => setSystemSettings({ ...systemSettings, timezone: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Taipei">台北時間 (UTC+8)</SelectItem>
                      <SelectItem value="Asia/Shanghai">上海時間 (UTC+8)</SelectItem>
                      <SelectItem value="Asia/Tokyo">東京時間 (UTC+9)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateFormat">日期格式</Label>
                  <Select value={systemSettings.dateFormat} onValueChange={(value) => setSystemSettings({ ...systemSettings, dateFormat: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="YYYY-MM-DD">2024-09-24</SelectItem>
                      <SelectItem value="DD/MM/YYYY">24/09/2024</SelectItem>
                      <SelectItem value="MM/DD/YYYY">09/24/2024</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="theme">主題</Label>
                  <Select value={systemSettings.theme} onValueChange={(value) => setSystemSettings({ ...systemSettings, theme: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">淺色模式</SelectItem>
                      <SelectItem value="dark">深色模式</SelectItem>
                      <SelectItem value="system">跟隨系統</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleSystemSave} disabled={isLoading}>
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? '儲存中...' : '儲存設定'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}