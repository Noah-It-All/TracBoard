import ImageUpload from '@/components/ImageUpload'

export const dynamic = 'force-dynamic'

export default function UploadPage() {
  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-6">
      <div className="max-w-lg mx-auto w-full">
        <div className="mb-4 flex flex-wrap gap-2">
          <a
            href="/"
            className="px-3 py-1.5 bg-gray-medium hover:bg-gray-light text-white text-sm font-semibold rounded transition-colors"
          >
            ← Home
          </a>
          <a
            href="/todo"
            className="px-3 py-1.5 bg-gray-medium hover:bg-gray-light text-white text-sm font-semibold rounded transition-colors"
          >
            Weekly Goals
          </a>
          <a
            href="/management"
            className="px-3 py-1.5 bg-gray-medium hover:bg-gray-light text-white text-sm font-semibold rounded transition-colors"
          >
            Management
          </a>
        </div>
        <div className="mb-6 sm:mb-8 text-center">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 tracking-tight">
            Upload Whiteboard
          </h1>
          <div className="h-1 w-24 sm:w-32 bg-red-primary mx-auto"></div>
          <p className="text-gray-400 text-sm sm:text-base mt-4">
            Take a photo of your attendance whiteboard to automatically track attendance
          </p>
        </div>
        <ImageUpload />
      </div>
    </div>
  )
}
