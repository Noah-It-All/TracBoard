import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { memberId, teamId } = body as { memberId?: string; teamId?: string | null }
    if (!memberId) {
      return NextResponse.json({ error: 'memberId is required' }, { status: 400 })
    }
    const updated = await db.teamMember.update({ where: { id: memberId }, data: { teamId: teamId ?? null } })
    if (!updated) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Assign member POST error:', error)
    return NextResponse.json({ error: 'Failed to assign member' }, { status: 500 })
  }
}