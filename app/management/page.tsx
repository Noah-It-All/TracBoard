"use client"

import { useEffect, useMemo, useState } from 'react'

type Team = { id: string; name: string }
type Member = { id: string; name: string; email?: string | null; teamId?: string | null }
type ConfigItem = { key: string; value: string }
type AttendanceRecord = {
  id: string
  date: string
  isPresent: boolean
  teamMemberId: string
  memberName?: string
  teamName?: string
}

export default function ManagementPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [configs, setConfigs] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState<'config' | 'teams' | 'attendance' | 'export'>('config')

  // Fetch initial data
  useEffect(() => {
    refreshAll()
  }, [])

  async function refreshAll() {
    await Promise.all([refreshTeams(), refreshMembers(), refreshConfigs()])
  }

  async function refreshTeams() {
    const res = await fetch('/api/management/teams', { cache: 'no-store' })
    if (res.ok) setTeams(await res.json())
  }
  async function refreshMembers() {
    const res = await fetch('/api/management/members', { cache: 'no-store' })
    if (res.ok) setMembers(await res.json())
  }
  async function refreshConfigs() {
    const res = await fetch('/api/management/config', { cache: 'no-store' })
    if (res.ok) {
      const list: ConfigItem[] = await res.json()
      const map: Record<string, string> = {}
      list.forEach((c) => (map[c.key] = c.value))
      setConfigs(map)
    }
  }
  async function upsertConfig(key: string, value: string) {
    const res = await fetch('/api/management/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    })
    if (res.ok) await refreshConfigs()
  }

  async function addTeam(name: string) {
    const res = await fetch('/api/management/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    if (res.ok) await refreshTeams()
  }

  async function addMember(name: string, teamId?: string) {
    const res = await fetch('/api/management/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, teamId }),
    })
    if (res.ok) await refreshMembers()
  }

  async function updateMember(memberId: string, name: string, teamId?: string | null) {
    const res = await fetch('/api/management/members', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId, name, teamId }),
    })
    if (res.ok) await refreshMembers()
  }

  async function deleteMember(memberId: string) {
    if (!confirm('Are you sure you want to delete this member?')) return
    const res = await fetch(`/api/management/members?id=${memberId}`, {
      method: 'DELETE',
    })
    if (res.ok) await refreshMembers()
  }



  async function assignMember(memberId: string, teamId: string | null) {
    const res = await fetch('/api/management/members/assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId, teamId }),
    })
    if (res.ok) await refreshMembers()
  }

  async function addAttendanceRecord(memberId: string, date: string, isPresent: boolean) {
    const res = await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamMemberId: memberId, date, isPresent }),
    })
    if (res.ok) await refreshAttendance()
  }

  async function refreshAttendance() {
    // Placeholder - just re-fetch data if needed
  }

  const teamName = configs['team_name'] || 'TracBoard'

  return (
    <div className="p-6 text-white bg-black min-h-screen">
      <div className="mb-4">
        <a
          href="/"
          className="inline-block px-3 py-1.5 bg-gray-medium hover:bg-gray-light text-white text-sm font-semibold rounded transition-colors"
        >
          ← Home
        </a>
      </div>
      <h1 className="text-3xl font-bold mb-4">Management</h1>
      <div className="flex gap-2 mb-6">
        <button className={`px-3 py-2 rounded ${activeTab==='config'?'bg-red-primary':'bg-gray-medium'}`} onClick={()=>setActiveTab('config')}>Configuration</button>
        <button className={`px-3 py-2 rounded ${activeTab==='teams'?'bg-red-primary':'bg-gray-medium'}`} onClick={()=>setActiveTab('teams')}>Teams & Members</button>
        <button className={`px-3 py-2 rounded ${activeTab==='attendance'?'bg-red-primary':'bg-gray-medium'}`} onClick={()=>setActiveTab('attendance')}>Attendance</button>
        <button className={`px-3 py-2 rounded ${activeTab==='export'?'bg-red-primary':'bg-gray-medium'}`} onClick={()=>setActiveTab('export')}>Export</button>
      </div>

      {activeTab === 'config' && (
        <div className="grid gap-4">
          <div className="bg-gray-dark p-4 rounded border border-gray-medium">
            <h2 className="text-xl font-semibold mb-3">Dashboard Settings</h2>
            <label className="block text-sm mb-1">Team Name (Header)</label>
            <div className="flex gap-2">
              <input 
                id="team-name-input"
                className="flex-1 p-2 rounded bg-gray-medium text-white" 
                defaultValue={configs['team_name'] || ''} 
                placeholder="e.g., FRC Team 123" 
              />
              <button 
                onClick={() => {
                  const input = document.getElementById('team-name-input') as HTMLInputElement
                  if (input) upsertConfig('team_name', input.value)
                }}
                className="px-4 py-2 bg-red-primary hover:bg-red-600 text-white font-semibold rounded transition-colors"
              >
                Save
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">Updates reflect on the main dashboard header.</p>
          </div>

          <div className="bg-gray-dark p-4 rounded border border-gray-medium">
            <h2 className="text-xl font-semibold mb-3">Runtime Keys</h2>
            <label className="block text-sm mb-1">Gemini API Key</label>
            <input className="w-full p-2 rounded bg-gray-medium text-white" defaultValue={configs['gemini_api_key'] || ''} onBlur={(e)=>upsertConfig('gemini_api_key', e.target.value)} placeholder="GEMINI_API_KEY" />
            <label className="block text-sm mt-3 mb-1">Database URL</label>
            <input className="w-full p-2 rounded bg-gray-medium text-white" defaultValue={configs['database_url'] || ''} onBlur={(e)=>upsertConfig('database_url', e.target.value)} placeholder="DATABASE_URL" />
            <p className="text-xs text-gray-400 mt-1">Note: Changing environment variables may require a server restart. Keys stored here can be used by the app at runtime.</p>
          </div>
        </div>
      )}

      {activeTab === 'teams' && (
        <div className="grid gap-6">
          <div className="bg-gray-dark p-4 rounded border border-gray-medium">
            <h2 className="text-xl font-semibold mb-3">Create Team</h2>
            <TeamForm onSubmit={addTeam} />
          </div>
          <div className="bg-gray-dark p-4 rounded border border-gray-medium">
            <h2 className="text-xl font-semibold mb-3">Add Member</h2>
            <MemberForm teams={teams} onSubmit={addMember} />
          </div>
          <div className="bg-gray-dark p-4 rounded border border-gray-medium">
            <h2 className="text-xl font-semibold mb-3">Members</h2>
            <MemberList 
              members={members} 
              teams={teams} 
              onUpdate={updateMember}
              onDelete={deleteMember}
              onAddAttendance={addAttendanceRecord}
            />
          </div>
        </div>
      )}

      {activeTab === 'attendance' && (
        <AttendanceManager members={members} teams={teams} />
      )}

      {activeTab === 'export' && (
        <div className="bg-gray-dark p-4 rounded border border-gray-medium">
          <h2 className="text-xl font-semibold mb-3">Export Attendance</h2>
          <p className="text-sm text-gray-300 mb-3">Download all attendance records as CSV.</p>
          <a href="/api/attendance/export" className="inline-block px-4 py-2 rounded bg-red-primary text-white">Download CSV</a>
        </div>
      )}
    </div>
  )
}

