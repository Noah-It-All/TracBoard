import { NextResponse } from 'next/server'
import { fetchParts } from '@/lib/rhr-mfg'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const revalidate = 60 // Revalidate every minute
export const prerender = false

export async function GET() {
  try {
    const parts = await fetchParts()
    return NextResponse.json(parts)
  } catch (error) {
    console.error('Error fetching parts:', error)
    return NextResponse.json({ error: 'Failed to fetch parts' }, { status: 500 })
  }
}
