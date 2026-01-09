'use client'

import { useEffect, useState, useRef } from 'react'
import { Check, ChevronRight } from 'lucide-react'

interface Goal {
  id: string
  title: string
  description?: string | null
  isCompleted: boolean
  order: number
}

interface TodoDisplayProps {
  refreshKey?: number
}

function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

export default function TodoDisplay({ refreshKey = 0 }: TodoDisplayProps) {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [visibleGoalsCount, setVisibleGoalsCount] = useState(6)
  const [itemHeight, setItemHeight] = useState<number | null>(null)
  const goalsListRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let isMounted = true

    async function fetchGoals() {
      try {
        const weekStart = getMonday(new Date())
        const weekStr = formatDate(weekStart)
        const response = await fetch(`/api/goals?week=${weekStr}`, {
          cache: 'no-store',
        })

        if (!isMounted) return

        if (!response.ok) {
          throw new Error('Failed to fetch goals')
        }

        const data = await response.json()
        setGoals(data.goals || [])
        setError(false)
      } catch (err) {
        console.error('Error fetching goals:', err)
        if (isMounted) {
          setError(true)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchGoals()

    return () => {
      isMounted = false
    }
  }, [refreshKey])

  // Dynamically calculate how many goals fit in the available space
  useEffect(() => {
    const updateVisibleCount = () => {
      if (!goalsListRef.current || goals.length === 0) return
      
      // Measure the actual container that will hold the goals list
      const parentContainer = goalsListRef.current.parentElement
      if (!parentContainer) return
      
      const availableHeight = parentContainer.clientHeight
      if (!availableHeight || availableHeight < 10) return

      const goalHeight = itemHeight ?? 50
      const gap = 8 // space-y-2
      const moreLinkHeight = 42 // pt-2 (8px) + mt-2 (8px) + border (1px) + text (~20px) + buffer
      
      // Calculate how many goals can fit without the "more" link
      // Formula: N items need N*height + (N-1)*gap space
      // So: N*height + (N-1)*gap <= availableHeight
      // N*(height+gap) <= availableHeight + gap
      const maxWithoutLink = Math.floor((availableHeight + gap) / (goalHeight + gap))
      
      if (goals.length <= maxWithoutLink) {
        // All goals fit without needing "more" link
        setVisibleGoalsCount(goals.length)
      } else {
        // Need "more" link, so reduce available space
        const heightForGoals = availableHeight - moreLinkHeight
        const canFit = Math.max(1, Math.floor((heightForGoals + gap) / (goalHeight + gap)))
        // Be conservative: subtract 1 to ensure no overflow
        const safeCount = Math.max(1, canFit - 1)
        setVisibleGoalsCount(Math.min(safeCount, goals.length))
      }
    }

    // Delay to ensure layout is complete
    const timer = setTimeout(updateVisibleCount, 100)

    const resizeObserver = new ResizeObserver(() => {
      setTimeout(updateVisibleCount, 50)
    })
    
    if (goalsListRef.current?.parentElement) {
      resizeObserver.observe(goalsListRef.current.parentElement)
    }

    return () => {
      clearTimeout(timer)
      resizeObserver.disconnect()
    }
  }, [goals.length, itemHeight])

  const completedCount = goals.filter(g => g.isCompleted).length
  const totalCount = goals.length
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  if (loading && goals.length === 0) {
    return (
      <div className="bg-gray-dark rounded-lg p-2 sm:p-3 md:p-4 border border-gray-medium shadow-lg h-full flex flex-col">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-gray-medium rounded w-1/2"></div>
          <div className="h-2 bg-gray-medium rounded w-full"></div>
          <div className="space-y-2">
            <div className="h-12 bg-gray-medium rounded"></div>
            <div className="h-12 bg-gray-medium rounded"></div>
            <div className="h-12 bg-gray-medium rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-gray-dark rounded-lg p-2 sm:p-3 md:p-4 border border-gray-medium shadow-lg h-full flex flex-col">
        <h2 className="text-base sm:text-lg md:text-xl font-bold mb-2 text-white">
          Weekly Goals
        </h2>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-gray-400">Failed to load goals</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-dark rounded-lg p-2 sm:p-3 md:p-4 border border-gray-medium shadow-lg h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base sm:text-lg md:text-xl font-bold text-white">
          Weekly Goals
        </h2>
        <a
          href="/todo"
          className="text-red-primary hover:text-red-light transition-colors flex items-center gap-1 text-sm"
        >
          Manage <ChevronRight className="w-4 h-4" />
        </a>
      </div>

      {totalCount === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
          <p className="text-sm text-gray-400 mb-3">No goals set for this week</p>
          <a
            href="/todo"
            className="px-3 py-1.5 bg-red-primary hover:bg-red-dark text-white text-sm font-semibold rounded transition-colors"
          >
            Set Goals
          </a>
        </div>
      ) : (
        <>
          {/* Progress bar */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-300">Progress</span>
              <span className="text-xs text-gray-300 font-semibold">{completedCount}/{totalCount}</span>
            </div>
            <div className="w-full bg-gray-medium rounded-full h-2 overflow-hidden">
              <div
                className="bg-red-primary h-full transition-all duration-300 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Goals list - flex column with goals filling space and "more" at bottom */}
          <div className="flex flex-col min-h-0 flex-1">
            <div className="space-y-2 min-h-0" ref={goalsListRef}>
              {goals.slice(0, visibleGoalsCount).map((goal, idx) => (
                <div
                  key={goal.id}
                  ref={idx === 0 ? (node => {
                    if (node) {
                      const h = node.getBoundingClientRect().height
                      if (h > 0) setItemHeight(h)
                    }
                  }) : undefined}
                  className={`p-2 rounded border transition-all ${
                    goal.isCompleted
                      ? 'bg-gray-medium/50 border-green-500/30'
                      : 'bg-gray-medium border-gray-light/30'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div
                      className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 ${
                        goal.isCompleted
                          ? 'bg-green-600 border-green-600'
                          : 'border-gray-light'
                      }`}
                    >
                      {goal.isCompleted && <Check className="w-3 h-3 text-white" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div
                        className={`text-sm font-medium leading-tight ${
                          goal.isCompleted ? 'line-through text-gray-400' : 'text-white'
                        }`}
                      >
                        {goal.title}
                      </div>
                      {goal.description && !goal.isCompleted && (
                        <div className="text-xs text-gray-400 mt-1 line-clamp-1">
                          {goal.description}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {goals.length > visibleGoalsCount && (
              <div className="text-center pt-2 border-t border-gray-medium mt-2 flex-shrink-0">
                <a
                  href="/todo"
                  className="text-xs text-red-primary hover:text-red-light transition-colors"
                >
                  +{goals.length - visibleGoalsCount} more goals
                </a>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
