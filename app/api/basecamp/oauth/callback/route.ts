import { NextRequest, NextResponse } from 'next/server'
import { exchangeBasecampCode } from '@/lib/basecamp'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const revalidate = 0

// OAuth callback handler
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    const origin = new URL(request.url).origin
    
    if (error) {
      return NextResponse.redirect(`${origin}/todo?error=${error}`)
    }
    
    if (!code) {
      return NextResponse.redirect(`${origin}/todo?error=no_code`)
    }
    
    const clientId = process.env.BASECAMP_CLIENT_ID
    const clientSecret = process.env.BASECAMP_CLIENT_SECRET
    const redirectUri = `${origin}/api/basecamp/oauth/callback`
    
    if (!clientId || !clientSecret) {
      return NextResponse.redirect(`${origin}/todo?error=missing_config`)
    }
    
    // Exchange code for tokens
    const tokens = await exchangeBasecampCode(code, clientId, clientSecret, redirectUri)
    
    // Store tokens
    await db.config.upsert({
      where: { key: 'basecamp_access_token' },
      update: { value: tokens.access_token },
      create: { key: 'basecamp_access_token', value: tokens.access_token }
    })
    
    await db.config.upsert({
      where: { key: 'basecamp_refresh_token' },
      update: { value: tokens.refresh_token },
      create: { key: 'basecamp_refresh_token', value: tokens.refresh_token }
    })
    
    // Redirect back to todo page
    return NextResponse.redirect(`${origin}/todo?success=true`)
  } catch (error) {
    console.error('OAuth callback error:', error)
    const origin = new URL(request.url).origin
    return NextResponse.redirect(`${origin}/todo?error=oauth_failed`)
  }
}
