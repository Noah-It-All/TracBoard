import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function calculateStreak(records: { date: Date; isPresent: boolean }[]): number {
  if (records.length === 0) return 0
  
  // Sort by date descending
  const sorted = [...records].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )
  
  let streak = 0
  let currentDate = new Date()
  currentDate.setHours(0, 0, 0, 0)
  
  for (const record of sorted) {
    const recordDate = new Date(record.date)
    recordDate.setHours(0, 0, 0, 0)
    
    const daysDiff = Math.floor(
      (currentDate.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24)
    )
    
    if (daysDiff === streak && record.isPresent) {
      streak++
    } else if (daysDiff === streak + 1 && !record.isPresent) {
      // Gap in attendance, streak ends
      break
    } else if (daysDiff > streak + 1) {
      // Too many days gap
      break
    }
  }
  
  return streak
}
