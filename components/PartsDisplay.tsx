'use client'

import { useEffect, useState } from 'react'
import { Package } from 'lucide-react'

interface Part {
  id: string
  name: string
  thumbnail?: string
  state?: string
}

interface PartsDisplayProps {
  refreshKey: number
}

export default function PartsDisplay({ refreshKey }: PartsDisplayProps) {
  const [parts, setParts] = useState<Part[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function fetchParts() {
      try {
        const response = await fetch('/api/parts', {
          cache: 'no-store',
        })
        const data = await response.json()
        
        if (!isMounted) return
        setParts(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('Error fetching parts:', error)
        if (isMounted) {
          setParts([])
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchParts()

    return () => {
      isMounted = false
    }
  }, [refreshKey])

  if (loading) {
    return (
      <div className="bg-gray-dark rounded-xl p-4 sm:p-6 border border-gray-medium">
        <div className="animate-pulse space-y-4">
          <div className="h-6 sm:h-8 bg-gray-medium rounded w-1/3"></div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-24 sm:h-32 bg-gray-medium rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-dark rounded-lg p-2 sm:p-2.5 md:p-3 border border-gray-medium shadow-lg h-full flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 mb-2 flex-none">
        <div className="p-1 bg-red-primary/20 rounded">
          <Package className="w-4 h-4 sm:w-5 sm:h-5 text-red-primary" />
        </div>
        <h2 className="text-base sm:text-lg font-bold text-white">
          Parts & Equipment
        </h2>
      </div>
      {parts.length === 0 ? (
        <p className="text-gray-400 text-center py-6 text-xs sm:text-sm">
          No parts data available.
        </p>
      ) : (
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-medium scrollbar-track-transparent">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-1.5 sm:gap-2">
            {parts.slice(0, 24).map((part) => (
              <div
                key={part.id}
                className="bg-gray-medium rounded p-1.5 border border-gray-light/30 hover:border-red-primary/50 transition-all duration-300"
              >
                {part.thumbnail ? (
                  <img
                    src={part.thumbnail}
                    alt={part.name}
                    className="w-full aspect-square object-cover rounded mb-1"
                  />
                ) : (
                  <div className="w-full aspect-square bg-gray-light rounded mb-1 flex items-center justify-center">
                    <Package className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                  </div>
                )}
                <p className="text-[10px] sm:text-xs font-semibold truncate text-white">{part.name}</p>
                {part.state && (
                  <p className="text-[9px] sm:text-[10px] text-gray-400 truncate">{part.state}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
