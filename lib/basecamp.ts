// Basecamp API integration for fetching weekly goals posts

interface BasecampMessage {
  id: number
  title: string
  content: string
  created_at: string
  url: string
}

interface BasecampProject {
  id: number
  name: string
}

export async function getBasecampProjects(accessToken: string, accountId: string): Promise<BasecampProject[]> {
  const response = await fetch(`https://3.basecampapi.com/${accountId}/projects.json`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'User-Agent': 'TracBoard (contact@tracboard.app)',
    },
  })

  if (!response.ok) {
    throw new Error(`Basecamp API error: ${response.statusText}`)
  }

  return response.json()
}

export async function getBasecampMessages(
  accessToken: string,
  accountId: string,
  projectId: string,
  messageBoardId: string
): Promise<BasecampMessage[]> {
  const response = await fetch(
    `https://3.basecampapi.com/${accountId}/buckets/${projectId}/message_boards/${messageBoardId}/messages.json?status=active`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'TracBoard (contact@tracboard.app)',
      },
    }
  )

  if (!response.ok) {
    throw new Error(`Basecamp API error: ${response.statusText}`)
  }

  return response.json()
}

export async function getBasecampMessage(
  accessToken: string,
  accountId: string,
  projectId: string,
  messageId: string
): Promise<BasecampMessage> {
  const response = await fetch(
    `https://3.basecampapi.com/${accountId}/buckets/${projectId}/messages/${messageId}.json`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'TracBoard (contact@tracboard.app)',
      },
    }
  )

  if (!response.ok) {
    throw new Error(`Basecamp API error: ${response.statusText}`)
  }

  return response.json()
}

// OAuth helpers
export function getBasecampAuthUrl(clientId: string, redirectUri: string): string {
  const params = new URLSearchParams({
    type: 'web_server',
    client_id: clientId,
    redirect_uri: redirectUri,
  })
  return `https://launchpad.37signals.com/authorization/new?${params.toString()}`
}

export async function exchangeBasecampCode(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
  const response = await fetch('https://launchpad.37signals.com/authorization/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'web_server',
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code,
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to exchange code: ${response.statusText}`)
  }

  return response.json()
}
