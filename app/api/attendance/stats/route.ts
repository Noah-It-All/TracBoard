import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { calculateStreak } from '@/lib/utils'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const revalidate = 0
export const prerender = false

export async function GET() {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const members = await db.teamMemberWithRecords.findMany()

    const stats = members.map((member) => {
      const records = member.attendanceRecords.map((r) => ({
        date: r.date,
        isPresent: r.isPresent,
      }))

      const presentCount = records.filter((r) => r.isPresent).length
      const totalCount = records.length
      const streak = calculateStreak(records)

      // Check if present today
      const todayRecord = records.find((r) => {
        const recordDate = new Date(r.date)
        recordDate.setHours(0, 0, 0, 0)
        return recordDate.getTime() === today.getTime()
      })

      return {
        id: member.id,
        name: member.name,
        totalDays: totalCount,
        daysPresent: presentCount,
        attendanceRate: totalCount > 0 ? (presentCount / totalCount) * 100 : 0,
        currentStreak: streak,
        presentToday: todayRecord?.isPresent ?? false,
      }
    })

    // Sort by different metrics
    const byStreak = [...stats].sort((a, b) => b.currentStreak - a.currentStreak)
    const byDaysPresent = [...stats].sort((a, b) => b.daysPresent - a.daysPresent)
    const byAttendanceRate = [...stats].sort(
      (a, b) => b.attendanceRate - a.attendanceRate
    )

    // Calculate team/subteam attendance rates
    const teams = await db.team.findMany({
      include: {
        members: {
          include: {
            attendanceRecords: true
          }
        }
      }
    })

    const teamStats = teams.map((team: any) => {
      // Calculate attendance rate for each team member
      const memberRates = team.members.map((member: any) => {
        const presentCount = member.attendanceRecords.filter((r: any) => r.isPresent).length
        const totalCount = member.attendanceRecords.length
        return totalCount > 0 ? (presentCount / totalCount) * 100 : 0
      })

      // Average the attendance rates
      const avgRate = memberRates.length > 0
        ? memberRates.reduce((sum: number, rate: number) => sum + rate, 0) / memberRates.length
        : 0

      return {
        id: team.id,
        name: team.name,
        attendanceRate: avgRate,
        memberCount: team.members.length,
        totalDays: 0, // Not used for teams
        daysPresent: 0, // Not used for teams
        currentStreak: 0 // Not used for teams
      }
    }).sort((a, b) => b.attendanceRate - a.attendanceRate)

    return NextResponse.json({
      all: stats,
      byStreak: byStreak.slice(0, 10),
      byDaysPresent: byDaysPresent.slice(0, 10),
      byAttendanceRate: byAttendanceRate.slice(0, 10),
      byTeamRate: teamStats.slice(0, 10),
    })
  } catch (error) {
    console.error('Error fetching attendance stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
