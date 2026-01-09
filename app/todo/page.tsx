"use client"

import { useEffect, useState } from 'react'
import { Check, X, Plus, Trash2, Edit2, Save, ExternalLink } from 'lucide-react'

interface Goal {
  id: string
  title: string
  description?: string | null
  isCompleted: boolean
  order: number
}

interface WeeklyGoal {
  id: string
  weekStartDate: string
  basecampPostId?: string | null
  basecampPostUrl?: string | null
}

interface BasecampProject {
  id: number
  name: string
  dock?: Array<{ name: string; title: string; id: number; url: string }>
}

interface BasecampMessage {
  id: number
  title: string
  content: string
  created_at: string
  url: string
}

function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
}

export default function TodoPage() {
  
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 5000)
  }
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getMonday(new Date()))
  const [weeklyGoal, setWeeklyGoal] = useState<WeeklyGoal | null>(null)
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  
  // Notification system
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  
  // Basecamp integration
  const [basecampConfig, setBasecampConfig] = useState({
    hasAccessToken: false,
    accountId: '',
    projectId: '',
    messageBoardId: ''
  })
  const [showBasecampFlow, setShowBasecampFlow] = useState(false)
  const [basecampStep, setBasecampStep] = useState<'auth' | 'config' | 'projects' | 'messages'>('auth')
  const [basecampAccountId, setBasecampAccountId] = useState('')
  const [basecampProjects, setBasecampProjects] = useState<BasecampProject[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [messageBoardId, setMessageBoardId] = useState('')
  const [basecampMessages, setBasecampMessages] = useState<BasecampMessage[]>([])
  const [selectedMessageId, setSelectedMessageId] = useState('')
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    fetchGoals()
    fetchBasecampConfig()
    
    // Check for OAuth callback
    const params = new URLSearchParams(window.location.search)
    if (params.get('success') === 'true') {
      window.history.replaceState({}, '', '/todo')
      fetchBasecampConfig()
      showNotification('Successfully connected to Basecamp!', 'success')
    } else if (params.get('error')) {
      window.history.replaceState({}, '', '/todo')
      showNotification(`Basecamp authentication failed: ${params.get('error')}`, 'error')
    }
  }, [currentWeekStart])

  async function fetchGoals() {
    try {
      setLoading(true)
      const weekStr = formatDate(currentWeekStart)
      const res = await fetch(`/api/goals?week=${weekStr}`, { cache: 'no-store' })
      const data = await res.json()
      setWeeklyGoal(data.weeklyGoal)
      setGoals(data.goals || [])
    } catch (error) {
      console.error('Error fetching goals:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchBasecampConfig() {
    try {
      const res = await fetch('/api/basecamp', { cache: 'no-store' })
      const data = await res.json()
      setBasecampConfig(data)
      
      if (data.hasAccessToken && data.accountId) {
        setBasecampAccountId(data.accountId)
        setBasecampStep('projects')
      } else if (data.hasAccessToken) {
        setBasecampStep('config')
      } else {
        setBasecampStep('auth')
      }
    } catch (error) {
      console.error('Error fetching Basecamp config:', error)
    }
  }

  function startBasecampAuth() {
    const clientId = process.env.NEXT_PUBLIC_BASECAMP_CLIENT_ID
    if (!clientId) {
      showNotification('Basecamp Client ID is not configured. Please add NEXT_PUBLIC_BASECAMP_CLIENT_ID to your environment variables.', 'error')
      return
    }
    
    const redirectUri = `${window.location.origin}/api/basecamp/oauth/callback`
    const authUrl = `https://launchpad.37signals.com/authorization/new?type=web_server&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`
    window.location.href = authUrl
  }

  async function saveBasecampConfig() {
    if (!basecampAccountId) {
      showNotification('Please enter your Basecamp Account ID', 'error')
      return
    }

    try {
      await fetch('/api/basecamp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: basecampAccountId })
      })
      
      setBasecampConfig({ ...basecampConfig, accountId: basecampAccountId })
      setBasecampStep('projects')
      await loadProjects()
    } catch (error) {
      console.error('Error saving config:', error)
      showNotification('Failed to save configuration', 'error')
    }
  }

  async function loadProjects() {
    try {
      const res = await fetch('/api/basecamp/projects', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to fetch projects')
      const projects = await res.json()
      setBasecampProjects(projects)
    } catch (error) {
      console.error('Error loading projects:', error)
      showNotification('Failed to load projects. Check your Account ID.', 'error')
    }
  }

  async function selectProject(projectId: string) {
    setSelectedProjectId(projectId)
    
    // Find message board ID from project dock
    const project = basecampProjects.find(p => p.id === parseInt(projectId))
    const messageBoard = project?.dock?.find(d => d.name === 'message_board')
    
    if (messageBoard) {
      setMessageBoardId(messageBoard.id.toString())
      await loadMessages(projectId, messageBoard.id.toString())
    } else {
      showNotification('No message board found in this project', 'error')
    }
  }

  async function loadMessages(projectId: string, boardId: string) {
    try {
      setBasecampStep('messages')
      const res = await fetch(`/api/basecamp/messages?projectId=${projectId}&messageBoardId=${boardId}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to fetch messages')
      const messages = await res.json()
      setBasecampMessages(messages)
    } catch (error) {
      console.error('Error loading messages:', error)
      showNotification('Failed to load messages', 'error')
    }
  }

  async function importFromBasecampPost() {
    if (!selectedMessageId) {
      showNotification('Please select a message', 'error')
      return
    }

    try {
      setImporting(true)
      
      // Fetch the full message content
      const messageRes = await fetch(`/api/basecamp/messages?projectId=${selectedProjectId}&messageId=${selectedMessageId}`, { cache: 'no-store' })
      if (!messageRes.ok) throw new Error('Failed to fetch message')
      const message = await messageRes.json()
      
      // Strip HTML and parse with Gemini
      const content = stripHtml(message.content)
      const parseRes = await fetch('/api/goals/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      })

      if (!parseRes.ok) {
        const error = await parseRes.json()
        throw new Error(error.error || 'Failed to parse goals')
      }

      const { goals: parsedGoals } = await parseRes.json()

      // Save goals
      const weekStr = formatDate(currentWeekStart)
      const saveRes = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weekStartDate: weekStr,
          goals: parsedGoals,
          basecampPostId: selectedMessageId,
          basecampPostUrl: message.url
        })
      })

      if (!saveRes.ok) {
        throw new Error('Failed to save goals')
      }

      await fetchGoals()
      setShowBasecampFlow(false)
      setSelectedMessageId('')
      showNotification(`Successfully imported ${parsedGoals.length} goals!`, 'success')
    } catch (error) {
      console.error('Error importing goals:', error)
      showNotification(error instanceof Error ? error.message : 'Failed to import goals', 'error')
    } finally {
      setImporting(false)
    }
  }

  async function disconnectBasecamp() {
    if (!confirm('Are you sure you want to disconnect from Basecamp?')) return
    
    try {
      await fetch('/api/basecamp', { method: 'DELETE' })
      setBasecampConfig({ hasAccessToken: false, accountId: '', projectId: '', messageBoardId: '' })
      setBasecampStep('auth')
      setBasecampProjects([])
      setBasecampMessages([])
    } catch (error) {
      console.error('Error disconnecting:', error)
    }
  }

  async function toggleGoal(goal: Goal) {
    try {
      const res = await fetch('/api/goals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: goal.id,
          isCompleted: !goal.isCompleted
        })
      })

      if (res.ok) {
        setGoals(goals.map(g => g.id === goal.id ? { ...g, isCompleted: !g.isCompleted } : g))
      }
    } catch (error) {
      console.error('Error toggling goal:', error)
    }
  }

  async function saveGoalEdit(goalId: string) {
    try {
      const res = await fetch('/api/goals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: goalId,
          title: editTitle,
          description: editDescription || undefined
        })
      })

      if (res.ok) {
        await fetchGoals()
        setEditingId(null)
      }
    } catch (error) {
      console.error('Error updating goal:', error)
    }
  }

  async function deleteGoal(goalId: string) {
    if (!confirm('Are you sure you want to delete this goal?')) return

    try {
      const res = await fetch(`/api/goals?id=${goalId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        setGoals(goals.filter(g => g.id !== goalId))
      }
    } catch (error) {
      console.error('Error deleting goal:', error)
    }
  }

  async function clearAllGoals() {
    if (!confirm('Are you sure you want to clear all goals for this week? This cannot be undone.')) return

    try {
      const weekStr = formatDate(currentWeekStart)
      const res = await fetch(`/api/goals?week=${weekStr}&clearAll=true`, {
        method: 'DELETE'
      })

      if (res.ok) {
        setGoals([])
      }
    } catch (error) {
      console.error('Error clearing all goals:', error)
      showNotification('Failed to clear goals', 'error')
    }
  }

  function previousWeek() {
    const newDate = new Date(currentWeekStart)
    newDate.setDate(newDate.getDate() - 7)
    setCurrentWeekStart(newDate)
  }

  function nextWeek() {
    const newDate = new Date(currentWeekStart)
    newDate.setDate(newDate.getDate() + 7)
    setCurrentWeekStart(newDate)
  }

  function currentWeek() {
    setCurrentWeekStart(getMonday(new Date()))
  }

  const weekEnd = new Date(currentWeekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)

  const completedCount = goals.filter(g => g.isCompleted).length
  const totalCount = goals.length
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-6 md:p-8">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg border-l-4 animate-slide-in max-w-md ${
          notification.type === 'success' ? 'bg-green-900/90 border-green-500 text-green-100' :
          notification.type === 'error' ? 'bg-red-900/90 border-red-500 text-red-100' :
          'bg-blue-900/90 border-blue-500 text-blue-100'
        }`}>
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium">{notification.message}</p>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="flex-shrink-0 text-current opacity-70 hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Weekly Goals</h1>
            <div className="h-1.5 w-24 bg-red-primary"></div>
          </div>
          <div className="flex gap-2">
            <a
              href="/dashboard"
              className="px-3 py-1.5 bg-gray-medium hover:bg-gray-light text-white text-sm font-semibold rounded transition-colors"
            >
              Dashboard
            </a>
            <a
              href="/"
              className="px-3 py-1.5 bg-gray-medium hover:bg-gray-light text-white text-sm font-semibold rounded transition-colors"
            >
              Home
            </a>
          </div>
        </div>

        {/* Week selector */}
        <div className="bg-gray-dark rounded-lg p-4 mb-6 border border-gray-medium">
          <div className="flex items-center justify-between">
            <button
              onClick={previousWeek}
              className="px-3 py-2 bg-gray-medium hover:bg-gray-light rounded transition-colors"
            >
              ← Previous
            </button>
            <div className="text-center">
              <div className="text-lg font-semibold">
                {currentWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
              {weeklyGoal?.basecampPostUrl && (
                <a
                  href={weeklyGoal.basecampPostUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-red-primary hover:underline mt-1 inline-flex items-center gap-1"
                >
                  View in Basecamp <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {!weeklyGoal?.basecampPostUrl && (
                <button
                  onClick={currentWeek}
                  className="text-sm text-red-primary hover:underline mt-1"
                >
                  Go to current week
                </button>
              )}
            </div>
            <button
              onClick={nextWeek}
              className="px-3 py-2 bg-gray-medium hover:bg-gray-light rounded transition-colors"
            >
              Next →
            </button>
          </div>
        </div>

        {/* Progress bar */}
        {totalCount > 0 && (
          <div className="bg-gray-dark rounded-lg p-4 mb-6 border border-gray-medium">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold">Progress</span>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-300">{completedCount} / {totalCount} completed</span>
                <button
                  onClick={clearAllGoals}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded transition-colors"
                  title="Clear all goals for this week"
                >
                  Clear All
                </button>
              </div>
            </div>
            <div className="w-full bg-gray-medium rounded-full h-3 overflow-hidden">
              <div
                className="bg-red-primary h-full transition-all duration-300 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Import from Basecamp */}
        <div className="bg-gray-dark rounded-lg p-4 mb-6 border border-gray-medium">
          <button
            onClick={() => setShowBasecampFlow(!showBasecampFlow)}
            className="w-full flex items-center justify-between text-left"
          >
            <span className="font-semibold">Import from Basecamp</span>
            <span className="text-2xl">{showBasecampFlow ? '−' : '+'}</span>
          </button>

          {showBasecampFlow && (
            <div className="mt-4 space-y-4">
              {/* Auth step */}
              {basecampStep === 'auth' && (
                <div className="text-center py-6">
                  <p className="text-sm text-gray-300 mb-4">
                    Connect your Basecamp account to import weekly goals posts
                  </p>
                  <button
                    onClick={startBasecampAuth}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded transition-colors"
                  >
                    Connect to Basecamp
                  </button>
                </div>
              )}

              {/* Config step - Account ID */}
              {basecampStep === 'config' && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Basecamp Account ID
                  </label>
                  <p className="text-xs text-gray-400 mb-2">
                    Find your Account ID in your Basecamp URL: https://3.basecamp.com/<strong>YOUR_ACCOUNT_ID</strong>/
                  </p>
                  <input
                    type="text"
                    value={basecampAccountId}
                    onChange={(e) => setBasecampAccountId(e.target.value)}
                    placeholder="1234567"
                    className="w-full px-3 py-2 bg-gray-medium border border-gray-light rounded text-white placeholder-gray-400 mb-3"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={saveBasecampConfig}
                      disabled={!basecampAccountId}
                      className="flex-1 px-4 py-2 bg-red-primary hover:bg-red-dark disabled:bg-gray-medium disabled:cursor-not-allowed text-white font-semibold rounded transition-colors"
                    >
                      Continue
                    </button>
                    <button
                      onClick={disconnectBasecamp}
                      className="px-4 py-2 bg-gray-medium hover:bg-gray-light text-white rounded transition-colors"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              )}

              {/* Projects step */}
              {basecampStep === 'projects' && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">Select a Project</h3>
                    <button
                      onClick={disconnectBasecamp}
                      className="text-sm text-red-primary hover:underline"
                    >
                      Disconnect
                    </button>
                  </div>
                  {basecampProjects.length === 0 ? (
                    <div className="text-center py-4">
                      <button
                        onClick={loadProjects}
                        className="px-4 py-2 bg-gray-medium hover:bg-gray-light text-white rounded transition-colors"
                      >
                        Load Projects
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {basecampProjects.map(project => (
                        <button
                          key={project.id}
                          onClick={() => selectProject(project.id.toString())}
                          className="w-full px-4 py-3 bg-gray-medium hover:bg-gray-light text-left rounded transition-colors"
                        >
                          {project.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Messages step */}
              {basecampStep === 'messages' && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">Select a Weekly Goals Post</h3>
                    <button
                      onClick={() => {
                        setBasecampStep('projects')
                        setBasecampMessages([])
                        setSelectedMessageId('')
                      }}
                      className="text-sm text-red-primary hover:underline"
                    >
                      Change Project
                    </button>
                  </div>
                  {basecampMessages.length === 0 ? (
                    <div className="text-center py-4 text-gray-400">
                      No messages found in this project
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
                        {basecampMessages.map(message => (
                          <button
                            key={message.id}
                            onClick={() => setSelectedMessageId(message.id.toString())}
                            className={`w-full px-4 py-3 text-left rounded transition-colors ${
                              selectedMessageId === message.id.toString()
                                ? 'bg-red-primary'
                                : 'bg-gray-medium hover:bg-gray-light'
                            }`}
                          >
                            <div className="font-medium">{message.title}</div>
                            <div className="text-xs text-gray-300 mt-1">
                              {new Date(message.created_at).toLocaleDateString()}
                            </div>
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={importFromBasecampPost}
                        disabled={!selectedMessageId || importing}
                        className="w-full px-4 py-2 bg-red-primary hover:bg-red-dark disabled:bg-gray-medium disabled:cursor-not-allowed text-white font-semibold rounded transition-colors"
                      >
                        {importing ? 'Importing...' : 'Import Selected Post'}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Goals list */}
        <div className="bg-gray-dark rounded-lg p-4 border border-gray-medium">
          <h2 className="text-xl font-semibold mb-4">Goals</h2>

          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading...</div>
          ) : goals.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No goals for this week. Import from Basecamp to get started!
            </div>
          ) : (
            <div className="space-y-3">
              {goals.map((goal) => (
                <div
                  key={goal.id}
                  className={`p-3 rounded border transition-all ${
                    goal.isCompleted
                      ? 'bg-gray-medium border-green-500/30'
                      : 'bg-gray-medium border-gray-light'
                  }`}
                >
                  {editingId === goal.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full px-3 py-2 bg-black border border-gray-light rounded text-white"
                      />
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="Description (optional)"
                        rows={2}
                        className="w-full px-3 py-2 bg-black border border-gray-light rounded text-white placeholder-gray-400"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveGoalEdit(goal.id)}
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm flex items-center gap-1"
                        >
                          <Save className="w-4 h-4" /> Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1.5 bg-gray-light hover:bg-gray-medium text-white rounded text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleGoal(goal)}
                        className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                          goal.isCompleted
                            ? 'bg-green-600 border-green-600'
                            : 'border-gray-light hover:border-red-primary'
                        }`}
                      >
                        {goal.isCompleted && <Check className="w-4 h-4 text-white" />}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div
                          className={`font-medium ${
                            goal.isCompleted ? 'line-through text-gray-400' : ''
                          }`}
                        >
                          {goal.title}
                        </div>
                        {goal.description && (
                          <div className="text-sm text-gray-300 mt-1">
                            {goal.description}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingId(goal.id)
                            setEditTitle(goal.title)
                            setEditDescription(goal.description || '')
                          }}
                          className="p-1.5 hover:bg-gray-light rounded transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteGoal(goal.id)}
                          className="p-1.5 hover:bg-red-dark rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

