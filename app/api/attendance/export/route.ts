import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const revalidate = 0
export const prerender = false

function toCsv(records: Array<{ date: Date; isPresent: boolean; teamMemberId: string }>, membersById: Map<string, { name: string }>) {
  const header = 'date,member_id,member_name,is_present\n'
  const rows = records.map(r => {
    const name = membersById.get(r.teamMemberId)?.name || ''
    const dateStr = new Date(r.date).toISOString()
    return `${dateStr},${r.teamMemberId},${name},${r.isPresent ? '1' : '0'}`
  })
  return header + rows.join('\n')
}

export async function GET() {
  try {
    const records = await db.attendanceRecord.findMany({ orderBy: { date: 'asc' } })
    const members = await db.teamMember.findMany()
    const membersById = new Map(members.map(m => [m.id, { name: m.name }]))
    const csv = toCsv(records.map(r => ({ date: r.date, isPresent: r.isPresent, teamMemberId: r.teamMemberId })), membersById)
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="attendance_export_${Date.now()}.csv"`,
      },
    })
  } catch (error) {
    console.error('Export GET error:', error)
    return NextResponse.json({ error: 'Failed to export attendance' }, { status: 500 })
  }
}