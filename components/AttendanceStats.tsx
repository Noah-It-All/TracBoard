'use client'

import { useEffect, useState } from 'react'
import { Users, TrendingUp, CalendarCheck } from 'lucide-react'

interface Stats {
  totalMembers: number
  attendanceRate: number
  totalDays: number
}

interface AttendanceStatsProps {
  refreshKey: number
}

export default function AttendanceStats({ refreshKey }: AttendanceStatsProps) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function fetchStats() {
      try {
        const response = await fetch('/api/attendance/stats', {
          cache: 'no-store',
        })
        const data = await response.json()

        if (!isMounted) return

        const totalDays = data.all.length > 0
          ? Math.max(...data.all.map((m: any) => m.totalDays))
          : 0

        setStats({
          totalMembers: data.all.length,
          attendanceRate:
            data.all.length > 0
              ? data.all.reduce(
                  (sum: number, m: any) => sum + m.attendanceRate,
                  0
                ) / data.all.length
              : 0,
          totalDays,
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchStats()

    return () => {
      isMounted = false
    }
  }, [refreshKey])

  if (loading && !stats) {
    return (
      <div className="bg-gray-dark rounded-xl p-4 sm:p-6 border border-gray-medium">
        <div className="animate-pulse space-y-4">
          <div className="h-6 sm:h-8 bg-gray-medium rounded w-1/2"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-24 sm:h-32 bg-gray-medium rounded-lg"></div>
            <div className="h-24 sm:h-32 bg-gray-medium rounded-lg"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-dark rounded-lg p-2 sm:p-3 md:p-4 border border-gray-medium shadow-lg h-full flex flex-col">
      <h2 className="text-base sm:text-lg md:text-xl font-bold mb-2 text-white">
        Attendance Overview
      </h2>
      <div className="grid grid-cols-2 gap-1.5 sm:gap-2 flex-1 min-h-0">
        <div className="bg-gray-medium rounded-lg p-2 sm:p-3 border border-red-dark/30 hover:border-red-primary/50 transition-all duration-300 flex flex-col justify-between min-h-0">
          <div className="flex items-center justify-between gap-2">
            <div className="p-1 bg-red-primary/20 rounded">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-red-primary" />
            </div>
            <h3 className="text-xs sm:text-sm font-semibold text-gray-200 flex-1 min-w-0 truncate">Total Members</h3>
            <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-white whitespace-nowrap leading-tight">{stats?.totalMembers || 0}</span>
          </div>
        </div>

        <div className="bg-gray-medium rounded-lg p-2 sm:p-3 border border-red-dark/30 hover:border-red-primary/50 transition-all duration-300 flex flex-col justify-between min-h-0">
          <div className="flex items-center justify-between gap-2">
            <div className="p-1 bg-red-primary/20 rounded">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-red-primary" />
            </div>
            <h3 className="text-xs sm:text-sm font-semibold text-gray-200 flex-1 min-w-0 truncate">Avg. Attendance</h3>
            <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-white whitespace-nowrap leading-tight">{stats?.attendanceRate.toFixed(1) || '0.0'}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}
