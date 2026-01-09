import { GoogleGenerativeAI } from '@google/generative-ai'
import { db } from './db'

// Check for API key at runtime, not at module load time
async function getGeminiApiKey(): Promise<string> {
  // Prefer config stored in DB
  try {
    const cfg = await db.config.findUnique({ where: { key: 'gemini_api_key' } })
    const val = cfg?.value?.trim()
    if (val) return val
  } catch {}
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set. Add it to .env or save it in Management > Runtime Keys.')
  }
  return apiKey
}

// Initialize Gemini client lazily
async function getGenAI() {
  const key = await getGeminiApiKey()
  return new GoogleGenerativeAI(key)
}

export interface AttendanceResult {
  present: string[]
  absent: string[]
  notes?: string
}

export async function processWhiteboardImage(
  imageBase64: string,
  mimeType: string = 'image/jpeg'
): Promise<AttendanceResult> {
  try {
    // Get the generative model
    const genAI = await getGenAI()
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    // Remove data URL prefix if present
    const base64Data = imageBase64.includes(',')
      ? imageBase64.split(',')[1]
      : imageBase64

    const prompt = `You are analyzing a whiteboard image used for FRC team attendance tracking. 

Your task is to:
1. Identify all team member names that are marked as PRESENT (checked, circled, marked with X, or otherwise clearly indicated as present)
2. Identify all team member names that are marked as ABSENT (crossed out, marked absent, or otherwise clearly indicated as absent)
3. Return ONLY a valid JSON object with this exact structure:
{
  "present": ["Name1", "Name2", ...],
  "absent": ["Name3", "Name4", ...],
  "notes": "Any additional notes or unclear names"
}

Important:
- Only include names you can clearly read
- If a name is unclear, mention it in the "notes" field
- Return valid JSON only, no markdown formatting
- If no names are found, return empty arrays
- Be accurate and thorough in reading the whiteboard`

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: mimeType,
      },
    }

    const result = await model.generateContent([prompt, imagePart])
    
    // Check if result is null or undefined
    if (!result) {
      throw new Error('Failed to get response from Gemini API. Please verify your GEMINI_API_KEY is correct.')
    }
    
    const response = result.response
    
    // Check if response is null or undefined
    if (!response) {
      throw new Error('Failed to get response from Gemini API. The API key may be invalid.')
    }
    
    const text = response.text()

    // Extract JSON from response (handle cases where Gemini adds markdown formatting)
    let jsonText = text.trim()
    
    // Remove markdown code blocks if present
    if (jsonText.includes('```json')) {
      const jsonMatch = jsonText.match(/```json\s*([\s\S]*?)\s*```/)
      if (jsonMatch) {
        jsonText = jsonMatch[1].trim()
      }
    } else if (jsonText.includes('```')) {
      const codeMatch = jsonText.match(/```\s*([\s\S]*?)\s*```/)
      if (codeMatch) {
        jsonText = codeMatch[1].trim()
      }
    }

    // Try to find JSON object in the text if it's not pure JSON
    if (!jsonText.startsWith('{')) {
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        jsonText = jsonMatch[0]
      }
    }

    // Parse the JSON
    let parsed: AttendanceResult
    try {
      parsed = JSON.parse(jsonText) as AttendanceResult
    } catch (parseError) {
      console.error('Failed to parse JSON from Gemini response:', jsonText)
      throw new Error(`Failed to parse JSON response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`)
    }

    // Ensure the result has the correct structure
    return {
      present: Array.isArray(parsed.present) ? parsed.present.filter((name) => typeof name === 'string' && name.trim().length > 0) : [],
      absent: Array.isArray(parsed.absent) ? parsed.absent.filter((name) => typeof name === 'string' && name.trim().length > 0) : [],
      notes: parsed.notes || undefined,
    }
  } catch (error) {
    console.error('Error processing whiteboard image with Gemini:', error)
    
    // Provide more specific error messages
    if (error instanceof Error) {
      const errorMsg = error.message.toLowerCase()
      
      if (errorMsg.includes('api key') || errorMsg.includes('unauthorized') || errorMsg.includes('403')) {
        throw new Error('Invalid GEMINI_API_KEY. Please verify your API key is correct and has the necessary permissions.')
      }
      
      if (errorMsg.includes('404') || errorMsg.includes('not found')) {
        throw new Error('The Gemini model is not available. The API key may not have access to this model.')
      }
      
      if (errorMsg.includes('quota') || errorMsg.includes('rate limit')) {
        throw new Error('API quota exceeded or rate limit reached. Please try again later.')
      }
      
      throw new Error(`Failed to process image: ${error.message}`)
    }
    
    throw new Error(`Failed to process image: Unknown error occurred`)
  }
}
