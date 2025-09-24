'use client'

import { useState } from 'react'
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  User,
  Plus,
  Filter,
  MoreHorizontal
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Task {
  id: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  status: 'pending' | 'in_progress' | 'completed'
  dueDate: string
  assignee: string
  customer?: string
  tags: string[]
}

export default function TasksPage() {
  const [tasks] = useState<Task[]>([
    {
      id: '1',
      title: '跟進ABC公司提案',
      description: '需要在本週內回覆ABC公司關於自動化解決方案的提案',
      priority: 'high',
      status: 'pending',
      dueDate: '2024-09-25',
      assignee: '張經理',
      customer: 'ABC公司',
      tags: ['提案', '跟進']
    },
    {
      id: '2',
      title: '準備XYZ客戶展示',
      description: '為下週的客戶展示準備產品Demo和相關資料',
      priority: 'high',
      status: 'in_progress',
      dueDate: '2024-09-26',
      assignee: '李銷售',
      customer: 'XYZ科技',
      tags: ['展示', '準備']
    },
    {
      id: '3',
      title: '更新產品價格清單',
      description: '根據最新的成本分析更新所有產品的價格清單',
      priority: 'medium',
      status: 'pending',
      dueDate: '2024-09-28',
      assignee: '王助理',
      tags: ['價格', '更新']
    },
    {
      id: '4',
      title: '客戶滿意度調查',
      description: '完成Q3的客戶滿意度調查報告',
      priority: 'low',
      status: 'completed',
      dueDate: '2024-09-20',
      assignee: '陳分析師',
      tags: ['調查', '報告']
    },
    {
      id: '5',
      title: '月度銷售報告',
      description: '編製9月份的銷售業績報告',
      priority: 'medium',
      status: 'in_progress',
      dueDate: '2024-09-30',
      assignee: '劉經理',
      tags: ['報告', '業績']
    }
  ])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-700 border-green-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-600" />
      case 'pending': return <AlertCircle className="h-4 w-4 text-orange-600" />
      default: return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '已完成'
      case 'in_progress': return '進行中'
      case 'pending': return '待處理'
      default: return '未知'
    }
  }

  const filterTasks = (status?: string) => {
    if (!status) return tasks
    return tasks.filter(task => task.status === status)
  }

  const TaskCard = ({ task }: { task: Task }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              {getStatusIcon(task.status)}
              <Badge variant="outline" className={getPriorityColor(task.priority)}>
                {task.priority === 'high' && '高優先級'}
                {task.priority === 'medium' && '中優先級'}
                {task.priority === 'low' && '低優先級'}
              </Badge>
              <span className="text-sm text-gray-500">{getStatusText(task.status)}</span>
            </div>
            <CardTitle className="text-lg">{task.title}</CardTitle>
            {task.customer && (
              <div className="text-sm text-blue-600 font-medium">
                {task.customer}
              </div>
            )}
          </div>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-sm text-gray-600 mb-4">
          {task.description}
        </CardDescription>

        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {task.tags.map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <div className="flex items-center">
              <User className="h-3 w-3 mr-1" />
              {task.assignee}
            </div>
            <div className="flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              {task.dueDate}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">我的任務</h1>
          <p className="text-gray-600">
            管理和追蹤您的銷售任務和待辦事項
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            篩選
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            新增任務
          </Button>
        </div>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">總任務</p>
                <p className="text-2xl font-bold text-gray-900">{tasks.length}</p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">待處理</p>
                <p className="text-2xl font-bold text-orange-600">
                  {filterTasks('pending').length}
                </p>
              </div>
              <div className="h-8 w-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-4 w-4 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">進行中</p>
                <p className="text-2xl font-bold text-blue-600">
                  {filterTasks('in_progress').length}
                </p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">已完成</p>
                <p className="text-2xl font-bold text-green-600">
                  {filterTasks('completed').length}
                </p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 任務列表 */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">全部任務</TabsTrigger>
          <TabsTrigger value="pending">待處理 ({filterTasks('pending').length})</TabsTrigger>
          <TabsTrigger value="in_progress">進行中 ({filterTasks('in_progress').length})</TabsTrigger>
          <TabsTrigger value="completed">已完成 ({filterTasks('completed').length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {filterTasks('pending').map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </TabsContent>

        <TabsContent value="in_progress" className="space-y-4">
          {filterTasks('in_progress').map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {filterTasks('completed').map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}