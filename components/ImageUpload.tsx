'use client'

import { useState } from 'react'
import { Upload, Image as ImageIcon, Loader2, CheckCircle2 } from 'lucide-react'

export default function ImageUpload() {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!selectedFile) {
      setResult('Error: Please select an image first')
      setSuccess(false)
      return
    }

    setUploading(true)
    setResult(null)

    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', selectedFile)

      const response = await fetch('/api/attendance/upload', {
        method: 'POST',
        body: uploadFormData,
      })

      let data
      try {
        data = await response.json()
      } catch (jsonError) {
        console.error('Failed to parse response:', jsonError)
        setResult('Error: Invalid response from server. Please try again.')
        setSuccess(false)
        return
      }

      if (response.ok) {
        const presentCount = data.processed?.present?.length || 0
        const absentCount = data.processed?.absent?.length || 0
        setResult(
          `Successfully processed! Found ${presentCount} present, ${absentCount} absent.`
        )
        setSuccess(true)
        setPreview(null)
        setSelectedFile(null)
        
        // Reset form
        const form = e.currentTarget
        if (form) {
          form.reset()
        }
        
        // Auto-clear success message after 5 seconds
        setTimeout(() => {
          setSuccess(false)
          setResult(null)
        }, 5000)
      } else {
        setResult(`Error: ${data.error || 'Failed to process image'}`)
        setSuccess(false)
      }
    } catch (error) {
      console.error('Upload error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setResult(`Error: ${errorMessage}. Please check your GEMINI_API_KEY and try again.`)
      setSuccess(false)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="bg-gray-dark rounded-xl p-4 sm:p-6 border border-gray-medium shadow-lg">
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div className="border-2 border-dashed border-gray-medium hover:border-red-primary/50 rounded-xl p-6 sm:p-8 text-center min-h-[250px] sm:min-h-[300px] flex items-center justify-center transition-colors duration-300">
          {preview ? (
            <div className="space-y-4 w-full">
              <img
                src={preview}
                alt="Preview"
                className="max-h-64 sm:max-h-80 mx-auto rounded-lg border-2 border-gray-medium"
              />
              <button
                type="button"
                onClick={() => {
                  setPreview(null)
                  setSelectedFile(null)
                  setResult(null)
                  setSuccess(false)
                }}
                className="text-sm text-red-secondary hover:text-red-primary underline transition-colors"
              >
                Remove image
              </button>
            </div>
          ) : (
            <label className="cursor-pointer w-full">
              <input
                type="file"
                name="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                disabled={uploading}
              />
              <div className="flex flex-col items-center gap-4 sm:gap-6">
                <div className="p-4 bg-red-primary/10 rounded-full">
                  <ImageIcon className="w-12 h-12 sm:w-16 sm:h-16 text-red-primary" />
                </div>
                <div>
                  <p className="text-lg sm:text-xl font-semibold text-white mb-2">
                    Tap to upload whiteboard image
                  </p>
                  <p className="text-sm sm:text-base text-gray-400">
                    Take a photo of your attendance whiteboard
                  </p>
                </div>
              </div>
            </label>
          )}
        </div>

        {preview && !success && (
          <button
            type="submit"
            disabled={uploading}
            className="w-full bg-red-primary hover:bg-red-secondary active:bg-red-dark disabled:bg-gray-medium disabled:cursor-not-allowed text-white font-semibold py-4 sm:py-5 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 text-base sm:text-lg shadow-lg hover:shadow-red-primary/20 disabled:shadow-none"
          >
            {uploading ? (
              <>
                <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                <span>Processing with AI...</span>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 sm:w-6 sm:h-6" />
                <span>Process Attendance</span>
              </>
            )}
          </button>
        )}

        {result && (
          <div
            className={`p-4 sm:p-5 rounded-xl text-sm sm:text-base transition-all duration-300 ${
              success
                ? 'bg-red-primary/20 text-red-light border-2 border-red-primary/50'
                : result.includes('Error')
                ? 'bg-red-dark/30 text-red-light border-2 border-red-dark'
                : 'bg-gray-medium text-gray-300 border border-gray-light'
            }`}
          >
            <div className="flex items-center gap-3">
              {success && <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 text-red-primary" />}
              <p className="font-medium">{result}</p>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
