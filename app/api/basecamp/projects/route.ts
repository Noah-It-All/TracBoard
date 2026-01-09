import { NextResponse } from 'next/server'
import { getBasecampProjects } from '@/lib/basecamp'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const revalidate = 0

// Get Basecamp projects
export async function GET() {
  try {
    const configs = await db.config.findMany()
    const configMap: Record<string, string> = {}
    configs.forEach(c => {
      configMap[c.key] = c.value
    })
    
    const accessToken = configMap.basecamp_access_token
    const accountId = configMap.basecamp_account_id
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Not authenticated with Basecamp' },
        { status: 401 }
      )
    }
    
    if (!accountId) {
      return NextResponse.json(
        { error: 'Basecamp account ID not configured' },
        { status: 400 }
      )
    }
    
    const projects = await getBasecampProjects(accessToken, accountId)
    
    return NextResponse.json(projects)
  } catch (error) {
    console.error('GET /api/basecamp/projects error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}
