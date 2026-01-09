import { NextRequest, NextResponse } from 'next/server'
import { getBasecampMessages, getBasecampMessage } from '@/lib/basecamp'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const revalidate = 0

// Get Basecamp messages or a specific message
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const messageBoardId = searchParams.get('messageBoardId')
    const messageId = searchParams.get('messageId')
    
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
    
    // Get specific message
    if (messageId && projectId) {
      const message = await getBasecampMessage(accessToken, accountId, projectId, messageId)
      return NextResponse.json(message)
    }
    
    // Get messages list
    if (projectId && messageBoardId) {
      const messages = await getBasecampMessages(accessToken, accountId, projectId, messageBoardId)
      return NextResponse.json(messages)
    }
    
    return NextResponse.json(
      { error: 'projectId and messageBoardId (or messageId) are required' },
      { status: 400 }
    )
  } catch (error) {
    console.error('GET /api/basecamp/messages error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}
