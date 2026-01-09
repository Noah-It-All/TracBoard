'use client'

import { useEffect, useState } from 'react'
import AttendanceStats from './AttendanceStats'
import Leaderboard from './Leaderboard'
import PartsDisplay from './PartsDisplay'

export default function Dashboard() {
  const [refreshKey, setRefreshKey] = useState(0)
  const [title, setTitle] = useState('TracBoard')
  const [now, setNow] = useState(new Date())
  const [boardMode, setBoardMode] = useState(false)

  useEffect(() => {
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      setRefreshKey((prev) => prev + 1)
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const clock = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(clock)
  }, [])

  useEffect(() => {
    if (boardMode) {
      document.documentElement.requestFullscreen?.().catch(() => {})
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {})
      }
    }
  }, [boardMode])

  useEffect(() => {
    let active = true
    async function fetchTitle() {
      try {
        const res = await fetch('/api/management/config?key=team_name', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          if (active && data?.value) setTitle(data.value)
        }
      } catch {}
    }
    fetchTitle()
    return () => { active = false }
  }, [])

  const formattedNow = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(now)

  return (
    <div className="h-screen bg-black text-white overflow-hidden flex flex-col p-2 sm:p-3 md:p-4 lg:p-6">
      <div className={boardMode ? "flex-1 flex items-center justify-center" : "flex-none"}>
        {/* Header */}
        <div className={boardMode ? "w-full text-center" : "mb-2 flex flex-col gap-2"}>
          {!boardMode && (
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight">
                  {title}
                </h1>
                <div className="h-1.5 w-24 sm:w-28 bg-red-primary mt-1"></div>
              </div>
              <div className="text-sm sm:text-base md:text-lg text-gray-300 font-semibold tracking-tight">
                {formattedNow}
              </div>
            </div>
          )}
          {boardMode && (
            <div className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl text-gray-300 font-bold tracking-tight">
              {formattedNow}
            </div>
          )}
          {!boardMode && (
            <div className="flex flex-wrap gap-2">
              <a
                href="/"
                className="px-3 py-1.5 bg-gray-medium hover:bg-gray-light text-white text-sm font-semibold rounded transition-colors"
              >
                Home
              </a>
              <a
                href="/upload"
                className="px-3 py-1.5 bg-gray-medium hover:bg-gray-light text-white text-sm font-semibold rounded transition-colors"
              >
                Attendance Upload
              </a>
              <a
                href="/management"
                className="px-3 py-1.5 bg-gray-medium hover:bg-gray-light text-white text-sm font-semibold rounded transition-colors"
              >
                Management
              </a>
              <button
                onClick={() => setBoardMode(true)}
                className="px-3 py-1.5 bg-gray-medium hover:bg-gray-light text-white text-sm font-semibold rounded transition-colors"
              >
                Big Screen
              </button>
            </div>
          )}
        </div>
      </div>
      {boardMode && (
        <div className="absolute top-4 right-4">
          <button
            onClick={() => setBoardMode(false)}
            className="text-white text-3xl hover:text-red-primary transition-colors font-bold leading-none"
            title="Exit Big Screen"
          >
            ×
          </button>
        </div>
      )}

      {!boardMode && (
        /* Main content area with flex layout */
        <div className="flex-1 grid grid-rows-[auto_1fr] gap-2 min-h-0">
        {/* Attendance Stats - Fixed height */}
        <div className="h-[15vh] min-h-[120px] max-h-[180px]">
          <AttendanceStats refreshKey={refreshKey} />
        </div>

        {/* Bottom section - 2 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-2 min-h-0">
          {/* Leaderboards - 3 columns in left section */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-2 min-h-0 overflow-hidden">
            <Leaderboard
              title="Longest Streaks"
              type="streak"
              refreshKey={refreshKey}
            />
            <Leaderboard
              title="Most Days"
              type="days"
              refreshKey={refreshKey}
            />
            <Leaderboard
              title="Best Attendance"
              type="teamrate"
              refreshKey={refreshKey}
            />
          </div>

          {/* Parts Display - Right section */}
          <div className="min-h-0 overflow-hidden">
            <PartsDisplay refreshKey={refreshKey} />
          </div>
        </div>
      </div>
      )}
    </div>
  )
}
