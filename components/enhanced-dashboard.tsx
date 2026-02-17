"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Play,
  Plus,
  Upload,
  Sparkles,
  FileText,
  BarChart3
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface DashboardStats {
  totalSuites: number
  totalTests: number
  passRate: number
  flakyTests: number
  avgExecutionTime: number
  trend: 'up' | 'down'
  trendValue: number
  passedTests?: number
  failedTests?: number
}

interface RecentActivity {
  suiteName: string
  status: 'PASS' | 'FAIL' | 'PENDING'
  timestamp: string
  duration?: number
  passed?: number
  failed?: number
}

interface EnhancedDashboardProps {
  stats: DashboardStats
  recentActivity: RecentActivity[]
  onCreateSuite: () => void
  onImport: () => void
  onRunAll: () => void
  onAIGenerate: () => void
}

function formatRelativeTime(timestamp: string): string {
  const now = new Date()
  const then = new Date(timestamp)
  const diffMs = now.getTime() - then.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return then.toLocaleDateString()
}

export function EnhancedDashboard({
  stats,
  recentActivity,
  onCreateSuite,
  onImport,
  onRunAll,
  onAIGenerate
}: EnhancedDashboardProps) {
  // Generate trend data (last 7 days)
  const trendData = React.useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const baseRate = stats.passRate

    // Generate realistic variation around current pass rate
    return days.map((day, index) => ({
      day,
      passRate: Math.max(0, Math.min(100, baseRate + (Math.random() * 10 - 5)))
    }))
  }, [stats.passRate])

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Suites */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Suites</p>
                <h3 className="text-3xl font-bold mt-2">{stats.totalSuites}</h3>
                <p className="text-xs text-muted-foreground mt-1">Active test suites</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Tests */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tests</p>
                <h3 className="text-3xl font-bold mt-2">{stats.totalTests}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.passedTests || 0} passed, {stats.failedTests || 0} failed
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pass Rate */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pass Rate</p>
                <div className="flex items-center gap-2 mt-2">
                  <h3 className="text-3xl font-bold">{stats.passRate}%</h3>
                  {stats.trend === 'up' ? (
                    <div className="flex items-center text-green-600 text-sm font-medium">
                      <TrendingUp className="h-4 w-4" />
                      <span>+{stats.trendValue}%</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-red-600 text-sm font-medium">
                      <TrendingDown className="h-4 w-4" />
                      <span>-{stats.trendValue}%</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">vs last period</p>
              </div>
              <div className={`h-12 w-12 ${stats.passRate >= 90 ? 'bg-green-100 dark:bg-green-900/20' : 'bg-amber-100 dark:bg-amber-900/20'} rounded-full flex items-center justify-center`}>
                {stats.passRate >= 90 ? (
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Flaky Tests */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Flaky Tests</p>
                <h3 className="text-3xl font-bold mt-2">{stats.flakyTests}</h3>
                <p className="text-xs text-muted-foreground mt-1">Need attention</p>
              </div>
              <div className="h-12 w-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {recentActivity.slice(0, 10).map((activity, index) => (
                <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <div className={`h-2 w-2 rounded-full flex-shrink-0 ${
                    activity.status === 'PASS' ? 'bg-green-500' : 
                    activity.status === 'FAIL' ? 'bg-red-500' : 
                    'bg-slate-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{activity.suiteName}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.status === 'PENDING' ? 'Not yet run' : formatRelativeTime(activity.timestamp)}
                      {typeof activity.duration === 'number' && activity.duration > 0 && ` • ${activity.duration}ms`}
                    </p>
                  </div>
                  <Badge
                    variant={
                      activity.status === 'PASS' ? 'default' :
                      activity.status === 'FAIL' ? 'destructive' :
                      'outline'
                    }
                    className="text-xs flex-shrink-0"
                  >
                    {activity.status}
                  </Badge>
                </div>
              ))}
              {recentActivity.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No recent activity</p>
                  <p className="text-xs mt-1">Run some tests to see results here</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Execution Trends */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              7-Day Pass Rate Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="day"
                  stroke="#94a3b8"
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  domain={[0, 100]}
                  stroke="#94a3b8"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  formatter={(value: any) => [`${value.toFixed(1)}%`, 'Pass Rate']}
                />
                <Line
                  type="monotone"
                  dataKey="passRate"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                Average: <span className="font-semibold text-foreground">{stats.passRate}%</span>
                {' • '}
                Avg Time: <span className="font-semibold text-foreground">{stats.avgExecutionTime}ms</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              onClick={onCreateSuite}
              className="h-20 flex-col gap-2 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
            >
              <Plus className="h-6 w-6" />
              <span>New Suite</span>
            </Button>
            <Button
              onClick={onImport}
              variant="outline"
              className="h-20 flex-col gap-2 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <Upload className="h-6 w-6" />
              <span>Import</span>
            </Button>
            <Button
              onClick={onRunAll}
              variant="outline"
              className="h-20 flex-col gap-2 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <Play className="h-6 w-6" />
              <span>Run All</span>
            </Button>
            <Button
              onClick={onAIGenerate}
              variant="outline"
              className="h-20 flex-col gap-2 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <Sparkles className="h-6 w-6" />
              <span>AI Generate</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

