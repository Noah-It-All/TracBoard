import axios from 'axios'

const RHR_MFG_API_URL = process.env.RHR_MFG_API_URL || 'http://localhost:5173'

export interface Part {
  id: string
  name: string
  thumbnail?: string
  state?: string
}

export interface Equipment {
  id: string
  name: string
  status?: string
}

export async function fetchParts(): Promise<Part[]> {
  try {
    // This will need to be adjusted based on the actual rhr-mfg API structure
    // For now, we'll create a placeholder that can be updated once we know the API
    const response = await axios.get(`${RHR_MFG_API_URL}/api/parts`, {
      headers: {
        Authorization: process.env.RHR_MFG_API_KEY
          ? `Bearer ${process.env.RHR_MFG_API_KEY}`
          : undefined,
      },
    })
    return response.data
  } catch (error) {
    console.error('Error fetching parts from rhr-mfg:', error)
    // Return empty array on error to prevent dashboard from breaking
    return []
  }
}

export async function fetchEquipment(): Promise<Equipment[]> {
  try {
    const response = await axios.get(`${RHR_MFG_API_URL}/api/equipment`, {
      headers: {
        Authorization: process.env.RHR_MFG_API_KEY
          ? `Bearer ${process.env.RHR_MFG_API_KEY}`
          : undefined,
      },
    })
    return response.data
  } catch (error) {
    console.error('Error fetching equipment from rhr-mfg:', error)
    return []
  }
}
