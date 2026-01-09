import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const revalidate = 0
export const prerender = false

function toCsv(records: Array<{ date: Date; isPresent: boolean; teamMemberId: string }>, membersById: Map<string, { name: string }>) {
  const escapeField = (field: string) => {
    if (!field) return ''
    // Escape quotes and wrap in quotes if contains comma, quote, or newline
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"` 
    }
    return field
  }

  const header = 'date,member_id,member_name,is_present\n'
  const rows = records.map(r => {
    const name = escapeField(membersById.get(r.teamMemberId)?.name || 'Unknown')
    const dateStr = new Date(r.date).toISOString()
    return `${dateStr},${r.teamMemberId},${name},${r.isPresent ? '1' : '0'}`
  })
  return header + rows.join('\n')
}

export async function GET() {
  try {
    // Fetch all attendance records ordered by date
    const records = await db.attendanceRecord.findMany({ orderBy: { date: 'asc' } })
    
    // Fetch all team members
    const members = await db.teamMember.findMany()
    
    // Create a map for quick member lookup
    const membersById = new Map(members.map(m => [m.id, { name: m.name }]))
    
    // Convert records to CSV format
    const csv = toCsv(records.map(r => ({ date: r.date, isPresent: r.isPresent, teamMemberId: r.teamMemberId })), membersById)
    
    // Return CSV file
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="attendance_export_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error('Export GET error:', error)
    return NextResponse.json({ error: 'Failed to export attendance', details: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}