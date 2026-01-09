import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const revalidate = 0
export const prerender = false

export async function GET() {
  try {
    const members = await db.teamMember.findMany()
    return NextResponse.json(members)
  } catch (error) {
    console.error('Members GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, teamId } = body as { name?: string; email?: string; teamId?: string }
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Member name is required' }, { status: 400 })
    }
    const member = await db.teamMember.create({ data: { name: name.trim(), email } })
    if (teamId) {
      await db.teamMember.update({ where: { id: member.id }, data: { teamId } })
    }
    const updated = teamId ? await db.teamMember.findFirst({ where: { name: { equals: name.trim(), mode: 'insensitive' } } }) : member
    return NextResponse.json(updated, { status: 201 })
  } catch (error) {
    console.error('Members POST error:', error)
    return NextResponse.json({ error: 'Failed to create member' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { memberId, name, teamId } = body as { memberId?: string; name?: string; teamId?: string | null }
    
    if (!memberId) {
      return NextResponse.json({ error: 'memberId is required' }, { status: 400 })
    }
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Member name is required' }, { status: 400 })
    }

    const updated = await db.teamMember.update({
      where: { id: memberId },
      data: { 
        name: name.trim(),
        teamId: teamId === null ? null : teamId
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Members PUT error:', error)
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    await db.teamMember.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Members DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete member' }, { status: 500 })
  }
}