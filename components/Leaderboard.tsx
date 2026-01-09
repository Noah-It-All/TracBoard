'use client'

import { useEffect, useState } from 'react'
import { Trophy, Medal, Award } from 'lucide-react'

interface LeaderboardItem {
  id: string
  name: string
  totalDays: number
  daysPresent: number
  attendanceRate: number
  currentStreak: number
}

interface LeaderboardProps {
  title: string
  type: 'streak' | 'days' | 'rate' | 'teamrate'
  refreshKey: number
}

export default function Leaderboard({ title, type, refreshKey }: LeaderboardProps) {
  const [data, setData] = useState<LeaderboardItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function fetchLeaderboard() {
      try {
        const response = await fetch('/api/attendance/stats', {
          cache: 'no-store',
        })
        const result = await response.json()

        if (!isMounted) return

        let sorted: LeaderboardItem[] = []
        if (type === 'streak') {
          sorted = result.byStreak || []
        } else if (type === 'days') {
          sorted = result.byDaysPresent || []
        } else if (type === 'teamrate') {
          sorted = result.byTeamRate || []
        } else {
          sorted = result.byAttendanceRate || []
        }

        setData(sorted.slice(0, 5)) // Top 5
      } catch (error) {
        console.error('Error fetching leaderboard:', error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchLeaderboard()

    return () => {
      isMounted = false
    }
  }, [type, refreshKey])

  const getIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-4 h-4 text-red-primary" />
    if (index === 1) return <Medal className="w-4 h-4 text-red-secondary" />
    if (index === 2) return <Award className="w-4 h-4 text-red-light" />
    return <span className="w-4 h-4 flex items-center justify-center text-gray-400 font-semibold text-xs">{index + 1}</span>
  }

  const getValue = (item: LeaderboardItem) => {
    if (type === 'streak') return `${item.currentStreak} days`
    if (type === 'days') return `${item.daysPresent} days`
    if (type === 'teamrate') return `${item.attendanceRate.toFixed(1)}%`
    return `${item.attendanceRate.toFixed(1)}%`
  }

  if (loading) {
    return (
      <div className="bg-gray-dark rounded-xl p-4 sm:p-6 border border-gray-medium">
        <div className="animate-pulse space-y-3">
          <div className="h-5 sm:h-6 bg-gray-medium rounded w-1/2"></div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 sm:h-16 bg-gray-medium rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-dark rounded-lg p-2 sm:p-2.5 md:p-3 border border-gray-medium shadow-lg h-full flex flex-col overflow-hidden">
      <h2 className="text-base sm:text-lg font-bold mb-2 text-white flex-none">
        {title}
      </h2>
      <div className="space-y-1 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-medium scrollbar-track-transparent">
        {data.length === 0 ? (
          <p className="text-gray-400 text-center py-4 text-xs sm:text-sm">No data</p>
        ) : (
          data.map((item, index) => (
            <div
              key={item.id}
              className="flex items-center gap-2 bg-gray-medium rounded p-1.5 sm:p-2 border border-gray-light/30 hover:border-red-primary/30 transition-all duration-300"
            >
              {getIcon(index)}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-xs sm:text-sm truncate">{item.name}</p>
                <p className="text-[10px] sm:text-xs text-gray-400">{getValue(item)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
