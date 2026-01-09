# Basecamp Integration Setup Guide

## Prerequisites

1. A Basecamp 3 account
2. Admin access to create OAuth applications in Basecamp

## Step 1: Register OAuth Application in Basecamp

1. Go to [Basecamp Integrations](https://launchpad.37signals.com/integrations)
2. Click "Register one now" to create a new integration
3. Fill in the following information:
   - **Name of your application**: TracBoard
   - **Company name**: Your team/company name
   - **Your website**: Your website URL
   - **Products this integration works with**: Select "Basecamp 3"
   - **Redirect URI**: `http://localhost:3000/api/basecamp/oauth/callback` (for development)
     - For production, use: `https://yourdomain.com/api/basecamp/oauth/callback`

4. After creating, you'll receive:
   - **Client ID**
   - **Client Secret**

## Step 2: Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Add your Basecamp credentials to `.env.local`:
   ```env
   BASECAMP_CLIENT_ID="your-client-id-here"
   BASECAMP_CLIENT_SECRET="your-client-secret-here"
   NEXT_PUBLIC_BASECAMP_CLIENT_ID="your-client-id-here"
   NEXT_PUBLIC_BASE_URL="http://localhost:3000"
   ```

3. For production, update `NEXT_PUBLIC_BASE_URL` to your domain

## Step 3: Find Your Basecamp Account ID

1. Log in to your Basecamp account
2. Look at the URL in your browser: `https://3.basecamp.com/1234567/projects`
3. The number after `basecamp.com/` is your Account ID (e.g., `1234567`)
4. You'll need to enter this when connecting to Basecamp in the app

## Step 4: Using the Integration

1. Navigate to the `/todo` page in TracBoard
2. Click "Import from Basecamp"
3. Click "Connect to Basecamp" - this will redirect you to Basecamp for authorization
4. Authorize the application
5. After redirect, enter your Basecamp Account ID
6. Select the project containing your weekly goals
7. Select the message/post with your weekly goals
8. Click "Import Selected Post"
9. Gemini AI will parse the content and create structured goals

## Troubleshooting

### "Basecamp Client ID is not configured"
- Make sure you've added `NEXT_PUBLIC_BASECAMP_CLIENT_ID` to your `.env.local` file
- Restart your development server after adding environment variables

### "Failed to fetch projects"
- Verify your Account ID is correct
- Check that your access token hasn't expired

### "Basecamp authentication failed"
- Verify your Client ID and Secret are correct
- Make sure the Redirect URI in Basecamp matches your configured URL exactly
- Check browser console for detailed error messages

### Disconnect and Reconnect
If you need to reset the connection:
1. Click "Disconnect" in the Basecamp import section
2. This will remove stored tokens
3. Click "Connect to Basecamp" again to re-authenticate

## Security Notes

- Tokens are stored securely in your database (Config table)
- Never commit `.env.local` to version control
- Use environment-specific URLs for OAuth callbacks
- Access tokens are scoped to read-only access for Basecamp data
