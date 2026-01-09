import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const revalidate = 0
export const prerender = false

// GET all configs or a specific config by key
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')

    if (key) {
      // Get single config by key
      const config = await db.config.findUnique({
        where: { key },
      })
      if (!config) {
        return NextResponse.json({ error: 'Config not found' }, { status: 404 })
      }
      return NextResponse.json(config)
    }

    // Get all configs
    const configs = await db.config.findMany({
      orderBy: { key: 'asc' },
    })
    return NextResponse.json(configs)
  } catch (error) {
    console.error('Error fetching config:', error)
    return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 })
  }
}

// PUT (upsert) a config
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { key, value } = body

    if (!key || typeof value !== 'string') {
      return NextResponse.json(
        { error: 'key and value are required' },
        { status: 400 }
      )
    }

    const config = await db.config.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    })

    return NextResponse.json(config)
  } catch (error) {
    console.error('Error upserting config:', error)
    return NextResponse.json({ error: 'Failed to update config' }, { status: 500 })
  }
}

// DELETE a config
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')

    if (!key) {
      return NextResponse.json({ error: 'key is required' }, { status: 400 })
    }

    await db.config.delete({
      where: { key },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting config:', error)
    return NextResponse.json({ error: 'Failed to delete config' }, { status: 500 })
  }
}
