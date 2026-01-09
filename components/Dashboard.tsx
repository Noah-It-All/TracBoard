'use client'

import { useEffect, useState } from 'react'
import AttendanceStats from './AttendanceStats'
import Leaderboard from './Leaderboard'
import PartsDisplay from './PartsDisplay'
import TodoDisplay from './TodoDisplay'

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

  // Ensure layout returns to normal when user exits fullscreen (e.g., ESC)
  useEffect(() => {
    const handleFsChange = () => {
      const isFs = !!document.fullscreenElement
      setBoardMode(isFs)
    }
    const doc = document as Document & { webkitOnfullscreenchange?: ((this: Document, ev: Event) => any) | null }
    doc.onfullscreenchange = handleFsChange as any
    // Some browsers may use webkit-prefixed handler
    doc.webkitOnfullscreenchange = handleFsChange as any
    return () => {
      doc.onfullscreenchange = null
      if ('webkitOnfullscreenchange' in doc) {
        doc.webkitOnfullscreenchange = null
      }
    }
  }, [])

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
      <div className="flex-none">
        {/* Header */}
        <div className={boardMode ? "mb-2" : "mb-2 flex flex-col gap-2"}>
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
            <div className="flex items-end justify-between">
              <div>
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight">
                  {title}
                </h1>
                <div className="h-2 w-28 sm:w-32 bg-red-primary mt-2"></div>
              </div>
              <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-gray-300 font-bold tracking-tight">
                {formattedNow}
              </div>
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
                href="/todo"
                className="px-3 py-1.5 bg-gray-medium hover:bg-gray-light text-white text-sm font-semibold rounded transition-colors"
              >
                Weekly Goals
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

      {/* Main content area with flex layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1.5fr_1fr_2.5fr] gap-2 min-h-0">
        {/* Left column - Attendance tiles stacked (4 tiles) */}
        <div className="grid grid-cols-1 sm:grid-cols-4 lg:grid-cols-1 gap-2 min-h-0 overflow-hidden">
          <Leaderboard
            title="Attendance Overview"
            type="overview"
            refreshKey={refreshKey}
          />
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

        {/* Todo Display - Middle section, now full height */}
        <div className="min-h-0 overflow-hidden">
          <TodoDisplay refreshKey={refreshKey} />
        </div>

        {/* Parts Display - Right section, now full height */}
        <div className="min-h-0 overflow-hidden">
          <PartsDisplay refreshKey={refreshKey} />
        </div>
      </div>
    </div>
  )
}
