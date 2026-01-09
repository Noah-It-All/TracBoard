import { NextRequest, NextResponse } from 'next/server'
import { parseWeeklyGoals } from '@/lib/gemini'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const revalidate = 0

// POST /api/goals/parse - Parse goals from text using Gemini
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content } = body
    
    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'content (string) is required' },
        { status: 400 }
      )
    }
    
    const result = await parseWeeklyGoals(content)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('POST /api/goals/parse error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to parse goals' },
      { status: 500 }
    )
  }
}
