import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

// ==================== TYPES ====================

interface Question {
  id: string
  text: string
  type: 'mcq' | 'true-false' | 'short-answer' | 'coding'
  options?: string[]
  correctAnswer: string | number
  points: number
  codeTemplate?: string
  testCases?: { input: string; expectedOutput: string; weight: number }[]
  timeLimit?: number
  explanation?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  tags?: string[]
}

interface Assessment {
  id: string
  title: string
  description: string
  creator: string
  participants: number
  maxParticipants: number
  isLocked: boolean
  code: string
  timeLimit: number
  questions: number
  totalPoints: number
  status: 'active' | 'scheduled' | 'ended'
  startTime?: Date
  endTime?: Date
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
  attempts: number
  avgScore: number
}

interface SessionStats {
  totalAssessments: number
  activeNow: number
  completedToday: number
  avgScore: number
  participants: number
  pendingReview: number
}

// ==================== COMPONENT ====================

export default function Assessment() {
  const navigate = useNavigate()

  // ── View State ──
  const [view, setView] = useState<'list' | 'create' | 'join' | 'preview'>('list')
  const [step, setStep] = useState(1)
  const [time, setTime] = useState(new Date())
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null)
  const [logs, setLogs] = useState<string[]>([])

  // ── List / Join ──
  const [joinCode, setJoinCode] = useState('')
  const [joinPassword, setJoinPassword] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'scheduled' | 'ended'>('all')
  const [filterDiff, setFilterDiff] = useState<'all' | 'easy' | 'medium' | 'hard'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // ── Create ──
  const [draftTitle, setDraftTitle] = useState('')
  const [draftDesc, setDraftDesc] = useState('')
  const [draftTimeLimit, setDraftTimeLimit] = useState(60)
  const [draftCategory, setDraftCategory] = useState('General')
  const [draftDifficulty, setDraftDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [draftMaxParticipants, setDraftMaxParticipants] = useState(30)
  const [draftLocked, setDraftLocked] = useState(true)
  const [draftShuffle, setDraftShuffle] = useState(true)
  const [draftShuffleOpts, setDraftShuffleOpts] = useState(true)
  const [draftAllowRetake, setDraftAllowRetake] = useState(false)
  const [draftMaxAttempts, setDraftMaxAttempts] = useState(1)
  const [draftShowResults, setDraftShowResults] = useState<'immediately' | 'after-end' | 'never'>('after-end')
  const [draftProctoring, setDraftProctoring] = useState(false)
  const [draftNegativeMarking, setDraftNegativeMarking] = useState(false)
  const [draftPassingScore, setDraftPassingScore] = useState(60)
  const [draftCutoffTime, setDraftCutoffTime] = useState(true)
  const [questions, setQuestions] = useState<Question[]>([])
  const [editingQuestion, setEditingQuestion] = useState<Question>(blankQuestion())
  const [generatedCode, setGeneratedCode] = useState('')
  const [generatedPass, setGeneratedPass] = useState('')

  // ── Simulated Data ──
  const [assessments, setAssessments] = useState<Assessment[]>([
    {
      id: 'a1', title: 'Data Structures Mid-term', description: 'Covers arrays, linked lists, stacks, queues and trees.',
      creator: 'Prof. Sharma', participants: 23, maxParticipants: 40, isLocked: true,
      code: 'DS2024', timeLimit: 60, questions: 20, totalPoints: 200, status: 'active',
      startTime: new Date(Date.now() - 900000), endTime: new Date(Date.now() + 2700000),
      category: 'Data Structures', difficulty: 'hard', attempts: 18, avgScore: 74
    },
    {
      id: 'a2', title: 'Algorithms Quiz — Sorting', description: 'Bubble, merge, quick, heap sort algorithms.',
      creator: 'Dr. Verma', participants: 15, maxParticipants: 30, isLocked: false,
      code: 'ALGO55', timeLimit: 30, questions: 15, totalPoints: 150, status: 'active',
      startTime: new Date(Date.now() - 300000), endTime: new Date(Date.now() + 1500000),
      category: 'Algorithms', difficulty: 'medium', attempts: 15, avgScore: 82
    },
    {
      id: 'a3', title: 'JavaScript Fundamentals', description: 'Closures, prototypes, async/await and ES6+ features.',
      creator: 'Teacher Kumar', participants: 8, maxParticipants: 25, isLocked: true,
      code: 'JS101', timeLimit: 45, questions: 25, totalPoints: 250, status: 'scheduled',
      startTime: new Date(Date.now() + 3600000), endTime: new Date(Date.now() + 7200000),
      category: 'Web Dev', difficulty: 'medium', attempts: 0, avgScore: 0
    },
    {
      id: 'a4', title: 'Database Design Basics', description: 'Normalization, ER diagrams, SQL queries and indexes.',
      creator: 'Prof. Rao', participants: 31, maxParticipants: 35, isLocked: false,
      code: 'DB404', timeLimit: 90, questions: 30, totalPoints: 300, status: 'ended',
      startTime: new Date(Date.now() - 7200000), endTime: new Date(Date.now() - 3600000),
      category: 'Databases', difficulty: 'hard', attempts: 31, avgScore: 68
    },
    {
      id: 'a5', title: 'OOP Concepts', description: 'Inheritance, polymorphism, encapsulation and abstraction.',
      creator: 'Dr. Mehta', participants: 19, maxParticipants: 40, isLocked: true,
      code: 'OOP22', timeLimit: 40, questions: 18, totalPoints: 180, status: 'active',
      startTime: new Date(Date.now() - 600000), endTime: new Date(Date.now() + 1800000),
      category: 'Programming', difficulty: 'easy', attempts: 14, avgScore: 88
    },
  ])

  const [stats, setStats] = useState<SessionStats>({
    totalAssessments: 5, activeNow: 3, completedToday: 1,
    avgScore: 77, participants: 96, pendingReview: 12
  })

  // ── Effects ──

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setAssessments(prev => prev.map(a => {
        if (a.status === 'active') {
          const delta = Math.random() > 0.7 ? 1 : 0
          return { ...a, participants: Math.min(a.participants + delta, a.maxParticipants) }
        }
        return a
      }))
      setStats(prev => ({
        ...prev,
        participants: prev.participants + Math.floor(Math.random() * 3)
      }))
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  // ── Utilities ──

  function blankQuestion(): Question {
    return {
      id: Math.random().toString(36).substr(2, 9),
      text: '', type: 'mcq',
      options: ['', '', '', ''],
      correctAnswer: '',
      points: 10,
      codeTemplate: '',
      testCases: [],
      difficulty: 'medium',
      tags: [],
      explanation: ''
    }
  }

  const formatTime = (d: Date) =>
    d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })

  const formatTimeShort = (d: Date) =>
    d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })

  const addLog = (msg: string) => setLogs(prev => [`[${formatTime(new Date())}] ${msg}`, ...prev.slice(0, 29)])

  const timeRemaining = (end?: Date) => {
    if (!end) return '--'
    const diff = end.getTime() - Date.now()
    if (diff <= 0) return 'ENDED'
    const m = Math.floor(diff / 60000)
    const s = Math.floor((diff % 60000) / 1000)
    return `${m}m ${s}s`
  }

  const diffColor = (d: string) =>
    d === 'easy' ? 'diff-easy' : d === 'medium' ? 'diff-med' : 'diff-hard'

  const statusColor = (s: string) =>
    s === 'active' ? 'stat-active' : s === 'scheduled' ? 'stat-sched' : 'stat-ended'

  const filteredAssessments = assessments.filter(a => {
    if (filterStatus !== 'all' && a.status !== filterStatus) return false
    if (filterDiff !== 'all' && a.difficulty !== filterDiff) return false
    if (searchQuery && !a.title.toLowerCase().includes(searchQuery.toLowerCase()) && !a.code.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  // ── Actions ──

  const handleJoin = () => {
    if (!joinCode.trim()) return
    const found = assessments.find(a => a.code === joinCode)
    if (found?.isLocked && !joinPassword.trim()) { addLog(`JOIN FAILED — ${joinCode} requires password`); return }
    addLog(`JOINED session ${joinCode}`)
    alert(`Joined: ${found?.title || joinCode}`)
  }

  const handleCreate = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    const pass = Math.floor(1000 + Math.random() * 9000).toString()
    setGeneratedCode(code)
    setGeneratedPass(pass)
    addLog(`CREATED assessment "${draftTitle}" • ${code}`)
    const newA: Assessment = {
      id: `a-${Date.now()}`, title: draftTitle, description: draftDesc,
      creator: 'You', participants: 0, maxParticipants: draftMaxParticipants,
      isLocked: draftLocked, code, timeLimit: draftTimeLimit, questions: questions.length,
      totalPoints: questions.reduce((s, q) => s + q.points, 0),
      status: 'scheduled', startTime: undefined, endTime: undefined,
      category: draftCategory, difficulty: draftDifficulty, attempts: 0, avgScore: 0
    }
    setAssessments(prev => [newA, ...prev])
    setStep(5)
  }

  const addQuestion = () => {
    if (!editingQuestion.text.trim()) return
    setQuestions(prev => [...prev, { ...editingQuestion, id: Math.random().toString(36).substr(2, 9) }])
    setEditingQuestion(blankQuestion())
    addLog(`Q${questions.length + 1} added — ${editingQuestion.type}`)
  }

  const removeQuestion = (id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id))
  }

  // ==================== RENDER ====================

  return (
    <div className="aroot">

      {/* ── PAGE HEADER (matches Home ascii-header) ── */}
      <div className="a-page-header">
        <div className="a-page-title">
          <span className="a-title-text">ASSESSMENT MODULE</span>
          <span className="a-title-sub">LAN-BASED ACADEMIC EVALUATION SYSTEM</span>
        </div>
        <div className="a-page-meta">
          <span className="a-version">v1.0.0</span>
          <span className="a-time">{formatTimeShort(time)}</span>
          <div className="a-log-box">
            <span className="a-log-line">{logs[0] || '[System ready]'}</span>
          </div>
        </div>
      </div>

      {/* ── STATS DASHBOARD (matches home monitor-card grid) ── */}
      <div className="a-stats-grid">
        <div className="a-stat-card">
          <div className="asc-header"><span>TOTAL</span><span className="asc-val">{stats.totalAssessments}</span></div>
          <div className="asc-label">Assessments</div>
          <div className="asc-bar"><div className="asc-fill" style={{ width: '100%' }} /></div>
        </div>
        <div className="a-stat-card">
          <div className="asc-header"><span>ACTIVE NOW</span><span className="asc-val">{stats.activeNow}</span></div>
          <div className="asc-label">Running Sessions</div>
          <div className="asc-bar"><div className="asc-fill" style={{ width: `${(stats.activeNow / stats.totalAssessments) * 100}%` }} /></div>
        </div>
        <div className="a-stat-card">
          <div className="asc-header"><span>PARTICIPANTS</span><span className="asc-val">{stats.participants}</span></div>
          <div className="asc-label">Total Enrolled</div>
          <div className="asc-bar"><div className="asc-fill" style={{ width: '74%' }} /></div>
        </div>
        <div className="a-stat-card">
          <div className="asc-header"><span>AVG SCORE</span><span className="asc-val">{stats.avgScore}%</span></div>
          <div className="asc-label">Across Sessions</div>
          <div className="asc-bar"><div className="asc-fill" style={{ width: `${stats.avgScore}%` }} /></div>
        </div>
        <div className="a-stat-card">
          <div className="asc-header"><span>COMPLETED</span><span className="asc-val">{stats.completedToday}</span></div>
          <div className="asc-label">Today</div>
          <div className="asc-bar"><div className="asc-fill" style={{ width: '20%' }} /></div>
        </div>
        <div className="a-stat-card">
          <div className="asc-header"><span>PENDING</span><span className="asc-val">{stats.pendingReview}</span></div>
          <div className="asc-label">Needs Review</div>
          <div className="asc-bar"><div className="asc-fill" style={{ width: `${(stats.pendingReview / stats.participants) * 100}%` }} /></div>
        </div>
      </div>

      {/* ── MAIN PANEL ── */}
      <div className="a-main">

        {/* ── SIDEBAR ── */}
        <aside className="a-sidebar">
          <div className="a-sb-section">
            <div className="a-sb-title">NAVIGATION</div>
            {[
              { key: 'list', label: 'Assessment List' },
              { key: 'join', label: 'Join Session' },
              { key: 'create', label: 'Create Assessment' },
            ].map(item => (
              <button
                key={item.key}
                className={`a-sb-btn ${view === item.key ? 'a-sb-active' : ''}`}
                onClick={() => { setView(item.key as any); setStep(1) }}
              >
                <span className="a-sb-arrow">{view === item.key ? '▸' : '·'}</span>
                {item.label}
              </button>
            ))}
          </div>

          {/* Active Sessions Mini-Monitor */}
          <div className="a-sb-section">
            <div className="a-sb-title">ACTIVE SESSIONS</div>
            {assessments.filter(a => a.status === 'active').map(a => (
              <div key={a.id} className="a-sb-session">
                <div className="a-sb-sess-top">
                  <span className="a-sb-dot" />
                  <span className="a-sb-sess-name">{a.title.substring(0, 20)}{a.title.length > 20 ? '...' : ''}</span>
                </div>
                <div className="a-sb-sess-meta">
                  <span>{a.participants}/{a.maxParticipants} users</span>
                  <span className="a-sb-timer">{timeRemaining(a.endTime)}</span>
                </div>
                <div className="a-sb-sess-bar">
                  <div className="a-sb-sess-fill" style={{ width: `${(a.participants / a.maxParticipants) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>

          {/* System Log */}
          <div className="a-sb-section a-sb-log-section">
            <div className="a-sb-title">ACTIVITY LOG</div>
            <div className="a-sb-logs">
              {logs.length === 0 ? (
                <div className="a-sb-log-empty">[Awaiting activity]</div>
              ) : logs.map((l, i) => (
                <div key={i} className="a-sb-log">{l}</div>
              ))}
            </div>
          </div>
        </aside>

        {/* ── CONTENT AREA ── */}
        <div className="a-content">

          {/* ════════════════ LIST VIEW ════════════════ */}
          {view === 'list' && (
            <div className="a-list-view">
              {/* Toolbar */}
              <div className="a-toolbar">
                <div className="a-toolbar-left">
                  <input
                    className="a-search"
                    placeholder="Search by title or code..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="a-toolbar-right">
                  <div className="a-filters">
                    {(['all', 'active', 'scheduled', 'ended'] as const).map(f => (
                      <button key={f} className={`a-filter-btn ${filterStatus === f ? 'a-filter-active' : ''}`} onClick={() => setFilterStatus(f)}>
                        {f.toUpperCase()}
                      </button>
                    ))}
                  </div>
                  <div className="a-filters">
                    {(['all', 'easy', 'medium', 'hard'] as const).map(f => (
                      <button key={f} className={`a-filter-btn ${filterDiff === f ? 'a-filter-active' : ''}`} onClick={() => setFilterDiff(f)}>
                        {f.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Table Header */}
              <div className="a-table-header">
                <span>TITLE</span>
                <span>CODE</span>
                <span>CREATOR</span>
                <span>DIFF</span>
                <span>STATUS</span>
                <span>USERS</span>
                <span>TIME</span>
                <span>REMAINING</span>
                <span>SCORE</span>
                <span>ACTION</span>
              </div>

              {/* Table Rows */}
              <div className="a-table-body">
                {filteredAssessments.length === 0 && (
                  <div className="a-empty">No assessments match filters</div>
                )}
                {filteredAssessments.map(a => (
                  <div key={a.id} className="a-table-row">
                    <div className="a-row-title">
                      <span className="a-row-name">{a.title}</span>
                      <span className="a-row-cat">{a.category}</span>
                    </div>
                    <span className="a-row-code">{a.code}{a.isLocked ? ' ⬡' : ''}</span>
                    <span className="a-row-creator">{a.creator}</span>
                    <span className={`a-diff ${diffColor(a.difficulty)}`}>{a.difficulty.toUpperCase()}</span>
                    <span className={`a-status ${statusColor(a.status)}`}>{a.status.toUpperCase()}</span>
                    <span className="a-row-users">
                      {a.participants}/{a.maxParticipants}
                      <div className="a-mini-bar"><div className="a-mini-fill" style={{ width: `${(a.participants / a.maxParticipants) * 100}%` }} /></div>
                    </span>
                    <span className="a-row-time">{a.timeLimit}m</span>
                    <span className={`a-row-remain ${a.status === 'ended' ? 'a-ended' : ''}`}>
                      {a.status === 'active' ? timeRemaining(a.endTime) : a.status === 'scheduled' ? 'SOON' : 'ENDED'}
                    </span>
                    <span className="a-row-score">{a.avgScore > 0 ? `${a.avgScore}%` : '--'}</span>
                    <div className="a-row-actions">
                      <button className="a-act-btn a-act-view" onClick={() => { setSelectedAssessment(a); setView('preview') }}>
                        VIEW
                      </button>
                      {a.status !== 'ended' && (
                        <button className="a-act-btn a-act-join" onClick={() => { setJoinCode(a.code); setView('join') }}>
                          JOIN
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary Row */}
              <div className="a-table-footer">
                <span>SHOWING {filteredAssessments.length} / {assessments.length} ASSESSMENTS</span>
                <span>{filteredAssessments.filter(a => a.status === 'active').length} ACTIVE</span>
                <span>TOTAL PARTICIPANTS: {filteredAssessments.reduce((s, a) => s + a.participants, 0)}</span>
              </div>
            </div>
          )}

          {/* ════════════════ JOIN VIEW ════════════════ */}
          {view === 'join' && (
            <div className="a-join-view">
              <div className="a-view-title">JOIN SESSION</div>

              {/* Available sessions grid */}
              <div className="a-join-section-title">AVAILABLE SESSIONS ON LAN</div>
              <div className="a-join-grid">
                {assessments.filter(a => a.status !== 'ended').map(a => (
                  <div
                    key={a.id}
                    className={`a-join-card ${joinCode === a.code ? 'a-join-selected' : ''}`}
                    onClick={() => setJoinCode(a.code)}
                  >
                    <div className="ajc-top">
                      <div>
                        <div className="ajc-title">{a.title}</div>
                        <div className="ajc-code">{a.code}{a.isLocked ? ' — PRIVATE' : ' — PUBLIC'}</div>
                      </div>
                      <span className={`a-status ${statusColor(a.status)}`}>{a.status.toUpperCase()}</span>
                    </div>
                    <div className="ajc-meta">
                      <div className="ajc-row"><span>CREATOR</span><span>{a.creator}</span></div>
                      <div className="ajc-row"><span>CATEGORY</span><span>{a.category}</span></div>
                      <div className="ajc-row"><span>DIFFICULTY</span><span className={diffColor(a.difficulty)}>{a.difficulty.toUpperCase()}</span></div>
                      <div className="ajc-row"><span>TIME LIMIT</span><span>{a.timeLimit}m</span></div>
                      <div className="ajc-row"><span>QUESTIONS</span><span>{a.questions}</span></div>
                      <div className="ajc-row"><span>PARTICIPANTS</span><span>{a.participants}/{a.maxParticipants}</span></div>
                    </div>
                    <div className="ajc-bar-wrap">
                      <div className="ajc-bar"><div className="ajc-fill" style={{ width: `${(a.participants / a.maxParticipants) * 100}%` }} /></div>
                    </div>
                    {a.status === 'active' && (
                      <div className="ajc-remain">ENDS IN {timeRemaining(a.endTime)}</div>
                    )}
                  </div>
                ))}
              </div>

              {/* Manual join panel */}
              <div className="a-join-manual">
                <div className="a-join-section-title">ENTER CODE MANUALLY</div>
                <div className="a-join-form">
                  <div className="a-join-field">
                    <label>SESSION CODE</label>
                    <input
                      className="a-code-input"
                      placeholder="XXXXXX"
                      value={joinCode}
                      onChange={e => setJoinCode(e.target.value.toUpperCase())}
                      maxLength={6}
                    />
                  </div>
                  <div className="a-join-field">
                    <label>PASSWORD (IF LOCKED)</label>
                    <input
                      type="password"
                      className="a-code-input a-pass-input"
                      placeholder="••••"
                      value={joinPassword}
                      onChange={e => setJoinPassword(e.target.value)}
                    />
                  </div>
                  <button className="a-join-submit" onClick={handleJoin} disabled={!joinCode.trim()}>
                    JOIN SESSION
                  </button>
                </div>
                <div className="a-join-info">
                  <div className="a-info-row"><span>ENCRYPTION</span><span>AES-256-GCM</span></div>
                  <div className="a-info-row"><span>NETWORK</span><span>LAN / WebSocket</span></div>
                  <div className="a-info-row"><span>BLOCKCHAIN</span><span>HASH VERIFIED</span></div>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════ PREVIEW VIEW ════════════════ */}
          {view === 'preview' && selectedAssessment && (
            <div className="a-preview-view">
              <div className="a-preview-header">
                <div>
                  <div className="a-view-title">{selectedAssessment.title}</div>
                  <div className="a-preview-sub">{selectedAssessment.description}</div>
                </div>
                <button className="a-back-btn" onClick={() => setView('list')}>BACK TO LIST</button>
              </div>

              <div className="a-preview-grid">
                {/* Left: Details */}
                <div className="a-preview-details">
                  <div className="a-pd-title">SESSION DETAILS</div>
                  {[
                    ['CODE', selectedAssessment.code],
                    ['CREATOR', selectedAssessment.creator],
                    ['CATEGORY', selectedAssessment.category],
                    ['DIFFICULTY', selectedAssessment.difficulty.toUpperCase()],
                    ['STATUS', selectedAssessment.status.toUpperCase()],
                    ['TIME LIMIT', `${selectedAssessment.timeLimit} minutes`],
                    ['QUESTIONS', selectedAssessment.questions.toString()],
                    ['TOTAL POINTS', selectedAssessment.totalPoints.toString()],
                    ['MAX PARTICIPANTS', selectedAssessment.maxParticipants.toString()],
                    ['ENROLLED', `${selectedAssessment.participants} students`],
                    ['AVG SCORE', selectedAssessment.avgScore > 0 ? `${selectedAssessment.avgScore}%` : 'N/A'],
                    ['LOCKED', selectedAssessment.isLocked ? 'YES' : 'NO'],
                  ].map(([k, v]) => (
                    <div key={k} className="a-pd-row">
                      <span>{k}</span>
                      <span>{v}</span>
                    </div>
                  ))}
                </div>

                {/* Right: Stats + Actions */}
                <div className="a-preview-right">
                  <div className="a-preview-stats">
                    <div className="a-pd-title">LIVE METRICS</div>
                    <div className="a-ps-grid">
                      <div className="a-ps-card">
                        <span>ENROLLED</span>
                        <span>{selectedAssessment.participants}</span>
                      </div>
                      <div className="a-ps-card">
                        <span>CAPACITY</span>
                        <span>{Math.round((selectedAssessment.participants / selectedAssessment.maxParticipants) * 100)}%</span>
                      </div>
                      <div className="a-ps-card">
                        <span>AVG SCORE</span>
                        <span>{selectedAssessment.avgScore > 0 ? `${selectedAssessment.avgScore}%` : '--'}</span>
                      </div>
                      <div className="a-ps-card">
                        <span>REMAINING</span>
                        <span>
                          {selectedAssessment.status === 'active'
                            ? timeRemaining(selectedAssessment.endTime)
                            : selectedAssessment.status === 'ended' ? 'ENDED' : 'UPCOMING'}
                        </span>
                      </div>
                    </div>
                    <div className="a-ps-bar-label">ENROLLMENT CAPACITY</div>
                    <div className="a-ps-bar">
                      <div className="a-ps-fill" style={{ width: `${(selectedAssessment.participants / selectedAssessment.maxParticipants) * 100}%` }} />
                    </div>
                    {selectedAssessment.avgScore > 0 && (
                      <>
                        <div className="a-ps-bar-label">AVG SCORE</div>
                        <div className="a-ps-bar">
                          <div className="a-ps-fill" style={{ width: `${selectedAssessment.avgScore}%` }} />
                        </div>
                      </>
                    )}
                  </div>

                  <div className="a-preview-actions">
                    <div className="a-pd-title">ACTIONS</div>
                    {selectedAssessment.status !== 'ended' && (
                      <button className="a-pact-btn primary" onClick={() => { setJoinCode(selectedAssessment.code); setView('join') }}>
                        JOIN THIS SESSION
                      </button>
                    )}
                    <button className="a-pact-btn secondary">
                      EXPORT RESULTS
                    </button>
                    <button className="a-pact-btn secondary">
                      VIEW PARTICIPANTS
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════ CREATE VIEW ════════════════ */}
          {view === 'create' && (
            <div className="a-create-view">
              <div className="a-view-title">CREATE ASSESSMENT</div>

              {/* Step Progress */}
              <div className="a-steps">
                {[
                  { n: 1, label: 'BASIC INFO' },
                  { n: 2, label: 'QUESTIONS' },
                  { n: 3, label: 'SETTINGS' },
                  { n: 4, label: 'REVIEW' },
                  { n: 5, label: 'PUBLISHED' },
                ].map(s => (
                  <div key={s.n} className={`a-step ${step >= s.n ? 'a-step-done' : ''} ${step === s.n ? 'a-step-active' : ''}`}>
                    <div className="a-step-num">{s.n}</div>
                    <div className="a-step-label">{s.label}</div>
                    {s.n < 5 && <div className="a-step-line" />}
                  </div>
                ))}
              </div>

              {/* ── STEP 1: Basic Info ── */}
              {step === 1 && (
                <div className="a-step-body">
                  <div className="a-form-grid">
                    <div className="a-field">
                      <label>ASSESSMENT TITLE</label>
                      <input className="a-input" value={draftTitle} onChange={e => setDraftTitle(e.target.value)} placeholder="e.g., Data Structures Mid-term" />
                    </div>
                    <div className="a-field">
                      <label>CATEGORY</label>
                      <select className="a-input" value={draftCategory} onChange={e => setDraftCategory(e.target.value)}>
                        {['General', 'Data Structures', 'Algorithms', 'Web Dev', 'Databases', 'OOP', 'Networks', 'OS'].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div className="a-field a-field-full">
                      <label>DESCRIPTION</label>
                      <textarea className="a-input a-textarea" rows={3} value={draftDesc} onChange={e => setDraftDesc(e.target.value)} placeholder="Brief description of the assessment..." />
                    </div>
                    <div className="a-field">
                      <label>TIME LIMIT (MINUTES)</label>
                      <input className="a-input" type="number" min={5} max={300} value={draftTimeLimit} onChange={e => setDraftTimeLimit(+e.target.value)} />
                    </div>
                    <div className="a-field">
                      <label>MAX PARTICIPANTS</label>
                      <input className="a-input" type="number" min={1} max={200} value={draftMaxParticipants} onChange={e => setDraftMaxParticipants(+e.target.value)} />
                    </div>
                    <div className="a-field">
                      <label>DIFFICULTY</label>
                      <select className="a-input" value={draftDifficulty} onChange={e => setDraftDifficulty(e.target.value as any)}>
                        <option value="easy">EASY</option>
                        <option value="medium">MEDIUM</option>
                        <option value="hard">HARD</option>
                      </select>
                    </div>
                    <div className="a-field">
                      <label>PASSING SCORE (%)</label>
                      <input className="a-input" type="number" min={0} max={100} value={draftPassingScore} onChange={e => setDraftPassingScore(+e.target.value)} />
                    </div>
                  </div>
                </div>
              )}

              {/* ── STEP 2: Questions ── */}
              {step === 2 && (
                <div className="a-step-body a-questions-layout">
                  {/* Question List */}
                  <div className="a-q-list">
                    <div className="a-ql-title">QUESTIONS ({questions.length})</div>
                    {questions.length === 0 && <div className="a-ql-empty">No questions yet</div>}
                    {questions.map((q, idx) => (
                      <div key={q.id} className="a-ql-item">
                        <div className="a-ql-num">Q{idx + 1}</div>
                        <div className="a-ql-info">
                          <div className="a-ql-text">{q.text.substring(0, 40)}{q.text.length > 40 ? '...' : ''}</div>
                          <div className="a-ql-meta">
                            <span>{q.type.toUpperCase()}</span>
                            <span>{q.points}pts</span>
                            <span className={diffColor(q.difficulty || 'medium')}>{(q.difficulty || 'medium').toUpperCase()}</span>
                          </div>
                        </div>
                        <button className="a-ql-remove" onClick={() => removeQuestion(q.id)}>×</button>
                      </div>
                    ))}
                    {questions.length > 0 && (
                      <div className="a-ql-summary">
                        <span>TOTAL: {questions.reduce((s, q) => s + q.points, 0)} PTS</span>
                        <span>{questions.length} QUESTIONS</span>
                      </div>
                    )}
                  </div>

                  {/* Question Editor */}
                  <div className="a-q-editor">
                    <div className="a-ql-title">ADD QUESTION</div>

                    <div className="a-form-grid">
                      <div className="a-field">
                        <label>TYPE</label>
                        <select className="a-input" value={editingQuestion.type} onChange={e => setEditingQuestion({ ...editingQuestion, type: e.target.value as any, options: e.target.value === 'mcq' ? ['', '', '', ''] : undefined })}>
                          <option value="mcq">MULTIPLE CHOICE</option>
                          <option value="true-false">TRUE / FALSE</option>
                          <option value="short-answer">SHORT ANSWER</option>
                          <option value="coding">CODING</option>
                        </select>
                      </div>
                      <div className="a-field">
                        <label>DIFFICULTY</label>
                        <select className="a-input" value={editingQuestion.difficulty} onChange={e => setEditingQuestion({ ...editingQuestion, difficulty: e.target.value as any })}>
                          <option value="easy">EASY</option>
                          <option value="medium">MEDIUM</option>
                          <option value="hard">HARD</option>
                        </select>
                      </div>
                      <div className="a-field">
                        <label>POINTS</label>
                        <input className="a-input" type="number" min={1} max={100} value={editingQuestion.points} onChange={e => setEditingQuestion({ ...editingQuestion, points: +e.target.value })} />
                      </div>
                      <div className="a-field a-field-full">
                        <label>QUESTION TEXT</label>
                        <textarea className="a-input a-textarea" rows={2} value={editingQuestion.text} onChange={e => setEditingQuestion({ ...editingQuestion, text: e.target.value })} placeholder="Enter question..." />
                      </div>
                    </div>

                    {/* MCQ Options */}
                    {editingQuestion.type === 'mcq' && (
                      <div className="a-qbuilder">
                        <div className="a-qb-title">OPTIONS — SELECT CORRECT ANSWER</div>
                        {(editingQuestion.options || ['', '', '', '']).map((opt, idx) => (
                          <div key={idx} className="a-opt-row">
                            <input
                              type="radio"
                              name="correct"
                              className="a-radio"
                              checked={editingQuestion.correctAnswer === idx.toString()}
                              onChange={() => setEditingQuestion({ ...editingQuestion, correctAnswer: idx.toString() })}
                            />
                            <span className="a-opt-label">OPTION {String.fromCharCode(65 + idx)}</span>
                            <input
                              className="a-input a-opt-input"
                              value={opt}
                              placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                              onChange={e => {
                                const opts = [...(editingQuestion.options || [])]
                                opts[idx] = e.target.value
                                setEditingQuestion({ ...editingQuestion, options: opts })
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* True/False */}
                    {editingQuestion.type === 'true-false' && (
                      <div className="a-qbuilder">
                        <div className="a-qb-title">CORRECT ANSWER</div>
                        <div className="a-tf-row">
                          {['true', 'false'].map(v => (
                            <button
                              key={v}
                              className={`a-tf-btn ${editingQuestion.correctAnswer === v ? 'a-tf-active' : ''}`}
                              onClick={() => setEditingQuestion({ ...editingQuestion, correctAnswer: v })}
                            >
                              {v.toUpperCase()}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Short Answer */}
                    {editingQuestion.type === 'short-answer' && (
                      <div className="a-qbuilder">
                        <div className="a-qb-title">EXPECTED ANSWER</div>
                        <textarea
                          className="a-input a-textarea"
                          rows={3}
                          value={editingQuestion.correctAnswer as string}
                          onChange={e => setEditingQuestion({ ...editingQuestion, correctAnswer: e.target.value })}
                          placeholder="Enter expected answer..."
                        />
                      </div>
                    )}

                    {/* Coding */}
                    {editingQuestion.type === 'coding' && (
                      <div className="a-qbuilder">
                        <div className="a-qb-title">CODE TEMPLATE</div>
                        <textarea
                          className="a-input a-textarea a-code-area"
                          rows={4}
                          value={editingQuestion.codeTemplate}
                          onChange={e => setEditingQuestion({ ...editingQuestion, codeTemplate: e.target.value })}
                          placeholder="function solution() { ... }"
                        />
                        <div className="a-qb-title" style={{ marginTop: 10 }}>TEST CASES</div>
                        {(editingQuestion.testCases || []).map((tc, idx) => (
                          <div key={idx} className="a-tc-row">
                            <div className="a-tc-field">
                              <label>INPUT</label>
                              <input className="a-input" value={tc.input} placeholder="Input" onChange={e => {
                                const tcs = [...(editingQuestion.testCases || [])]
                                tcs[idx] = { ...tc, input: e.target.value }
                                setEditingQuestion({ ...editingQuestion, testCases: tcs })
                              }} />
                            </div>
                            <div className="a-tc-field">
                              <label>OUTPUT</label>
                              <input className="a-input" value={tc.expectedOutput} placeholder="Expected Output" onChange={e => {
                                const tcs = [...(editingQuestion.testCases || [])]
                                tcs[idx] = { ...tc, expectedOutput: e.target.value }
                                setEditingQuestion({ ...editingQuestion, testCases: tcs })
                              }} />
                            </div>
                            <div className="a-tc-field a-tc-wt">
                              <label>WT</label>
                              <input className="a-input" type="number" min={1} max={10} value={tc.weight} onChange={e => {
                                const tcs = [...(editingQuestion.testCases || [])]
                                tcs[idx] = { ...tc, weight: +e.target.value }
                                setEditingQuestion({ ...editingQuestion, testCases: tcs })
                              }} />
                            </div>
                            <button className="a-tc-rm" onClick={() => setEditingQuestion({ ...editingQuestion, testCases: editingQuestion.testCases?.filter((_, i) => i !== idx) })}>×</button>
                          </div>
                        ))}
                        <button className="a-add-tc" onClick={() => setEditingQuestion({ ...editingQuestion, testCases: [...(editingQuestion.testCases || []), { input: '', expectedOutput: '', weight: 1 }] })}>
                          + ADD TEST CASE
                        </button>
                      </div>
                    )}

                    {/* Explanation */}
                    <div className="a-field" style={{ marginTop: 10 }}>
                      <label>EXPLANATION (OPTIONAL)</label>
                      <input className="a-input" value={editingQuestion.explanation || ''} onChange={e => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })} placeholder="Explanation shown after submission..." />
                    </div>

                    <button className="a-add-q-btn" onClick={addQuestion} disabled={!editingQuestion.text.trim()}>
                      + ADD QUESTION
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP 3: Settings ── */}
              {step === 3 && (
                <div className="a-step-body">
                  <div className="a-settings-grid">
                    {[
                      { label: 'SHUFFLE QUESTIONS', sub: 'Randomize question order per student', val: draftShuffle, set: setDraftShuffle },
                      { label: 'SHUFFLE OPTIONS', sub: 'Randomize MCQ option order', val: draftShuffleOpts, set: setDraftShuffleOpts },
                      { label: 'ALLOW RETAKES', sub: 'Students can attempt multiple times', val: draftAllowRetake, set: setDraftAllowRetake },
                      { label: 'PROCTORING', sub: 'Enable tab-switch detection', val: draftProctoring, set: setDraftProctoring },
                      { label: 'NEGATIVE MARKING', sub: 'Deduct points for wrong answers', val: draftNegativeMarking, set: setDraftNegativeMarking },
                      { label: 'LOCKED SESSION', sub: 'Require password to join', val: draftLocked, set: setDraftLocked },
                      { label: 'LATE CUTOFF', sub: 'Block join after session starts', val: draftCutoffTime, set: setDraftCutoffTime },
                    ].map(s => (
                      <div key={s.label} className="a-setting-card">
                        <div className="a-sc-info">
                          <div className="a-sc-label">{s.label}</div>
                          <div className="a-sc-sub">{s.sub}</div>
                        </div>
                        <button
                          className={`a-toggle ${s.val ? 'a-toggle-on' : ''}`}
                          onClick={() => s.set(!s.val)}
                        >
                          <span className="a-toggle-knob" />
                        </button>
                      </div>
                    ))}

                    <div className="a-setting-card a-setting-select">
                      <div className="a-sc-info">
                        <div className="a-sc-label">SHOW RESULTS</div>
                        <div className="a-sc-sub">When to display scores to students</div>
                      </div>
                      <select className="a-input a-setting-sel-input" value={draftShowResults} onChange={e => setDraftShowResults(e.target.value as any)}>
                        <option value="immediately">IMMEDIATELY</option>
                        <option value="after-end">AFTER SESSION ENDS</option>
                        <option value="never">NEVER</option>
                      </select>
                    </div>

                    {draftAllowRetake && (
                      <div className="a-setting-card a-setting-select">
                        <div className="a-sc-info">
                          <div className="a-sc-label">MAX ATTEMPTS</div>
                          <div className="a-sc-sub">Maximum retake count</div>
                        </div>
                        <input className="a-input a-setting-sel-input" type="number" min={1} max={10} value={draftMaxAttempts} onChange={e => setDraftMaxAttempts(+e.target.value)} />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── STEP 4: Review ── */}
              {step === 4 && (
                <div className="a-step-body">
                  <div className="a-review-grid">
                    <div className="a-review-panel">
                      <div className="a-pd-title">ASSESSMENT SUMMARY</div>
                      {[
                        ['TITLE', draftTitle || '(not set)'],
                        ['DESCRIPTION', draftDesc || '(not set)'],
                        ['CATEGORY', draftCategory],
                        ['DIFFICULTY', draftDifficulty.toUpperCase()],
                        ['TIME LIMIT', `${draftTimeLimit} minutes`],
                        ['MAX PARTICIPANTS', draftMaxParticipants.toString()],
                        ['TOTAL QUESTIONS', questions.length.toString()],
                        ['TOTAL POINTS', questions.reduce((s, q) => s + q.points, 0).toString()],
                        ['PASSING SCORE', `${draftPassingScore}%`],
                      ].map(([k, v]) => (
                        <div key={k} className="a-pd-row">
                          <span>{k}</span>
                          <span>{v}</span>
                        </div>
                      ))}
                    </div>
                    <div className="a-review-panel">
                      <div className="a-pd-title">SETTINGS SUMMARY</div>
                      {[
                        ['SHUFFLE QUESTIONS', draftShuffle ? 'YES' : 'NO'],
                        ['SHUFFLE OPTIONS', draftShuffleOpts ? 'YES' : 'NO'],
                        ['ALLOW RETAKES', draftAllowRetake ? `YES (${draftMaxAttempts}x)` : 'NO'],
                        ['PROCTORING', draftProctoring ? 'ENABLED' : 'DISABLED'],
                        ['NEGATIVE MARKING', draftNegativeMarking ? 'ENABLED' : 'DISABLED'],
                        ['LOCKED', draftLocked ? 'YES — PASSWORD PROTECTED' : 'NO — OPEN'],
                        ['LATE CUTOFF', draftCutoffTime ? 'YES' : 'NO'],
                        ['SHOW RESULTS', draftShowResults.toUpperCase()],
                      ].map(([k, v]) => (
                        <div key={k} className="a-pd-row">
                          <span>{k}</span>
                          <span>{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Question preview */}
                  {questions.length > 0 && (
                    <div className="a-review-questions">
                      <div className="a-pd-title">QUESTION OVERVIEW</div>
                      <div className="a-rq-header">
                        <span>NUM</span><span>TYPE</span><span>QUESTION</span><span>DIFF</span><span>PTS</span>
                      </div>
                      {questions.map((q, i) => (
                        <div key={q.id} className="a-rq-row">
                          <span>Q{i + 1}</span>
                          <span>{q.type.toUpperCase()}</span>
                          <span className="a-rq-text">{q.text.substring(0, 60)}{q.text.length > 60 ? '...' : ''}</span>
                          <span className={diffColor(q.difficulty || 'medium')}>{(q.difficulty || 'medium').toUpperCase()}</span>
                          <span>{q.points}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="a-review-note">
                    After publishing, you will receive a session code and password to share with students.
                    The assessment will appear in the Available Sessions list immediately.
                  </div>
                </div>
              )}

              {/* ── STEP 5: Published ── */}
              {step === 5 && (
                <div className="a-step-body a-published">
                  <div className="a-pub-title">ASSESSMENT PUBLISHED</div>
                  <div className="a-pub-sub">Share these credentials with your students</div>
                  <div className="a-pub-creds">
                    <div className="a-pub-cred">
                      <span>SESSION CODE</span>
                      <span className="a-pub-code">{generatedCode}</span>
                    </div>
                    <div className="a-pub-cred">
                      <span>PASSWORD</span>
                      <span className="a-pub-pass">{generatedPass}</span>
                    </div>
                  </div>
                  <div className="a-pub-details">
                    <div className="a-pd-row"><span>TITLE</span><span>{draftTitle}</span></div>
                    <div className="a-pd-row"><span>QUESTIONS</span><span>{questions.length}</span></div>
                    <div className="a-pd-row"><span>TOTAL POINTS</span><span>{questions.reduce((s, q) => s + q.points, 0)}</span></div>
                    <div className="a-pd-row"><span>TIME LIMIT</span><span>{draftTimeLimit} min</span></div>
                    <div className="a-pd-row"><span>MAX PARTICIPANTS</span><span>{draftMaxParticipants}</span></div>
                  </div>
                  <div className="a-pub-actions">
                    <button className="a-pact-btn primary" onClick={() => { setView('list'); setStep(1) }}>
                      VIEW IN LIST
                    </button>
                    <button className="a-pact-btn secondary" onClick={() => { setView('create'); setStep(1); setDraftTitle(''); setDraftDesc(''); setQuestions([]) }}>
                      CREATE ANOTHER
                    </button>
                  </div>
                </div>
              )}

              {/* Step Navigation */}
              {step < 5 && (
                <div className="a-step-nav">
                  <button className="a-nav-btn secondary" onClick={() => setStep(s => s - 1)} disabled={step === 1}>
                    PREVIOUS
                  </button>
                  <div className="a-step-indicator">STEP {step} / 4</div>
                  {step < 4 ? (
                    <button className="a-nav-btn primary" onClick={() => setStep(s => s + 1)} disabled={step === 1 && !draftTitle.trim()}>
                      NEXT
                    </button>
                  ) : (
                    <button className="a-nav-btn primary" onClick={handleCreate} disabled={!draftTitle.trim()}>
                      PUBLISH ASSESSMENT
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* ── SCAN LINE EFFECT (matching Home) ── */}
      <div className="a-scan-line" />

      {/* ══════════════════════════════════════════════════════════════
          STYLES — matching Home page terminal aesthetic exactly
      ══════════════════════════════════════════════════════════════ */}
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }

        /* ── ROOT ── */
        .aroot {
          min-height: calc(100vh - 56px);
          background: #030303;
          color: #ffffff;
          font-family: 'SF Mono', 'Monaco', 'Fira Code', monospace;
          font-size: 11px;
          display: flex;
          flex-direction: column;
          gap: 1px;
          position: relative;
          overflow-x: hidden;
          overflow-y: auto;
        }

        /* Scrollbar — identical to Home */
        .aroot::-webkit-scrollbar { width: 4px; }
        .aroot::-webkit-scrollbar-track { background: #111; }
        .aroot::-webkit-scrollbar-thumb { background: #222; }
        .aroot::-webkit-scrollbar-thumb:hover { background: #1e3a5f; }
        * { scrollbar-width: thin; scrollbar-color: #222 #111; }

        /* ── PAGE HEADER — matches ascii-header from Home ── */
        .a-page-header {
          background: #0a0a0a;
          border: 1px solid #1e3a5f;
          padding: 12px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: relative;
          overflow: hidden;
          flex-shrink: 0;
        }
        .a-page-header::before {
          content: '';
          position: absolute;
          top: 0; left: -100%; width: 100%; height: 2px;
          background: linear-gradient(90deg, transparent, #1e3a5f, transparent);
          animation: scanline 3s linear infinite;
        }
        @keyframes scanline { 0%{left:-100%} 100%{left:100%} }

        .a-page-title {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .a-title-text {
          color: #1e3a5f;
          font-size: 18px;
          font-weight: 700;
          letter-spacing: 3px;
          text-shadow: 0 0 8px #1e3a5f;
        }
        .a-title-sub {
          font-size: 8px;
          color: #ffffff;
          opacity: 0.35;
          letter-spacing: 2px;
        }
        .a-page-meta {
          display: flex;
          align-items: center;
          gap: 14px;
          background: #050505;
          padding: 6px 12px;
          border: 1px solid #1e3a5f;
        }
        .a-version { color: #1e3a5f; font-size: 9px; }
        .a-time { color: #ffffff; font-size: 10px; }
        .a-log-box { border-left: 1px solid #1e3a5f; padding-left: 12px; }
        .a-log-line { color: #ffffff; font-size: 9px; opacity: 0.7; animation: fadeIn 0.3s ease; }
        @keyframes fadeIn { from{opacity:0;transform:translateX(8px)} to{opacity:1;transform:translateX(0)} }

        /* ── STATS GRID — matches dashboard from Home ── */
        .a-stats-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 1px;
          background: #1e3a5f;
          border: 1px solid #1e3a5f;
          flex-shrink: 0;
        }
        .a-stat-card {
          background: #0a0a0a;
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .a-stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 18px rgba(30,58,95,0.3);
        }
        .asc-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 5px;
          border-bottom: 1px solid #1e3a5f;
        }
        .asc-header span:first-child { font-size: 9px; opacity: 0.6; letter-spacing: 0.5px; }
        .asc-val { font-size: 14px; font-weight: 700; }
        .asc-label { font-size: 8px; opacity: 0.4; }
        .asc-bar { height: 2px; background: #1a1a1a; overflow: hidden; }
        .asc-fill { height: 100%; background: #1e3a5f; transition: width 0.5s; }

        /* ── MAIN LAYOUT ── */
        .a-main {
          display: flex;
          flex: 1;
          gap: 1px;
          background: #1e3a5f;
          border: 1px solid #1e3a5f;
          min-height: 0;
        }

        /* ── SIDEBAR ── */
        .a-sidebar {
          width: 260px;
          min-width: 260px;
          background: #0a0a0a;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
        }
        .a-sidebar::-webkit-scrollbar { width: 4px; }
        .a-sidebar::-webkit-scrollbar-track { background: #111; }
        .a-sidebar::-webkit-scrollbar-thumb { background: #222; }
        .a-sidebar::-webkit-scrollbar-thumb:hover { background: #1e3a5f; }

        .a-sb-section {
          padding: 12px 14px;
          border-bottom: 1px solid #1e3a5f;
          flex-shrink: 0;
        }
        .a-sb-title {
          font-size: 7px;
          letter-spacing: 1.5px;
          opacity: 0.35;
          margin-bottom: 8px;
        }
        .a-sb-btn {
          width: 100%;
          background: none;
          border: none;
          color: #fff;
          font-family: inherit;
          font-size: 10px;
          padding: 7px 0;
          text-align: left;
          cursor: pointer;
          opacity: 0.5;
          display: flex;
          align-items: center;
          gap: 7px;
          transition: opacity 0.15s;
          border-bottom: 1px dotted #111;
        }
        .a-sb-btn:hover { opacity: 0.85; }
        .a-sb-btn.a-sb-active { opacity: 1; }
        .a-sb-arrow { color: #1e3a5f; font-size: 10px; width: 10px; }

        .a-sb-session {
          padding: 6px 0;
          border-bottom: 1px dotted #111;
        }
        .a-sb-sess-top { display: flex; align-items: center; gap: 6px; margin-bottom: 3px; }
        .a-sb-dot { width: 5px; height: 5px; border-radius: 50%; background: #4a90d9; flex-shrink: 0; animation: blink 2s infinite; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .a-sb-sess-name { font-size: 9px; }
        .a-sb-sess-meta { display: flex; justify-content: space-between; font-size: 7px; opacity: 0.45; margin-bottom: 3px; }
        .a-sb-timer { color: #6ab4ff; }
        .a-sb-sess-bar { height: 2px; background: #111; }
        .a-sb-sess-fill { height: 100%; background: #1e3a5f; transition: width 0.5s; }

        .a-sb-log-section { flex: 1; }
        .a-sb-logs { display: flex; flex-direction: column; gap: 2px; max-height: 160px; overflow-y: auto; }
        .a-sb-log { font-size: 8px; opacity: 0.5; padding: 2px 0; border-bottom: 1px dotted #0d0d0d; font-family: monospace; }
        .a-sb-log-empty { font-size: 8px; opacity: 0.2; font-style: italic; }

        /* ── CONTENT ── */
        .a-content {
          flex: 1;
          background: #0a0a0a;
          overflow-y: auto;
          padding: 20px;
          min-width: 0;
        }
        .a-content::-webkit-scrollbar { width: 4px; }
        .a-content::-webkit-scrollbar-track { background: #111; }
        .a-content::-webkit-scrollbar-thumb { background: #222; }
        .a-content::-webkit-scrollbar-thumb:hover { background: #1e3a5f; }

        .a-view-title {
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 2px;
          margin-bottom: 16px;
          border-left: 3px solid #1e3a5f;
          padding-left: 10px;
        }

        /* ── TOOLBAR ── */
        .a-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }
        .a-toolbar-right { display: flex; gap: 8px; flex-wrap: wrap; }
        .a-search {
          background: #0e0e0e;
          border: 1px solid #1e3a5f;
          color: #fff;
          padding: 6px 12px;
          font-size: 10px;
          font-family: inherit;
          outline: none;
          width: 220px;
          transition: border-color 0.2s;
        }
        .a-search:focus { border-color: rgba(255,255,255,0.3); }
        .a-search::placeholder { opacity: 0.28; }
        .a-filters { display: flex; gap: 3px; }
        .a-filter-btn {
          background: none;
          border: 1px solid #141414;
          color: #fff;
          opacity: 0.4;
          font-size: 7px;
          padding: 3px 8px;
          cursor: pointer;
          font-family: inherit;
          letter-spacing: 0.5px;
          transition: all 0.15s;
        }
        .a-filter-btn:hover { opacity: 0.75; }
        .a-filter-btn.a-filter-active { opacity: 1; border-color: #1e3a5f; background: rgba(30,58,95,0.18); }

        /* ── TABLE ── */
        .a-table-header {
          display: grid;
          grid-template-columns: 2fr 80px 100px 60px 80px 90px 50px 90px 60px 100px;
          gap: 0;
          padding: 6px 10px;
          background: #070707;
          border: 1px solid #1e3a5f;
          border-bottom: none;
          font-size: 7px;
          letter-spacing: 1px;
          opacity: 0.45;
        }
        .a-table-body { border: 1px solid #1e3a5f; }
        .a-table-row {
          display: grid;
          grid-template-columns: 2fr 80px 100px 60px 80px 90px 50px 90px 60px 100px;
          gap: 0;
          padding: 9px 10px;
          border-bottom: 1px solid #0d0d0d;
          align-items: center;
          font-size: 9px;
          transition: background 0.15s;
          cursor: default;
        }
        .a-table-row:hover { background: #0e0e0e; }
        .a-table-row:last-child { border-bottom: none; }
        .a-empty { padding: 30px; text-align: center; opacity: 0.25; font-size: 10px; }

        .a-row-title { display: flex; flex-direction: column; gap: 2px; }
        .a-row-name { font-size: 10px; }
        .a-row-cat { font-size: 7px; opacity: 0.35; }
        .a-row-code { font-family: monospace; font-size: 9px; opacity: 0.75; }
        .a-row-creator { font-size: 8px; opacity: 0.6; }

        .a-diff { font-size: 7px; padding: 2px 5px; border-radius: 1px; }
        .diff-easy { background: rgba(74,144,80,0.25); color: #6dba72; }
        .diff-med  { background: rgba(200,150,50,0.2); color: #c8964a; }
        .diff-hard { background: rgba(180,60,60,0.2); color: #c86060; }

        .a-status { font-size: 7px; padding: 2px 5px; border-radius: 1px; }
        .stat-active { background: rgba(30,58,95,0.4); color: #6ab4ff; }
        .stat-sched  { background: rgba(200,150,50,0.2); color: #c8964a; }
        .stat-ended  { background: rgba(80,80,80,0.3); color: #888; }

        .a-row-users { display: flex; flex-direction: column; gap: 2px; }
        .a-mini-bar { height: 2px; background: #1a1a1a; }
        .a-mini-fill { height: 100%; background: #1e3a5f; }
        .a-row-time { font-size: 9px; }
        .a-row-remain { font-size: 8px; font-family: monospace; }
        .a-ended { opacity: 0.35; }
        .a-row-score { font-size: 9px; }
        .a-row-actions { display: flex; gap: 5px; }
        .a-act-btn { background: none; border: 1px solid #1a1a1a; color: #fff; font-size: 7px; padding: 3px 7px; cursor: pointer; font-family: inherit; letter-spacing: 0.5px; transition: all 0.15s; }
        .a-act-view:hover { border-color: #1e3a5f; background: rgba(30,58,95,0.2); }
        .a-act-join { background: #1e3a5f; border-color: #1e3a5f; }
        .a-act-join:hover { background: #2a4a7a; }

        .a-table-footer {
          display: flex;
          gap: 24px;
          padding: 6px 10px;
          background: #070707;
          border: 1px solid #1e3a5f;
          border-top: none;
          font-size: 7px;
          opacity: 0.35;
          letter-spacing: 0.5px;
        }

        /* ── JOIN VIEW ── */
        .a-join-view { display: flex; flex-direction: column; gap: 16px; }
        .a-join-section-title { font-size: 8px; letter-spacing: 1.5px; opacity: 0.35; margin-bottom: 8px; }
        .a-join-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-bottom: 4px;
        }
        .a-join-card {
          background: #0e0e0e;
          border: 1px solid #1a1a1a;
          padding: 12px;
          cursor: pointer;
          transition: border-color 0.15s;
        }
        .a-join-card:hover { border-color: #1e3a5f; }
        .a-join-selected { border-color: #1e3a5f !important; background: rgba(30,58,95,0.1); }
        .ajc-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
        .ajc-title { font-size: 10px; font-weight: 600; margin-bottom: 2px; }
        .ajc-code { font-size: 7px; opacity: 0.4; font-family: monospace; }
        .ajc-meta { display: flex; flex-direction: column; gap: 2px; margin-bottom: 6px; }
        .ajc-row { display: flex; justify-content: space-between; font-size: 7px; padding: 2px 0; border-bottom: 1px dotted #0d0d0d; }
        .ajc-row span:first-child { opacity: 0.4; }
        .ajc-bar-wrap { margin-bottom: 4px; }
        .ajc-bar { height: 2px; background: #1a1a1a; }
        .ajc-fill { height: 100%; background: #1e3a5f; transition: width 0.5s; }
        .ajc-remain { font-size: 7px; color: #6ab4ff; text-align: right; }

        .a-join-manual {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          padding: 16px;
          background: #070707;
          border: 1px solid #1e3a5f;
        }
        .a-join-form { display: flex; flex-direction: column; gap: 10px; }
        .a-join-field { display: flex; flex-direction: column; gap: 4px; }
        .a-join-field label { font-size: 7px; opacity: 0.45; letter-spacing: 1px; }
        .a-code-input {
          background: #0e0e0e; border: 1px solid #1e3a5f; color: #fff;
          padding: 9px 12px; font-size: 14px; font-family: monospace;
          letter-spacing: 4px; text-align: center; outline: none; width: 100%;
        }
        .a-code-input:focus { border-color: #fff; }
        .a-pass-input { font-size: 12px; letter-spacing: 2px; }
        .a-join-submit {
          background: #1e3a5f; border: none; color: #fff;
          padding: 10px; font-size: 10px; cursor: pointer;
          font-family: inherit; letter-spacing: 1px; transition: background 0.2s; margin-top: 4px;
        }
        .a-join-submit:hover:not(:disabled) { background: #2a4a7a; }
        .a-join-submit:disabled { opacity: 0.35; cursor: not-allowed; }
        .a-join-info { display: flex; flex-direction: column; gap: 4px; justify-content: center; }
        .a-info-row { display: flex; justify-content: space-between; font-size: 8px; padding: 4px 0; border-bottom: 1px dotted #111; }
        .a-info-row span:first-child { opacity: 0.4; }

        /* ── PREVIEW VIEW ── */
        .a-preview-view { display: flex; flex-direction: column; gap: 16px; }
        .a-preview-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px; }
        .a-preview-sub { font-size: 9px; opacity: 0.45; margin-top: 4px; }
        .a-back-btn {
          background: none; border: 1px solid #1a1a1a; color: #fff;
          padding: 5px 12px; font-size: 8px; cursor: pointer; font-family: inherit;
          letter-spacing: 0.5px; transition: border-color 0.2s; flex-shrink: 0; white-space: nowrap;
        }
        .a-back-btn:hover { border-color: #1e3a5f; }
        .a-preview-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .a-preview-details, .a-preview-right { display: flex; flex-direction: column; gap: 8px; }
        .a-pd-title { font-size: 8px; letter-spacing: 1.5px; opacity: 0.35; margin-bottom: 4px; }
        .a-pd-row {
          display: flex; justify-content: space-between; font-size: 9px;
          padding: 4px 8px; border-bottom: 1px dotted #0d0d0d;
          background: #090909;
        }
        .a-pd-row span:first-child { opacity: 0.45; }
        .a-ps-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 10px; }
        .a-ps-card {
          background: #090909; border: 1px solid #1e3a5f; padding: 8px 10px;
          display: flex; flex-direction: column; gap: 3px;
        }
        .a-ps-card span:first-child { font-size: 7px; opacity: 0.4; }
        .a-ps-card span:last-child { font-size: 13px; font-weight: 700; }
        .a-ps-bar-label { font-size: 7px; opacity: 0.35; margin-bottom: 3px; margin-top: 6px; }
        .a-ps-bar { height: 3px; background: #1a1a1a; margin-bottom: 4px; }
        .a-ps-fill { height: 100%; background: #1e3a5f; transition: width 0.5s; }
        .a-preview-actions { display: flex; flex-direction: column; gap: 6px; }
        .a-pact-btn {
          width: 100%; padding: 9px; font-size: 9px; cursor: pointer;
          font-family: inherit; letter-spacing: 1px; transition: background 0.2s; border: none;
        }
        .a-pact-btn.primary { background: #1e3a5f; color: #fff; }
        .a-pact-btn.primary:hover { background: #2a4a7a; }
        .a-pact-btn.secondary { background: none; border: 1px solid #1a1a1a; color: #fff; }
        .a-pact-btn.secondary:hover { border-color: #1e3a5f; background: rgba(30,58,95,0.1); }

        /* ── CREATE VIEW ── */
        .a-create-view { display: flex; flex-direction: column; gap: 16px; }

        .a-steps {
          display: flex;
          align-items: center;
          gap: 0;
          margin-bottom: 4px;
          overflow-x: auto;
        }
        .a-step {
          display: flex;
          align-items: center;
          gap: 0;
          position: relative;
        }
        .a-step-num {
          width: 24px; height: 24px; border-radius: 50%;
          background: #111; border: 1px solid #1a1a1a; color: #fff;
          display: flex; align-items: center; justify-content: center;
          font-size: 9px; font-weight: 700; flex-shrink: 0; z-index: 1;
        }
        .a-step-label {
          font-size: 7px; letter-spacing: 1px; opacity: 0.35;
          margin: 0 6px;
          white-space: nowrap;
        }
        .a-step-line {
          flex: 1; height: 1px; background: #1a1a1a; min-width: 20px;
        }
        .a-step-done .a-step-num { border-color: #1e3a5f; background: rgba(30,58,95,0.3); }
        .a-step-done .a-step-label { opacity: 0.55; }
        .a-step-done .a-step-line { background: #1e3a5f; }
        .a-step-active .a-step-num { border-color: #1e3a5f; background: #1e3a5f; }
        .a-step-active .a-step-label { opacity: 1; color: #6ab4ff; }

        .a-step-body {
          background: #090909;
          border: 1px solid #1e3a5f;
          padding: 20px;
          flex: 1;
        }

        .a-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .a-field { display: flex; flex-direction: column; gap: 5px; }
        .a-field-full { grid-column: 1 / -1; }
        .a-field label { font-size: 7px; opacity: 0.45; letter-spacing: 1px; }
        .a-input {
          background: #0e0e0e; border: 1px solid #1a1a1a; color: #fff;
          padding: 7px 10px; font-size: 10px; font-family: inherit;
          outline: none; transition: border-color 0.15s; width: 100%;
        }
        .a-input:focus { border-color: #1e3a5f; }
        .a-input::placeholder { opacity: 0.25; }
        .a-textarea { resize: vertical; min-height: 56px; line-height: 1.5; }
        .a-code-area { font-family: monospace; font-size: 9px; }
        select.a-input { cursor: pointer; }

        /* Questions layout */
        .a-questions-layout { display: grid; grid-template-columns: 220px 1fr; gap: 12px; padding: 0 !important; background: none !important; border: none !important; }
        .a-q-list { background: #090909; border: 1px solid #1e3a5f; padding: 12px; display: flex; flex-direction: column; gap: 4px; overflow-y: auto; max-height: 520px; }
        .a-ql-title { font-size: 7px; letter-spacing: 1.5px; opacity: 0.35; margin-bottom: 6px; }
        .a-ql-empty { font-size: 8px; opacity: 0.2; text-align: center; padding: 20px 0; }
        .a-ql-item { display: flex; align-items: center; gap: 6px; padding: 6px; border: 1px solid #111; transition: border-color 0.15s; }
        .a-ql-item:hover { border-color: #1e3a5f; }
        .a-ql-num { font-size: 9px; color: #1e3a5f; font-weight: 700; flex-shrink: 0; width: 22px; }
        .a-ql-info { flex: 1; min-width: 0; }
        .a-ql-text { font-size: 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-bottom: 2px; }
        .a-ql-meta { display: flex; gap: 6px; font-size: 6px; opacity: 0.45; }
        .a-ql-remove { background: none; border: none; color: #666; font-size: 14px; cursor: pointer; flex-shrink: 0; line-height: 1; }
        .a-ql-remove:hover { color: #fff; }
        .a-ql-summary { margin-top: 8px; padding-top: 8px; border-top: 1px solid #1e3a5f; display: flex; justify-content: space-between; font-size: 7px; opacity: 0.5; }

        .a-q-editor { background: #090909; border: 1px solid #1e3a5f; padding: 14px; overflow-y: auto; }
        .a-qbuilder { background: #070707; border: 1px solid #111; padding: 10px; margin: 10px 0; }
        .a-qb-title { font-size: 7px; opacity: 0.35; letter-spacing: 1px; margin-bottom: 8px; }
        .a-opt-row { display: flex; align-items: center; gap: 8px; margin-bottom: 5px; }
        .a-radio { width: 12px; height: 12px; cursor: pointer; flex-shrink: 0; accent-color: #1e3a5f; }
        .a-opt-label { font-size: 8px; opacity: 0.5; width: 60px; flex-shrink: 0; }
        .a-opt-input { flex: 1; }
        .a-tf-row { display: flex; gap: 8px; }
        .a-tf-btn {
          flex: 1; background: none; border: 1px solid #1a1a1a; color: #fff;
          padding: 8px; font-size: 10px; cursor: pointer; font-family: inherit;
          letter-spacing: 1px; transition: all 0.15s;
        }
        .a-tf-btn:hover { border-color: #1e3a5f; }
        .a-tf-active { background: #1e3a5f; border-color: #1e3a5f; }
        .a-tc-row { display: grid; grid-template-columns: 1fr 1fr 60px auto; gap: 6px; margin-bottom: 6px; align-items: end; }
        .a-tc-field { display: flex; flex-direction: column; gap: 3px; }
        .a-tc-field label { font-size: 6px; opacity: 0.35; letter-spacing: 1px; }
        .a-tc-rm { background: none; border: none; color: #555; font-size: 16px; cursor: pointer; align-self: flex-end; padding-bottom: 6px; line-height: 1; }
        .a-tc-rm:hover { color: #fff; }
        .a-add-tc {
          background: none; border: 1px solid #1a1a1a; color: #fff;
          padding: 4px 10px; font-size: 8px; cursor: pointer; font-family: inherit;
          transition: border-color 0.15s; margin-top: 6px;
        }
        .a-add-tc:hover { border-color: #1e3a5f; }
        .a-add-q-btn {
          width: 100%; background: #1e3a5f; border: none; color: #fff;
          padding: 9px; font-size: 9px; cursor: pointer; font-family: inherit;
          letter-spacing: 1px; transition: background 0.2s; margin-top: 12px;
        }
        .a-add-q-btn:hover:not(:disabled) { background: #2a4a7a; }
        .a-add-q-btn:disabled { opacity: 0.35; cursor: not-allowed; }

        /* Settings */
        .a-settings-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
        .a-setting-card {
          background: #0e0e0e; border: 1px solid #1a1a1a; padding: 12px 14px;
          display: flex; justify-content: space-between; align-items: center; gap: 12px;
          transition: border-color 0.15s;
        }
        .a-setting-card:hover { border-color: #1e3a5f; }
        .a-setting-select { flex-direction: row; align-items: center; }
        .a-sc-label { font-size: 9px; margin-bottom: 2px; }
        .a-sc-sub { font-size: 7px; opacity: 0.35; }
        .a-setting-sel-input { width: 160px; flex-shrink: 0; }

        /* Toggle Switch */
        .a-toggle {
          width: 36px; height: 18px; border-radius: 9px;
          background: #1a1a1a; border: 1px solid #222;
          position: relative; cursor: pointer; flex-shrink: 0;
          transition: background 0.2s;
        }
        .a-toggle-on { background: #1e3a5f; border-color: #1e3a5f; }
        .a-toggle-knob {
          position: absolute; top: 2px; left: 2px;
          width: 12px; height: 12px; border-radius: 50%;
          background: #555; transition: transform 0.2s, background 0.2s;
        }
        .a-toggle-on .a-toggle-knob { transform: translateX(18px); background: #fff; }

        /* Review */
        .a-review-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
        .a-review-panel { background: #090909; border: 1px solid #1e3a5f; padding: 14px; }
        .a-review-questions { background: #090909; border: 1px solid #1e3a5f; padding: 14px; margin-bottom: 12px; }
        .a-rq-header {
          display: grid; grid-template-columns: 40px 100px 1fr 70px 40px;
          gap: 0; padding: 4px 8px; background: #070707;
          font-size: 7px; opacity: 0.35; letter-spacing: 0.5px; margin-bottom: 4px;
        }
        .a-rq-row {
          display: grid; grid-template-columns: 40px 100px 1fr 70px 40px;
          gap: 0; padding: 5px 8px; border-bottom: 1px dotted #0d0d0d;
          font-size: 8px; align-items: center;
        }
        .a-rq-text { font-size: 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .a-review-note {
          background: #070707; border-left: 3px solid #1e3a5f;
          padding: 10px 14px; font-size: 9px; opacity: 0.55; line-height: 1.6;
        }

        /* Published */
        .a-published {
          display: flex; flex-direction: column; align-items: center;
          gap: 20px; text-align: center; padding: 40px;
        }
        .a-pub-title { font-size: 16px; font-weight: 700; letter-spacing: 3px; color: #6ab4ff; }
        .a-pub-sub { font-size: 9px; opacity: 0.4; }
        .a-pub-creds { display: flex; gap: 20px; }
        .a-pub-cred {
          background: #090909; border: 1px solid #1e3a5f; padding: 16px 28px;
          display: flex; flex-direction: column; gap: 6px; align-items: center;
        }
        .a-pub-cred > span:first-child { font-size: 7px; opacity: 0.4; letter-spacing: 1px; }
        .a-pub-code { font-size: 28px; font-weight: 700; letter-spacing: 6px; color: #ffffff; }
        .a-pub-pass { font-size: 24px; font-weight: 700; letter-spacing: 4px; color: #6ab4ff; }
        .a-pub-details { background: #090909; border: 1px solid #1e3a5f; padding: 14px 24px; min-width: 320px; }
        .a-pub-actions { display: flex; gap: 12px; }

        /* Step Nav */
        .a-step-nav {
          display: flex; justify-content: space-between; align-items: center;
          padding: 14px 0; border-top: 1px solid #1e3a5f; margin-top: 4px;
        }
        .a-nav-btn {
          padding: 8px 24px; font-size: 9px; cursor: pointer;
          font-family: inherit; letter-spacing: 1px; transition: all 0.2s;
        }
        .a-nav-btn.primary { background: #1e3a5f; border: none; color: #fff; }
        .a-nav-btn.primary:hover:not(:disabled) { background: #2a4a7a; }
        .a-nav-btn.secondary { background: none; border: 1px solid #1a1a1a; color: #fff; }
        .a-nav-btn.secondary:hover:not(:disabled) { border-color: #1e3a5f; }
        .a-nav-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .a-step-indicator { font-size: 8px; opacity: 0.35; letter-spacing: 1px; }

        /* Scan line — identical to Home */
        .a-scan-line {
          position: fixed; top: 0; left: 0; right: 0; height: 100%;
          background: linear-gradient(to bottom, transparent 0%, rgba(30,58,95,0.02) 50%, transparent 100%);
          pointer-events: none;
          animation: scan 8s linear infinite;
          z-index: 999;
        }
        @keyframes scan { 0%{transform:translateY(-100%)} 100%{transform:translateY(100%)} }

        /* Responsive */
        @media (max-width: 1200px) {
          .a-stats-grid { grid-template-columns: repeat(3, 1fr); }
          .a-table-header, .a-table-row {
            grid-template-columns: 2fr 70px 90px 55px 75px 80px 45px 80px 55px 90px;
          }
        }
        @media (max-width: 1000px) {
          .a-main { flex-direction: column; }
          .a-sidebar { width: 100%; }
          .a-questions-layout { grid-template-columns: 1fr; }
          .a-join-grid { grid-template-columns: 1fr 1fr; }
          .a-preview-grid { grid-template-columns: 1fr; }
          .a-review-grid { grid-template-columns: 1fr; }
          .a-settings-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) {
          .a-stats-grid { grid-template-columns: repeat(2, 1fr); }
          .a-join-grid { grid-template-columns: 1fr; }
          .a-form-grid { grid-template-columns: 1fr; }
          .a-join-manual { grid-template-columns: 1fr; }
          .a-tc-row { grid-template-columns: 1fr 1fr; }
        }
      `}</style>
    </div>
  )
}