function TeamForm({ onSubmit }: { onSubmit: (name: string) => Promise<void> }) {
  const [name, setName] = useState('')
  return (
    <div className="flex gap-2">
      <input className="flex-1 p-2 rounded bg-gray-medium text-white" value={name} onChange={(e)=>setName(e.target.value)} placeholder="Team name" />
      <button className="px-3 py-2 rounded bg-red-primary" onClick={()=>{ if(name.trim()) { onSubmit(name.trim()); setName('') } }}>Create</button>
    </div>
  )
}

function MemberForm({ teams, onSubmit }: { teams: Team[]; onSubmit: (name: string, teamId?: string) => Promise<void> }) {
  const [name, setName] = useState('')
  const [teamId, setTeamId] = useState<string>('')
  return (
    <div className="grid gap-2">
      <input className="p-2 rounded bg-gray-medium text-white" value={name} onChange={(e)=>setName(e.target.value)} placeholder="Member name" />
      <select className="p-2 rounded bg-gray-medium text-white" value={teamId} onChange={(e)=>setTeamId(e.target.value)}>
        <option value="">No team</option>
        {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>
      <button className="px-3 py-2 rounded bg-red-primary w-fit" onClick={()=>{ if(name.trim()) { onSubmit(name.trim(), teamId || undefined); setName(''); setTeamId('') } }}>Add Member</button>
    </div>
  )
}

function MemberList({ members, teams, onUpdate, onDelete, onAddAttendance }: { 
  members: Member[]; 
  teams: Team[]; 
  onUpdate: (memberId: string, name: string, teamId?: string | null) => Promise<void>;
  onDelete: (memberId: string) => Promise<void>;
  onAddAttendance: (memberId: string, date: string, isPresent: boolean) => Promise<void>;
}) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editTeamId, setEditTeamId] = useState('')
  
  const getTodayLocalDate = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  const [attendanceDate, setAttendanceDate] = useState(getTodayLocalDate())
  const [showAttendanceFor, setShowAttendanceFor] = useState<string | null>(null)
  
  const teamMap = useMemo(() => Object.fromEntries(teams.map(t => [t.id, t.name])), [teams])
  
  const startEdit = (member: Member) => {
    setEditingId(member.id)
    setEditName(member.name)
    setEditTeamId(member.teamId || '')
  }
  
  const saveEdit = async (memberId: string) => {
    await onUpdate(memberId, editName, editTeamId || null)
    setEditingId(null)
  }
  
  const cancelEdit = () => {
    setEditingId(null)
    setEditName('')
    setEditTeamId('')
  }
  
  return (
    <div className="grid gap-3">
      {members.length === 0 && <p className="text-gray-400 text-sm">No members yet.</p>}
      {members.map(m => (
        <div key={m.id} className="bg-black/30 p-3 rounded">
          {editingId === m.id ? (
            <div className="grid gap-2">
              <input 
                className="p-2 rounded bg-gray-medium text-white" 
                value={editName} 
                onChange={(e)=>setEditName(e.target.value)} 
                placeholder="Member name" 
              />
              <select 
                className="p-2 rounded bg-gray-medium text-white" 
                value={editTeamId} 
                onChange={(e)=>setEditTeamId(e.target.value)}
              >
                <option value="">No team</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <div className="flex gap-2">
                <button 
                  className="px-3 py-1 rounded bg-green-600 hover:bg-green-700 text-white text-sm" 
                  onClick={()=>saveEdit(m.id)}
                >
                  Save
                </button>
                <button 
                  className="px-3 py-1 rounded bg-gray-medium hover:bg-gray-light text-white text-sm" 
                  onClick={cancelEdit}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1">
                  <div className="font-medium">{m.name}</div>
                  <div className="text-xs text-gray-400">Team: {m.teamId ? teamMap[m.teamId] || m.teamId : 'Unassigned'}</div>
                </div>
                <div className="flex gap-2">
                  <button 
                    className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs" 
                    onClick={()=>startEdit(m)}
                  >
                    Edit
                  </button>
                  <button 
                    className="px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-xs" 
                    onClick={()=>onDelete(m.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
              
              <div className="mt-2 pt-2 border-t border-gray-medium">
                {showAttendanceFor === m.id ? (
                  <div className="grid gap-2">
                    <label className="text-xs text-gray-400">Add Attendance Record</label>
                    <input 
                      type="date" 
                      className="p-2 rounded bg-gray-medium text-white text-sm" 
                      value={attendanceDate}
                      onChange={(e)=>setAttendanceDate(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <button 
                        className="flex-1 px-3 py-1 rounded bg-green-600 hover:bg-green-700 text-white text-sm" 
                        onClick={async ()=>{
                          await onAddAttendance(m.id, attendanceDate, true)
                          setShowAttendanceFor(null)
                        }}
                      >
                        Present
                      </button>
                      <button 
                        className="flex-1 px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-sm" 
                        onClick={async ()=>{
                          await onAddAttendance(m.id, attendanceDate, false)
                          setShowAttendanceFor(null)
                        }}
                      >
                        Absent
                      </button>
                      <button 
                        className="px-3 py-1 rounded bg-gray-medium hover:bg-gray-light text-white text-sm" 
                        onClick={()=>setShowAttendanceFor(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button 
                    className="px-3 py-1 rounded bg-gray-medium hover:bg-gray-light text-white text-xs w-full" 
                    onClick={()=>setShowAttendanceFor(m.id)}
                  >
                    + Add Attendance
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function AttendanceManager({ members, teams }: { members: Member[]; teams: Team[] }) {
  const [history, setHistory] = useState<AttendanceRecord[]>([])
  const [historyMember, setHistoryMember] = useState<string>('all')
  const [historyStart, setHistoryStart] = useState<string>('')
  const [historyEnd, setHistoryEnd] = useState<string>('')
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)

  const memberMap = useMemo(() => Object.fromEntries(members.map((m) => [m.id, m])), [members])
  const teamMap = useMemo(() => Object.fromEntries(teams.map((t) => [t.id, t.name])), [teams])

  useEffect(() => {
    refreshHistory()
  }, [])

  async function refreshHistory() {
    setLoadingHistory(true)
    try {
      const params = new URLSearchParams()
      if (historyMember !== 'all') params.set('memberId', historyMember)
      if (historyStart) params.set('start', historyStart)
      if (historyEnd) params.set('end', historyEnd)
      const res = await fetch(`/api/attendance${params.toString() ? `?${params.toString()}` : ''}`, {
        cache: 'no-store',
      })
      if (res.ok) {
        const list: AttendanceRecord[] = await res.json()
        setHistory(list)
      }
    } finally {
      setLoadingHistory(false)
    }
  }

  async function deleteAttendanceRecord(recordId: string, teamMemberId: string, date: string) {
    if (!confirm('Delete this attendance record?')) return
    const res = await fetch(`/api/attendance?teamMemberId=${teamMemberId}&date=${date}`, {
      method: 'DELETE',
    })
    if (res.ok) {
      setMenuOpen(null)
      await refreshHistory()
    }
  }

  async function editAttendanceRecord(recordId: string, teamMemberId: string, date: string, isPresent: boolean) {
    const res = await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamMemberId, date, isPresent: !isPresent }),
    })
    if (res.ok) {
      setMenuOpen(null)
      await refreshHistory()
    }
  }

  const historyGrouped = useMemo(() => {
    const groups: Record<string, AttendanceRecord[]> = {}
    history.forEach((r) => {
      if (!groups[r.date]) groups[r.date] = []
      groups[r.date].push(r)
    })
    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, records]) => ({ date, records: records.sort((x, y) => (memberMap[x.teamMemberId]?.name || '').localeCompare(memberMap[y.teamMemberId]?.name || '')) }))
  }, [history, memberMap])

  return (
    <div className="bg-gray-dark p-4 rounded border border-gray-medium">
      <div className="flex flex-wrap items-end gap-3 justify-between mb-3">
        <div>
          <h2 className="text-xl font-semibold">Attendance History</h2>
          <p className="text-sm text-gray-400">Filter and review recent records (defaults to latest 200).</p>
        </div>
        <div className="flex gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Member</label>
            <select
              className="p-2 rounded bg-gray-medium text-white text-sm"
              value={historyMember}
              onChange={(e) => setHistoryMember(e.target.value)}
            >
              <option value="all">All</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Start</label>
            <input
              type="date"
              className="p-2 rounded bg-gray-medium text-white text-sm"
              value={historyStart}
              onChange={(e) => setHistoryStart(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">End</label>
            <input
              type="date"
              className="p-2 rounded bg-gray-medium text-white text-sm"
              value={historyEnd}
              onChange={(e) => setHistoryEnd(e.target.value)}
            />
          </div>
          <button
            className="px-4 py-2 rounded bg-gray-medium text-white font-semibold"
            onClick={refreshHistory}
          >
            Refresh
          </button>
        </div>
      </div>

      {loadingHistory && <p className="text-sm text-gray-400">Loading history…</p>}
      {!loadingHistory && historyGrouped.length === 0 && <p className="text-sm text-gray-400">No records found.</p>}

      <div className="grid gap-3 max-h-[600px] overflow-y-auto">
        {historyGrouped.map(({ date, records }) => (
            <div key={date} className="bg-black/30 p-3 rounded border border-gray-medium/60">
              <div className="font-semibold mb-2">{date}</div>
              <div className="grid gap-2">
                {records.map((r) => {
                  const member = memberMap[r.teamMemberId]
                  const team = member?.teamId ? teamMap[member.teamId] : null
                  return (
                    <div key={r.id} className="flex items-center justify-between bg-gray-medium/50 p-2 rounded">
                      <div className="flex-1">
                        <div className="font-medium">{member?.name || 'Unknown'}</div>
                        {team && <div className="text-xs text-gray-400">{team}</div>}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`px-3 py-1 rounded text-sm font-semibold ${r.isPresent ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                          {r.isPresent ? 'Present' : 'Absent'}
                        </div>
                        <div className="relative">
                          <button
                            className="px-2 py-1 text-gray-400 hover:text-white"
                            onClick={() => setMenuOpen(menuOpen === r.id ? null : r.id)}
                          >
                            ⋯
                          </button>
                          {menuOpen === r.id && (
                            <div className="absolute right-0 mt-1 bg-gray-dark border border-gray-medium rounded shadow-lg z-10">
                              <button
                                className="block w-full text-left px-3 py-1 text-sm hover:bg-gray-medium text-white"
                                onClick={() => editAttendanceRecord(r.id, r.teamMemberId, r.date, r.isPresent)}
                              >
                                Toggle
                              </button>
                              <button
                                className="block w-full text-left px-3 py-1 text-sm hover:bg-red-600 text-red-400"
                                onClick={() => deleteAttendanceRecord(r.id, r.teamMemberId, r.date)}
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
    </div>
  )
}
