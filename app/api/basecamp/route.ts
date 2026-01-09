import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const revalidate = 0

// Store Basecamp config (account ID, project, board)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { accountId, projectId, messageBoardId } = body
    
    // Store config
    if (accountId) {
      await db.config.upsert({
        where: { key: 'basecamp_account_id' },
        update: { value: accountId },
        create: { key: 'basecamp_account_id', value: accountId }
      })
    }
    
    if (projectId) {
      await db.config.upsert({
        where: { key: 'basecamp_project_id' },
        update: { value: projectId },
        create: { key: 'basecamp_project_id', value: projectId }
      })
    }
    
    if (messageBoardId) {
      await db.config.upsert({
        where: { key: 'basecamp_message_board_id' },
        update: { value: messageBoardId },
        create: { key: 'basecamp_message_board_id', value: messageBoardId }
      })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('POST /api/basecamp error:', error)
    return NextResponse.json(
      { error: 'Failed to save Basecamp config' },
      { status: 500 }
    )
  }
}

// Disconnect Basecamp
export async function DELETE() {
  try {
    await db.config.delete({ where: { key: 'basecamp_access_token' } }).catch(() => {})
    await db.config.delete({ where: { key: 'basecamp_refresh_token' } }).catch(() => {})
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/basecamp error:', error)
    return NextResponse.json(
      { error: 'Failed to disconnect Basecamp' },
      { status: 500 }
    )
  }
}

// Get Basecamp config
export async function GET() {
  try {
    const configs = await db.config.findMany()
    const configMap: Record<string, string> = {}
    configs.forEach(c => {
      configMap[c.key] = c.value
    })
    
    return NextResponse.json({
      hasAccessToken: !!configMap.basecamp_access_token,
      accountId: configMap.basecamp_account_id,
      projectId: configMap.basecamp_project_id,
      messageBoardId: configMap.basecamp_message_board_id
    })
  } catch (error) {
    console.error('GET /api/basecamp error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Basecamp config' },
      { status: 500 }
    )
  }
}
