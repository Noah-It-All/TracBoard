import { NextResponse } from 'next/server'
import { fetchEquipment } from '@/lib/rhr-mfg'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const revalidate = 60 // Revalidate every minute
export const prerender = false

export async function GET() {
  try {
    const equipment = await fetchEquipment()
    return NextResponse.json(equipment)
  } catch (error) {
    console.error('Error fetching equipment:', error)
    return NextResponse.json(
      { error: 'Failed to fetch equipment' },
      { status: 500 }
    )
  }
}
