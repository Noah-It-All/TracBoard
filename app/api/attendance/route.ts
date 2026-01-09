import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

function parseDateOnly(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
}

function formatDateOnly(date: Date) {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date') // YYYY-MM-DD
    const memberId = searchParams.get('memberId')
    const start = searchParams.get('start')
    const end = searchParams.get('end')

    const where: any = {}

    if (memberId) {
      where.teamMemberId = memberId
    }

    if (date) {
      const dayStart = parseDateOnly(date)
      const dayEnd = new Date(dayStart)
      dayEnd.setUTCDate(dayEnd.getUTCDate() + 1)
      where.date = { gte: dayStart, lt: dayEnd }
    } else if (start || end) {
      const range: any = {}
      if (start) range.gte = parseDateOnly(start)
      if (end) {
        const endDate = parseDateOnly(end)
        endDate.setUTCDate(endDate.getUTCDate() + 1)
        range.lt = endDate
      }
      where.date = range
    }

    const records = await db.attendanceRecord.findMany({
      where,
      orderBy: { date: 'desc' },
      take: date || start || end ? undefined : 200,
    })

    const payload = records.map((r) => ({
      ...r,
      date: formatDateOnly(new Date(r.date)), // normalize to YYYY-MM-DD to avoid TZ drift
    }))

    return NextResponse.json(payload)
  } catch (error) {
    console.error('Error fetching attendance records:', error)
    return NextResponse.json(
      { error: 'Failed to fetch records' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { teamMemberId, date, isPresent } = body as {
      teamMemberId?: string
      date?: string
      isPresent?: boolean
    }

    if (!teamMemberId || !date || isPresent === undefined) {
      return NextResponse.json(
        { error: 'teamMemberId, date, and isPresent are required' },
        { status: 400 }
      )
    }

    // Parse date as YYYY-MM-DD and create a UTC midnight timestamp to avoid timezone drift
    const dateTime = parseDateOnly(date)

    console.log(`Adding attendance: member=${teamMemberId}, dateInput=${date}, dateTime=${dateTime.toISOString()}`)

    // Use upsert to handle duplicate records (update if exists, create if not)
    const record = await db.attendanceRecord.upsert({
      where: {
        teamMemberId_date: {
          teamMemberId,
          date: dateTime,
        },
      },
      update: {
        isPresent,
      },
      create: {
        teamMemberId,
        date: dateTime,
        isPresent,
      },
    })

    return NextResponse.json({
      ...record,
      date: formatDateOnly(new Date(record.date)),
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating attendance record:', error)
    return NextResponse.json(
      { error: 'Failed to create attendance record' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const teamMemberId = searchParams.get('teamMemberId')
    const date = searchParams.get('date') // YYYY-MM-DD

    if (!teamMemberId || !date) {
      return NextResponse.json(
        { error: 'teamMemberId and date are required' },
        { status: 400 }
      )
    }

    const dateTime = parseDateOnly(date)

    await db.attendanceRecord.delete({
      where: {
        teamMemberId_date: {
          teamMemberId,
          date: dateTime,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting attendance record:', error)
    return NextResponse.json(
      { error: 'Failed to delete attendance record' },
      { status: 500 }
    )
  }
}
