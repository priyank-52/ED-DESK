// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

// ==================== TYPES ====================

interface PollOption {
  id: string
  text: string
  votes: string[]
  color: string
}

interface Poll {
  id: string
  title: string
  question: string
  options: PollOption[]
  isMultipleChoice: boolean
  isAnonymous: boolean
  isLocked: boolean
  code: string
  createdBy: string
  creatorName: string
  createdAt: Date
  endTime?: Date
  totalVotes: number
  participants: number
  status: 'active' | 'scheduled' | 'ended' | 'paused'
  category: string
  maxParticipants: number
  showResultsBefore: boolean
  allowChange: boolean
}

interface LiveVoteEvent {
  pollId: string
  voter: string
  option: string
  timestamp: Date
}

interface PollStats {
  totalPolls: number
  activeNow: number
  totalVotesToday: number
  avgParticipation: number
  pendingPolls: number
  completedPolls: number
}

const OPTION_COLORS = ['#1e3a5f', '#2a5f3a', '#5f3a1e', '#3a1e5f', '#1e5f5f', '#5f1e3a']

// ==================== COMPONENT ====================

export default function PollSystem() {
  const navigate = useNavigate()

  // ── View State ──
  const [view, setView] = useState<'list' | 'join' | 'create' | 'vote' | 'results'>('list')
  const [time, setTime] = useState(new Date())
  const [logs, setLogs] = useState<string[]>([])

  // ── List / Filter ──
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'scheduled' | 'ended'>('all')
  const [filterType, setFilterType] = useState<'all' | 'single' | 'multiple'>('all')
  const [filterCat, setFilterCat] = useState('all')

  // ── Join ──
  const [joinCode, setJoinCode] = useState('')
  const [joinPass, setJoinPass] = useState('')

  // ── Create ──
  const [draftTitle, setDraftTitle] = useState('')
  const [draftQuestion, setDraftQuestion] = useState('')
  const [draftOptions, setDraftOptions] = useState(['', ''])
  const [draftCategory, setDraftCategory] = useState('General')
  const [draftDuration, setDraftDuration] = useState(10)
  const [draftMaxPart, setDraftMaxPart] = useState(50)
  const [draftMultiple, setDraftMultiple] = useState(false)
  const [draftAnonymous, setDraftAnonymous] = useState(true)
  const [draftLocked, setDraftLocked] = useState(false)
  const [draftShowBefore, setDraftShowBefore] = useState(true)
  const [draftAllowChange, setDraftAllowChange] = useState(false)
  const [genCode, setGenCode] = useState('')
  const [genPass, setGenPass] = useState('')
  const [createDone, setCreateDone] = useState(false)

  // ── Vote ──
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null)
  const [myVotes, setMyVotes] = useState<Record<string, string[]>>({}) // pollId -> optionIds
  const [liveEvents, setLiveEvents] = useState<LiveVoteEvent[]>([])
  const [timers, setTimers] = useState<Record<string, string>>({})
  const [highlightOpt, setHighlightOpt] = useState<string | null>(null)

  // ── Stats ──
  const [stats, setStats] = useState<PollStats>({
    totalPolls: 3, activeNow: 2, totalVotesToday: 27,
    avgParticipation: 68, pendingPolls: 1, completedPolls: 1
  })

  // ── Data ──
  const [polls, setPolls] = useState<Poll[]>([
    {
      id: 'p1', title: 'Programming Languages', status: 'active', category: 'Technical',
      question: 'Which programming language should we focus on for the next semester project?',
      options: [
        { id: 'o1', text: 'Python', votes: ['user1','user2','user3'], color: OPTION_COLORS[0] },
        { id: 'o2', text: 'JavaScript', votes: ['user4','user5'], color: OPTION_COLORS[1] },
        { id: 'o3', text: 'Java', votes: ['user6'], color: OPTION_COLORS[2] },
        { id: 'o4', text: 'C++', votes: ['user7','user8'], color: OPTION_COLORS[3] },
      ],
      isMultipleChoice: false, isAnonymous: false, isLocked: false,
      code: 'POLL123', createdBy: 'teacher1', creatorName: 'Prof. Sharma',
      createdAt: new Date(Date.now() - 3600000), endTime: new Date(Date.now() + 2700000),
      totalVotes: 8, participants: 8, maxParticipants: 40,
      showResultsBefore: true, allowChange: false
    },
    {
      id: 'p2', title: 'Course Feedback', status: 'active', category: 'Feedback',
      question: 'How satisfied are you with the ED-DESK offline learning platform?',
      options: [
        { id: 'o5', text: 'Very Satisfied', votes: ['user1','user4','user7'], color: OPTION_COLORS[0] },
        { id: 'o6', text: 'Satisfied', votes: ['user2','user5','user8'], color: OPTION_COLORS[1] },
        { id: 'o7', text: 'Neutral', votes: ['user3'], color: OPTION_COLORS[2] },
        { id: 'o8', text: 'Dissatisfied', votes: [], color: OPTION_COLORS[3] },
        { id: 'o9', text: 'Very Dissatisfied', votes: [], color: OPTION_COLORS[4] },
      ],
      isMultipleChoice: false, isAnonymous: true, isLocked: true,
      code: 'FEED22', createdBy: 'admin1', creatorName: 'Dr. Verma',
      createdAt: new Date(Date.now() - 7200000), endTime: new Date(Date.now() + 900000),
      totalVotes: 7, participants: 7, maxParticipants: 30,
      showResultsBefore: false, allowChange: false
    },
    {
      id: 'p3', title: 'Feature Request', status: 'active', category: 'Product',
      question: 'Which features would you like to see in the next update? (Select all that apply)',
      options: [
        { id: 'o10', text: 'Video Conferencing', votes: ['user1','user3','user5','user7'], color: OPTION_COLORS[0] },
        { id: 'o11', text: 'Screen Sharing', votes: ['user2','user4','user6','user8'], color: OPTION_COLORS[1] },
        { id: 'o12', text: 'File Sharing', votes: ['user1','user4','user7'], color: OPTION_COLORS[2] },
        { id: 'o13', text: 'Whiteboard', votes: ['user3','user6','user8'], color: OPTION_COLORS[3] },
        { id: 'o14', text: 'Code Collaboration', votes: ['user2','user5','user7'], color: OPTION_COLORS[4] },
      ],
      isMultipleChoice: true, isAnonymous: true, isLocked: false,
      code: 'FEAT24', createdBy: 'teacher1', creatorName: 'Prof. Sharma',
      createdAt: new Date(Date.now() - 1800000), endTime: new Date(Date.now() + 5400000),
      totalVotes: 19, participants: 12, maxParticipants: 40,
      showResultsBefore: true, allowChange: true
    },
    {
      id: 'p4', title: 'Lab Schedule', status: 'scheduled', category: 'Scheduling',
      question: 'Which time slot works best for the extra lab session next week?',
      options: [
        { id: 'o15', text: 'Monday 9AM - 11AM', votes: [], color: OPTION_COLORS[0] },
        { id: 'o16', text: 'Wednesday 2PM - 4PM', votes: [], color: OPTION_COLORS[1] },
        { id: 'o17', text: 'Friday 10AM - 12PM', votes: [], color: OPTION_COLORS[2] },
        { id: 'o18', text: 'Saturday 9AM - 11AM', votes: [], color: OPTION_COLORS[3] },
      ],
      isMultipleChoice: false, isAnonymous: false, isLocked: true,
      code: 'LAB99', createdBy: 'teacher2', creatorName: 'Dr. Mehta',
      createdAt: new Date(Date.now() - 600000), endTime: new Date(Date.now() + 86400000),
      totalVotes: 0, participants: 0, maxParticipants: 25,
      showResultsBefore: false, allowChange: false
    },
  ])

  // ── Effects ──

  useEffect(() => {
    const t = setInterval(() => {
      setTime(new Date())
      // Update all countdown timers
      setTimers(() => {
        const t: Record<string, string> = {}
        polls.forEach(p => { t[p.id] = fmtCountdown(p.endTime) })
        return t
      })
    }, 1000)
    return () => clearInterval(t)
  }, [polls])

  // Simulate live votes coming in
  useEffect(() => {
    const interval = setInterval(() => {
      const activePolls = polls.filter(p => p.status === 'active')
      if (activePolls.length === 0) return
      const poll = activePolls[Math.floor(Math.random() * activePolls.length)]
      if (poll.participants >= poll.maxParticipants) return
      const opt = poll.options[Math.floor(Math.random() * poll.options.length)]
      const voter = `Student_${Math.floor(Math.random() * 99)}`

      setPolls(prev => prev.map(p => {
        if (p.id !== poll.id) return p
        const updatedOpts = p.options.map(o => {
          if (o.id !== opt.id) return o
          if (o.votes.includes(voter)) return o
          return { ...o, votes: [...o.votes, voter] }
        })
        const total = updatedOpts.reduce((s, o) => s + o.votes.length, 0)
        const unique = new Set(updatedOpts.flatMap(o => o.votes)).size
        return { ...p, options: updatedOpts, totalVotes: total, participants: unique }
      }))

      setHighlightOpt(opt.id)
      setTimeout(() => setHighlightOpt(null), 800)

      setLiveEvents(prev => [{
        pollId: poll.id, voter, option: opt.text, timestamp: new Date()
      }, ...prev.slice(0, 19)])

      addLog(`VOTE — "${opt.text}" in ${poll.code}`)
      setStats(prev => ({ ...prev, totalVotesToday: prev.totalVotesToday + 1 }))
    }, 4500)
    return () => clearInterval(interval)
  }, [polls])

  // Update selectedPoll when polls update
  useEffect(() => {
    if (selectedPoll) {
      const updated = polls.find(p => p.id === selectedPoll.id)
      if (updated) setSelectedPoll(updated)
    }
  }, [polls])

  // ── Utilities ──

  const ft = (d: Date) => d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const ftShort = (d: Date) => d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
  const addLog = (msg: string) => setLogs(prev => [`[${ft(new Date())}] ${msg}`, ...prev.slice(0, 29)])

  const fmtCountdown = (end?: Date): string => {
    if (!end) return 'No limit'
    const diff = end.getTime() - Date.now()
    if (diff <= 0) return 'ENDED'
    const m = Math.floor(diff / 60000)
    const s = Math.floor((diff % 60000) / 1000)
    return `${m}m ${s}s`
  }

  const getPct = (votes: number, total: number) => total === 0 ? 0 : Math.round((votes / total) * 100)

  const statClass = (s: string) => s === 'active' ? 'pstat-active' : s === 'scheduled' ? 'pstat-sched' : s === 'paused' ? 'pstat-paused' : 'pstat-ended'

  const categories = ['all', ...Array.from(new Set(polls.map(p => p.category)))]

  const hasVoted = (pollId: string) => myVotes[pollId] && myVotes[pollId].length > 0
  const votedOpt = (pollId: string, optId: string) => (myVotes[pollId] || []).includes(optId)

  const filtered = polls.filter(p => {
    if (filterStatus !== 'all' && p.status !== filterStatus) return false
    if (filterType === 'single' && p.isMultipleChoice) return false
    if (filterType === 'multiple' && !p.isMultipleChoice) return false
    if (filterCat !== 'all' && p.category !== filterCat) return false
    if (search && !p.title.toLowerCase().includes(search.toLowerCase()) && !p.code.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  // ── Actions ──

  const handleVote = (poll: Poll, optId: string) => {
    if (poll.status === 'ended' || poll.status === 'scheduled') return
    const current = myVotes[poll.id] || []

    let updated: string[]
    if (poll.isMultipleChoice) {
      updated = current.includes(optId)
        ? current.filter(id => id !== optId)
        : [...current, optId]
    } else {
      if (!poll.allowChange && current.length > 0) return
      updated = current.includes(optId) ? [] : [optId]
    }

    setMyVotes(prev => ({ ...prev, [poll.id]: updated }))

    // Apply vote to poll data
    setPolls(prev => prev.map(p => {
      if (p.id !== poll.id) return p
      const userId = 'me'
      const updatedOpts = p.options.map(o => {
        const wasVoted = current.includes(o.id)
        const isVoted = updated.includes(o.id)
        if (wasVoted && !isVoted) return { ...o, votes: o.votes.filter(v => v !== userId) }
        if (!wasVoted && isVoted) return { ...o, votes: [...o.votes, userId] }
        return o
      })
      const total = updatedOpts.reduce((s, o) => s + o.votes.length, 0)
      const unique = new Set(updatedOpts.flatMap(o => o.votes)).size
      return { ...p, options: updatedOpts, totalVotes: total, participants: unique }
    }))

    const opt = poll.options.find(o => o.id === optId)
    addLog(`VOTED "${opt?.text}" in ${poll.code}`)
  }

  const handleJoin = () => {
    if (!joinCode.trim()) return
    const found = polls.find(p => p.code === joinCode)
    if (!found) { addLog(`JOIN FAILED — code ${joinCode} not found`); return }
    if (found.isLocked && !joinPass.trim()) { addLog(`JOIN FAILED — password required for ${joinCode}`); return }
    setSelectedPoll(found)
    setView('vote')
    addLog(`JOINED poll ${joinCode}`)
  }

  const handleCreate = () => {
    if (!draftTitle.trim() || !draftQuestion.trim()) return
    const validOpts = draftOptions.filter(o => o.trim())
    if (validOpts.length < 2) return

    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    const pass = draftLocked ? Math.floor(1000 + Math.random() * 9000).toString() : ''
    setGenCode(code)
    setGenPass(pass)

    const newPoll: Poll = {
      id: `p-${Date.now()}`, title: draftTitle, question: draftQuestion,
      options: validOpts.map((text, i) => ({
        id: `o-${Date.now()}-${i}`, text, votes: [], color: OPTION_COLORS[i % OPTION_COLORS.length]
      })),
      isMultipleChoice: draftMultiple, isAnonymous: draftAnonymous, isLocked: draftLocked,
      code, createdBy: 'me', creatorName: 'You',
      createdAt: new Date(), endTime: new Date(Date.now() + draftDuration * 60000),
      totalVotes: 0, participants: 0, maxParticipants: draftMaxPart,
      status: 'active', category: draftCategory,
      showResultsBefore: draftShowBefore, allowChange: draftAllowChange
    }

    setPolls(prev => [newPoll, ...prev])
    setStats(prev => ({ ...prev, totalPolls: prev.totalPolls + 1, activeNow: prev.activeNow + 1 }))
    addLog(`CREATED poll "${draftTitle}" • ${code}`)
    setCreateDone(true)
  }

  const resetCreate = () => {
    setDraftTitle(''); setDraftQuestion(''); setDraftOptions(['', ''])
    setDraftCategory('General'); setDraftDuration(10); setDraftMaxPart(50)
    setDraftMultiple(false); setDraftAnonymous(true); setDraftLocked(false)
    setDraftShowBefore(true); setDraftAllowChange(false); setCreateDone(false)
  }

  const closePoll = (id: string) => {
    setPolls(prev => prev.map(p => p.id === id ? { ...p, status: 'ended' } : p))
    addLog(`CLOSED poll ${id}`)
  }

  const addOption = () => {
    if (draftOptions.length < 6) setDraftOptions(prev => [...prev, ''])
  }

  const removeOption = (i: number) => {
    if (draftOptions.length > 2) setDraftOptions(prev => prev.filter((_, idx) => idx !== i))
  }

  // ==================== RENDER ====================

  return (
    <div className="proot">

      {/* ── PAGE HEADER ── */}
      <div className="p-page-header">
        <div className="p-page-title">
          <span className="p-title-text">POLL MODULE</span>
          <span className="p-title-sub">REAL-TIME LIVE VOTING SYSTEM • LAN-BASED • BLOCKCHAIN VERIFIED</span>
        </div>
        <div className="p-page-meta">
          <span className="p-version">v1.0.0</span>
          <span className="p-time">{ftShort(time)}</span>
          <div className="p-log-box">
            <span className="p-log-line">{logs[0] || '[System ready]'}</span>
          </div>
        </div>
      </div>

      {/* ── STATS GRID ── */}
      <div className="p-stats-grid">
        {[
          { label: 'TOTAL POLLS', val: stats.totalPolls, pct: 100 },
          { label: 'ACTIVE NOW', val: stats.activeNow, pct: (stats.activeNow / Math.max(stats.totalPolls, 1)) * 100 },
          { label: 'VOTES TODAY', val: stats.totalVotesToday, pct: 72 },
          { label: 'AVG PARTICIPATION', val: `${stats.avgParticipation}%`, pct: stats.avgParticipation },
          { label: 'PENDING', val: stats.pendingPolls, pct: (stats.pendingPolls / Math.max(stats.totalPolls, 1)) * 100 },
          { label: 'COMPLETED', val: stats.completedPolls, pct: (stats.completedPolls / Math.max(stats.totalPolls, 1)) * 100 },
        ].map((s, i) => (
          <div key={i} className="p-stat-card">
            <div className="psc-head">
              <span>{s.label}</span>
              <span className="psc-val">{s.val}</span>
            </div>
            <div className="psc-bar"><div className="psc-fill" style={{ width: `${Math.min(s.pct, 100)}%` }} /></div>
          </div>
        ))}
      </div>

      {/* ── MAIN PANEL ── */}
      <div className="p-main">

        {/* ── SIDEBAR ── */}
        <aside className="p-sidebar">
          <div className="p-sb-section">
            <div className="p-sb-title">NAVIGATION</div>
            {[
              { key: 'list', label: 'Poll List' },
              { key: 'join', label: 'Join Session' },
              { key: 'create', label: 'Create Poll' },
            ].map(item => (
              <button key={item.key} className={`p-sb-btn ${view === item.key ? 'p-sb-active' : ''}`}
                onClick={() => { setView(item.key as any); setCreateDone(false) }}>
                <span className="p-sb-arrow">{view === item.key ? '▸' : '·'}</span>
                {item.label}
              </button>
            ))}
          </div>

          {/* Active Polls Mini-Monitor */}
          <div className="p-sb-section">
            <div className="p-sb-title">LIVE POLLS</div>
            {polls.filter(p => p.status === 'active').map(p => (
              <div key={p.id} className="p-sb-poll" onClick={() => { setSelectedPoll(p); setView('vote') }}>
                <div className="p-sb-poll-top">
                  <span className="p-sb-dot" />
                  <span className="p-sb-pname">{p.title.substring(0, 22)}{p.title.length > 22 ? '...' : ''}</span>
                </div>
                <div className="p-sb-pmeta">
                  <span>{p.participants} voters</span>
                  <span className="p-sb-timer">{timers[p.id] || fmtCountdown(p.endTime)}</span>
                </div>
                <div className="p-sb-pbar"><div className="p-sb-pfill" style={{ width: `${(p.participants / p.maxParticipants) * 100}%` }} /></div>
              </div>
            ))}
          </div>

          {/* Live Vote Stream */}
          <div className="p-sb-section p-sb-flex">
            <div className="p-sb-title">LIVE VOTE STREAM</div>
            <div className="p-sb-events">
              {liveEvents.length === 0 && <div className="p-sb-ev-empty">[No votes yet]</div>}
              {liveEvents.map((ev, i) => (
                <div key={i} className="p-sb-ev">
                  <span className="p-sb-ev-voter">{ev.voter}</span>
                  <span className="p-sb-ev-opt">{ev.option.substring(0, 16)}</span>
                  <span className="p-sb-ev-time">{ft(ev.timestamp).slice(0, 5)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Log */}
          <div className="p-sb-section">
            <div className="p-sb-title">ACTIVITY LOG</div>
            <div className="p-sb-logs">
              {logs.length === 0 ? <div className="p-sb-log-empty">[Awaiting activity]</div>
                : logs.slice(0, 10).map((l, i) => <div key={i} className="p-sb-log">{l}</div>)}
            </div>
          </div>
        </aside>

        {/* ── CONTENT ── */}
        <div className="p-content">

          {/* ════════════════ LIST VIEW ════════════════ */}
          {view === 'list' && (
            <div className="p-list-view">
              {/* Toolbar */}
              <div className="p-toolbar">
                <input className="p-search" placeholder="Search by title or code..." value={search} onChange={e => setSearch(e.target.value)} />
                <div className="p-toolbar-right">
                  <div className="p-filters">
                    {(['all', 'active', 'scheduled', 'ended'] as const).map(f => (
                      <button key={f} className={`p-fbtn ${filterStatus === f ? 'p-factive' : ''}`} onClick={() => setFilterStatus(f)}>{f.toUpperCase()}</button>
                    ))}
                  </div>
                  <div className="p-filters">
                    {(['all', 'single', 'multiple'] as const).map(f => (
                      <button key={f} className={`p-fbtn ${filterType === f ? 'p-factive' : ''}`} onClick={() => setFilterType(f)}>{f.toUpperCase()}</button>
                    ))}
                  </div>
                  <select className="p-cat-sel" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
                    {categories.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                  </select>
                </div>
              </div>

              {/* Table header */}
              <div className="p-table-header">
                <span>TITLE / QUESTION</span>
                <span>CODE</span>
                <span>CREATOR</span>
                <span>TYPE</span>
                <span>STATUS</span>
                <span>VOTERS</span>
                <span>VOTES</span>
                <span>REMAINING</span>
                <span>ACTION</span>
              </div>
              <div className="p-table-body">
                {filtered.length === 0 && <div className="p-empty">No polls match filters</div>}
                {filtered.map(p => (
                  <div key={p.id} className="p-table-row">
                    <div className="p-row-title">
                      <span className="p-row-name">{p.title}</span>
                      <span className="p-row-q">{p.question.substring(0, 48)}{p.question.length > 48 ? '...' : ''}</span>
                    </div>
                    <span className="p-row-code">{p.code}{p.isLocked ? ' ⬡' : ''}</span>
                    <span className="p-row-creator">{p.creatorName}</span>
                    <div className="p-row-type">
                      <span className={`p-type ${p.isMultipleChoice ? 'p-type-multi' : 'p-type-single'}`}>
                        {p.isMultipleChoice ? 'MULTI' : 'SINGLE'}
                      </span>
                      {p.isAnonymous && <span className="p-type p-type-anon">ANON</span>}
                    </div>
                    <span className={`p-status ${statClass(p.status)}`}>{p.status.toUpperCase()}</span>
                    <div className="p-row-voters">
                      <span>{p.participants}/{p.maxParticipants}</span>
                      <div className="p-mini-bar"><div className="p-mini-fill" style={{ width: `${(p.participants / p.maxParticipants) * 100}%` }} /></div>
                    </div>
                    <span>{p.totalVotes}</span>
                    <span className={`p-row-remain ${p.status === 'ended' ? 'p-ended' : ''}`}>
                      {timers[p.id] || fmtCountdown(p.endTime)}
                    </span>
                    <div className="p-row-acts">
                      {p.status !== 'ended' && (
                        <button className="p-act-vote" onClick={() => { setSelectedPoll(p); setView('vote') }}>VOTE</button>
                      )}
                      <button className="p-act-view" onClick={() => { setSelectedPoll(p); setView('results') }}>RESULTS</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-table-footer">
                <span>SHOWING {filtered.length} / {polls.length} POLLS</span>
                <span>{filtered.filter(p => p.status === 'active').length} ACTIVE</span>
                <span>TOTAL VOTES: {filtered.reduce((s, p) => s + p.totalVotes, 0)}</span>
              </div>
            </div>
          )}

          {/* ════════════════ JOIN VIEW ════════════════ */}
          {view === 'join' && (
            <div className="p-join-view">
              <div className="p-view-title">JOIN POLL SESSION</div>

              <div className="p-join-section-title">AVAILABLE POLLS ON LAN</div>
              <div className="p-join-grid">
                {polls.filter(p => p.status !== 'ended').map(p => (
                  <div key={p.id} className={`p-join-card ${joinCode === p.code ? 'p-join-sel' : ''}`} onClick={() => setJoinCode(p.code)}>
                    <div className="pjc-top">
                      <div>
                        <div className="pjc-title">{p.title}</div>
                        <div className="pjc-code">{p.code} — {p.isLocked ? 'PRIVATE' : 'PUBLIC'}</div>
                      </div>
                      <span className={`p-status ${statClass(p.status)}`}>{p.status.toUpperCase()}</span>
                    </div>
                    <div className="pjc-question">{p.question.substring(0, 60)}{p.question.length > 60 ? '...' : ''}</div>
                    <div className="pjc-meta">
                      <div className="pjc-row"><span>CREATOR</span><span>{p.creatorName}</span></div>
                      <div className="pjc-row"><span>CATEGORY</span><span>{p.category}</span></div>
                      <div className="pjc-row"><span>TYPE</span><span>{p.isMultipleChoice ? 'MULTIPLE CHOICE' : 'SINGLE CHOICE'}</span></div>
                      <div className="pjc-row"><span>OPTIONS</span><span>{p.options.length}</span></div>
                      <div className="pjc-row"><span>VOTERS</span><span>{p.participants}/{p.maxParticipants}</span></div>
                      <div className="pjc-row"><span>REMAINING</span><span>{timers[p.id] || fmtCountdown(p.endTime)}</span></div>
                    </div>
                    <div className="pjc-bar"><div className="pjc-fill" style={{ width: `${(p.participants / p.maxParticipants) * 100}%` }} /></div>
                  </div>
                ))}
              </div>

              <div className="p-join-manual">
                <div className="p-join-section-title">ENTER CODE MANUALLY</div>
                <div className="p-join-form">
                  <div className="p-jfield">
                    <label>POLL CODE</label>
                    <input className="p-code-input" placeholder="XXXXXX" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} maxLength={6} />
                  </div>
                  <div className="p-jfield">
                    <label>PASSWORD (IF LOCKED)</label>
                    <input type="password" className="p-code-input p-pass-input" placeholder="••••" value={joinPass} onChange={e => setJoinPass(e.target.value)} />
                  </div>
                  <button className="p-join-submit" onClick={handleJoin} disabled={!joinCode.trim()}>JOIN SESSION</button>
                </div>
                <div className="p-join-info">
                  <div className="p-info-row"><span>ENCRYPTION</span><span>AES-256-GCM</span></div>
                  <div className="p-info-row"><span>ANONYMOUS</span><span>ECDSA VERIFIED</span></div>
                  <div className="p-info-row"><span>BLOCKCHAIN</span><span>HASH RECORDED</span></div>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════ VOTE VIEW ════════════════ */}
          {view === 'vote' && selectedPoll && (
            <div className="p-vote-view">
              {/* Vote Header */}
              <div className="pv-header">
                <div className="pv-head-left">
                  <div className="pv-category">{selectedPoll.category}</div>
                  <div className="pv-title">{selectedPoll.title}</div>
                  <div className="pv-question">{selectedPoll.question}</div>
                </div>
                <div className="pv-head-right">
                  <div className="pv-stat-box">
                    <span>VOTERS</span>
                    <span>{selectedPoll.participants}</span>
                  </div>
                  <div className="pv-stat-box">
                    <span>VOTES</span>
                    <span>{selectedPoll.totalVotes}</span>
                  </div>
                  <div className="pv-stat-box">
                    <span>REMAINING</span>
                    <span className={selectedPoll.endTime && selectedPoll.endTime.getTime() - Date.now() < 60000 ? 'pv-warn' : ''}>
                      {timers[selectedPoll.id] || fmtCountdown(selectedPoll.endTime)}
                    </span>
                  </div>
                  <div className="pv-stat-box">
                    <span>CODE</span>
                    <span>{selectedPoll.code}</span>
                  </div>
                </div>
              </div>

              {/* Badges */}
              <div className="pv-badges">
                <span className={`pv-badge ${statClass(selectedPoll.status)}`}>{selectedPoll.status.toUpperCase()}</span>
                {selectedPoll.isMultipleChoice && <span className="pv-badge pv-badge-multi">MULTIPLE CHOICE</span>}
                {selectedPoll.isAnonymous && <span className="pv-badge pv-badge-anon">ANONYMOUS</span>}
                {selectedPoll.isLocked && <span className="pv-badge pv-badge-locked">PRIVATE</span>}
                {selectedPoll.allowChange && <span className="pv-badge pv-badge-change">VOTE CHANGE ALLOWED</span>}
              </div>

              <div className="pv-body">
                {/* Options */}
                <div className="pv-options-panel">
                  <div className="pv-panel-title">OPTIONS — {hasVoted(selectedPoll.id) ? 'RESULTS' : 'CAST YOUR VOTE'}</div>
                  {selectedPoll.options.map(opt => {
                    const voted = votedOpt(selectedPoll.id, opt.id)
                    const showPct = hasVoted(selectedPoll.id) || selectedPoll.showResultsBefore
                    const pct = getPct(opt.votes.length, selectedPoll.totalVotes)
                    const isHighlight = highlightOpt === opt.id
                    const canVote = selectedPoll.status !== 'ended' && selectedPoll.status !== 'scheduled'
                    const disabled = !canVote || (!selectedPoll.isMultipleChoice && hasVoted(selectedPoll.id) && !selectedPoll.allowChange)

                    return (
                      <div key={opt.id} className={`pv-opt ${isHighlight ? 'pv-opt-pulse' : ''}`}>
                        <button
                          className={`pv-opt-btn ${voted ? 'pv-opted' : ''} ${disabled ? 'pv-opt-disabled' : ''}`}
                          onClick={() => handleVote(selectedPoll, opt.id)}
                          disabled={disabled}
                        >
                          <div className="pv-opt-left">
                            <span className={`pv-opt-check ${voted ? 'pv-check-on' : ''}`}>
                              {selectedPoll.isMultipleChoice ? (voted ? '■' : '□') : (voted ? '●' : '○')}
                            </span>
                            <span className="pv-opt-text">{opt.text}</span>
                          </div>
                          <div className="pv-opt-right">
                            {showPct && <span className="pv-opt-pct">{pct}%</span>}
                            <span className="pv-opt-count">{opt.votes.length} votes</span>
                          </div>
                        </button>
                        {showPct && (
                          <div className="pv-opt-bar-wrap">
                            <div className="pv-opt-bar">
                              <div className="pv-opt-fill" style={{ width: `${pct}%`, background: opt.color }} />
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {hasVoted(selectedPoll.id) && (
                    <div className="pv-voted-msg">
                      {selectedPoll.isAnonymous ? 'VOTE RECORDED ANONYMOUSLY — BLOCKCHAIN VERIFIED' : 'VOTE RECORDED — THANK YOU'}
                    </div>
                  )}

                  {!hasVoted(selectedPoll.id) && selectedPoll.status === 'active' && (
                    <div className="pv-hint">
                      {selectedPoll.isMultipleChoice ? 'SELECT ONE OR MORE OPTIONS' : 'SELECT ONE OPTION'}
                    </div>
                  )}
                </div>

                {/* Live Feed */}
                <div className="pv-live-panel">
                  <div className="pv-panel-title">LIVE VOTE FEED</div>
                  <div className="pv-live-list">
                    {liveEvents.filter(ev => ev.pollId === selectedPoll.id).length === 0 && (
                      <div className="pv-live-empty">Awaiting votes...</div>
                    )}
                    {liveEvents.filter(ev => ev.pollId === selectedPoll.id).map((ev, i) => (
                      <div key={i} className="pv-live-ev">
                        <span className="pv-ev-dot" />
                        <div className="pv-ev-info">
                          <span className="pv-ev-voter">{selectedPoll.isAnonymous ? 'Anonymous' : ev.voter}</span>
                          <span className="pv-ev-opt">{ev.option}</span>
                        </div>
                        <span className="pv-ev-time">{ft(ev.timestamp).slice(0, 5)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Donut-style option breakdown */}
                  <div className="pv-panel-title" style={{ marginTop: 14 }}>BREAKDOWN</div>
                  {selectedPoll.options.map(opt => (
                    <div key={opt.id} className="pv-breakdown-row">
                      <span className="pv-bd-label">{opt.text.substring(0, 18)}</span>
                      <div className="pv-bd-bar">
                        <div className="pv-bd-fill" style={{ width: `${getPct(opt.votes.length, selectedPoll.totalVotes)}%`, background: opt.color }} />
                      </div>
                      <span className="pv-bd-pct">{getPct(opt.votes.length, selectedPoll.totalVotes)}%</span>
                    </div>
                  ))}

                  {selectedPoll.creatorName === 'You' && selectedPoll.status === 'active' && (
                    <button className="pv-close-btn" onClick={() => closePoll(selectedPoll.id)}>
                      CLOSE POLL
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ════════════════ RESULTS VIEW ════════════════ */}
          {view === 'results' && selectedPoll && (
            <div className="p-results-view">
              <div className="pr-header">
                <div>
                  <div className="p-view-title">{selectedPoll.title} — RESULTS</div>
                  <div className="pr-question">{selectedPoll.question}</div>
                </div>
                <button className="pr-back-btn" onClick={() => setView('list')}>BACK TO LIST</button>
              </div>

              {/* Summary Stats */}
              <div className="pr-stats">
                <div className="pr-stat"><span>TOTAL VOTES</span><span>{selectedPoll.totalVotes}</span></div>
                <div className="pr-stat"><span>PARTICIPANTS</span><span>{selectedPoll.participants}</span></div>
                <div className="pr-stat"><span>OPTIONS</span><span>{selectedPoll.options.length}</span></div>
                <div className="pr-stat"><span>TYPE</span><span>{selectedPoll.isMultipleChoice ? 'MULTI' : 'SINGLE'}</span></div>
                <div className="pr-stat"><span>ANONYMOUS</span><span>{selectedPoll.isAnonymous ? 'YES' : 'NO'}</span></div>
                <div className="pr-stat"><span>STATUS</span><span className={statClass(selectedPoll.status)}>{selectedPoll.status.toUpperCase()}</span></div>
              </div>

              {/* Visual Results */}
              <div className="pr-results-grid">
                {/* Bar chart style */}
                <div className="pr-panel">
                  <div className="pr-panel-title">VOTE DISTRIBUTION</div>
                  {[...selectedPoll.options].sort((a, b) => b.votes.length - a.votes.length).map((opt, i) => {
                    const pct = getPct(opt.votes.length, selectedPoll.totalVotes)
                    const isWinner = i === 0 && opt.votes.length > 0
                    return (
                      <div key={opt.id} className="pr-bar-row">
                        <div className="pr-bar-rank">#{i + 1}</div>
                        <div className="pr-bar-info">
                          <div className="pr-bar-label">
                            {opt.text}
                            {isWinner && <span className="pr-winner">LEADING</span>}
                          </div>
                          <div className="pr-bar-track">
                            <div className="pr-bar-fill" style={{ width: `${pct}%`, background: opt.color }} />
                          </div>
                          <div className="pr-bar-meta">
                            <span>{opt.votes.length} votes</span>
                            <span>{pct}%</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Summary panel */}
                <div className="pr-summary-panel">
                  <div className="pr-panel-title">POLL SUMMARY</div>
                  {[
                    ['CODE', selectedPoll.code],
                    ['CREATOR', selectedPoll.creatorName],
                    ['CATEGORY', selectedPoll.category],
                    ['STATUS', selectedPoll.status.toUpperCase()],
                    ['TYPE', selectedPoll.isMultipleChoice ? 'Multiple Choice' : 'Single Choice'],
                    ['ANONYMOUS', selectedPoll.isAnonymous ? 'Yes' : 'No'],
                    ['MAX PARTICIPANTS', selectedPoll.maxParticipants.toString()],
                    ['ACTUAL VOTERS', selectedPoll.participants.toString()],
                    ['PARTICIPATION', `${Math.round((selectedPoll.participants / selectedPoll.maxParticipants) * 100)}%`],
                    ['TOTAL VOTES', selectedPoll.totalVotes.toString()],
                    ['LEADING OPTION', [...selectedPoll.options].sort((a, b) => b.votes.length - a.votes.length)[0]?.text || 'N/A'],
                    ['CREATED BY', selectedPoll.creatorName],
                  ].map(([k, v]) => (
                    <div key={k} className="pr-sum-row"><span>{k}</span><span>{v}</span></div>
                  ))}

                  <div className="pr-actions">
                    {selectedPoll.status !== 'ended' && (
                      <button className="pr-btn primary" onClick={() => { setView('vote') }}>OPEN POLL</button>
                    )}
                    <button className="pr-btn secondary" onClick={() => { setSelectedPoll(selectedPoll); setView('vote') }}>LIVE VIEW</button>
                  </div>
                </div>
              </div>

              {/* Vote feed */}
              <div className="pr-feed-title">RECENT VOTE ACTIVITY</div>
              <div className="pr-feed">
                {liveEvents.filter(ev => ev.pollId === selectedPoll.id).length === 0
                  ? <div className="pr-feed-empty">No vote activity recorded</div>
                  : liveEvents.filter(ev => ev.pollId === selectedPoll.id).map((ev, i) => (
                    <div key={i} className="pr-feed-row">
                      <span className="pr-feed-idx">{String(i + 1).padStart(3, '0')}</span>
                      <span className="pr-feed-voter">{selectedPoll.isAnonymous ? 'ANONYMOUS' : ev.voter}</span>
                      <span className="pr-feed-opt">{ev.option}</span>
                      <span className="pr-feed-time">{ft(ev.timestamp)}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* ════════════════ CREATE VIEW ════════════════ */}
          {view === 'create' && !createDone && (
            <div className="p-create-view">
              <div className="p-view-title">CREATE POLL</div>
              <div className="pc-layout">
                {/* Left: Form */}
                <div className="pc-form">
                  <div className="pc-section-title">POLL DETAILS</div>
                  <div className="pc-field">
                    <label>POLL TITLE</label>
                    <input className="pc-input" value={draftTitle} onChange={e => setDraftTitle(e.target.value)} placeholder="e.g., Course Feedback 2024" />
                  </div>
                  <div className="pc-field">
                    <label>QUESTION</label>
                    <textarea className="pc-input pc-textarea" rows={2} value={draftQuestion} onChange={e => setDraftQuestion(e.target.value)} placeholder="What would you like to ask?" />
                  </div>
                  <div className="pc-field">
                    <label>CATEGORY</label>
                    <select className="pc-input" value={draftCategory} onChange={e => setDraftCategory(e.target.value)}>
                      {['General', 'Technical', 'Feedback', 'Product', 'Scheduling', 'Academic'].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="pc-grid2">
                    <div className="pc-field">
                      <label>DURATION (MINUTES)</label>
                      <input className="pc-input" type="number" min={1} max={120} value={draftDuration} onChange={e => setDraftDuration(+e.target.value)} />
                    </div>
                    <div className="pc-field">
                      <label>MAX PARTICIPANTS</label>
                      <input className="pc-input" type="number" min={2} max={200} value={draftMaxPart} onChange={e => setDraftMaxPart(+e.target.value)} />
                    </div>
                  </div>

                  <div className="pc-section-title" style={{ marginTop: 16 }}>OPTIONS ({draftOptions.length}/6)</div>
                  {draftOptions.map((opt, i) => (
                    <div key={i} className="pc-opt-row">
                      <span className="pc-opt-letter">{String.fromCharCode(65 + i)}</span>
                      <input
                        className="pc-input pc-opt-inp"
                        value={opt}
                        placeholder={`Option ${String.fromCharCode(65 + i)}`}
                        onChange={e => {
                          const opts = [...draftOptions]; opts[i] = e.target.value
                          setDraftOptions(opts)
                        }}
                      />
                      {draftOptions.length > 2 && (
                        <button className="pc-opt-rm" onClick={() => removeOption(i)}>×</button>
                      )}
                    </div>
                  ))}
                  {draftOptions.length < 6 && (
                    <button className="pc-add-opt" onClick={addOption}>+ ADD OPTION</button>
                  )}
                </div>

                {/* Right: Settings */}
                <div className="pc-settings">
                  <div className="pc-section-title">POLL SETTINGS</div>
                  {[
                    { label: 'MULTIPLE CHOICE', sub: 'Allow selecting more than one option', val: draftMultiple, set: setDraftMultiple },
                    { label: 'ANONYMOUS VOTING', sub: 'Hide voter identities from results', val: draftAnonymous, set: setDraftAnonymous },
                    { label: 'LOCKED SESSION', sub: 'Require password to participate', val: draftLocked, set: setDraftLocked },
                    { label: 'SHOW RESULTS LIVE', sub: 'Display percentages before voting', val: draftShowBefore, set: setDraftShowBefore },
                    { label: 'ALLOW VOTE CHANGE', sub: 'Let voters change their answer', val: draftAllowChange, set: setDraftAllowChange },
                  ].map(s => (
                    <div key={s.label} className="pc-setting-card">
                      <div className="pc-sc-info">
                        <div className="pc-sc-label">{s.label}</div>
                        <div className="pc-sc-sub">{s.sub}</div>
                      </div>
                      <button className={`pc-toggle ${s.val ? 'pc-toggle-on' : ''}`} onClick={() => s.set(!s.val)}>
                        <span className="pc-toggle-knob" />
                      </button>
                    </div>
                  ))}

                  {/* Preview */}
                  <div className="pc-section-title" style={{ marginTop: 16 }}>PREVIEW</div>
                  <div className="pc-preview">
                    <div className="pc-prev-title">{draftTitle || '(no title)'}</div>
                    <div className="pc-prev-q">{draftQuestion || '(no question)'}</div>
                    <div className="pc-prev-opts">
                      {draftOptions.filter(o => o.trim()).map((o, i) => (
                        <div key={i} className="pc-prev-opt">
                          <span>{String.fromCharCode(65 + i)}</span>
                          <span>{o}</span>
                        </div>
                      ))}
                    </div>
                    <div className="pc-prev-meta">
                      <span>{draftDuration}m</span>
                      <span>{draftMultiple ? 'MULTI' : 'SINGLE'}</span>
                      <span>{draftAnonymous ? 'ANON' : 'PUBLIC'}</span>
                      <span>{draftLocked ? 'PRIVATE' : 'OPEN'}</span>
                    </div>
                  </div>

                  <button
                    className="pc-create-btn"
                    onClick={handleCreate}
                    disabled={!draftTitle.trim() || !draftQuestion.trim() || draftOptions.filter(o => o.trim()).length < 2}
                  >
                    PUBLISH POLL
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Create Done ── */}
          {view === 'create' && createDone && (
            <div className="pc-published">
              <div className="pc-pub-title">POLL PUBLISHED</div>
              <div className="pc-pub-sub">Share these credentials with your participants</div>
              <div className="pc-pub-creds">
                <div className="pc-pub-cred">
                  <span>POLL CODE</span>
                  <span className="pc-pub-code">{genCode}</span>
                </div>
                {genPass && (
                  <div className="pc-pub-cred">
                    <span>PASSWORD</span>
                    <span className="pc-pub-pass">{genPass}</span>
                  </div>
                )}
              </div>
              <div className="pc-pub-details">
                <div className="pc-pd-row"><span>TITLE</span><span>{draftTitle}</span></div>
                <div className="pc-pd-row"><span>QUESTION</span><span>{draftQuestion.substring(0, 50)}</span></div>
                <div className="pc-pd-row"><span>OPTIONS</span><span>{draftOptions.filter(o => o.trim()).length}</span></div>
                <div className="pc-pd-row"><span>DURATION</span><span>{draftDuration} minutes</span></div>
                <div className="pc-pd-row"><span>TYPE</span><span>{draftMultiple ? 'MULTIPLE CHOICE' : 'SINGLE CHOICE'}</span></div>
                <div className="pc-pd-row"><span>ANONYMOUS</span><span>{draftAnonymous ? 'YES' : 'NO'}</span></div>
              </div>
              <div className="pc-pub-acts">
                <button className="pr-btn primary" onClick={() => { setSelectedPoll(polls.find(p => p.code === genCode) || null); setView('vote') }}>OPEN POLL</button>
                <button className="pr-btn secondary" onClick={() => { resetCreate(); setView('list') }}>VIEW LIST</button>
                <button className="pr-btn secondary" onClick={resetCreate}>CREATE ANOTHER</button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Scan line */}
      <div className="p-scan-line" />

      {/* ══════════════════ STYLES ══════════════════ */}
      <style>{`
        * { margin:0; padding:0; box-sizing:border-box; }

        .proot {
          min-height:calc(100vh - 56px);
          background:#030303; color:#ffffff;
          font-family:'SF Mono','Monaco','Fira Code',monospace;
          font-size:11px; display:flex; flex-direction:column;
          gap:1px; position:relative; overflow-x:hidden; overflow-y:auto;
        }
        .proot::-webkit-scrollbar{width:4px}
        .proot::-webkit-scrollbar-track{background:#111}
        .proot::-webkit-scrollbar-thumb{background:#222}
        .proot::-webkit-scrollbar-thumb:hover{background:#1e3a5f}
        *{scrollbar-width:thin;scrollbar-color:#222 #111}

        /* ── PAGE HEADER ── */
        .p-page-header{background:#0a0a0a;border:1px solid #1e3a5f;padding:12px 20px;display:flex;justify-content:space-between;align-items:center;position:relative;overflow:hidden;flex-shrink:0}
        .p-page-header::before{content:'';position:absolute;top:0;left:-100%;width:100%;height:2px;background:linear-gradient(90deg,transparent,#1e3a5f,transparent);animation:pscanline 3s linear infinite}
        @keyframes pscanline{0%{left:-100%}100%{left:100%}}
        .p-page-title{display:flex;flex-direction:column;gap:3px}
        .p-title-text{color:#1e3a5f;font-size:18px;font-weight:700;letter-spacing:3px;text-shadow:0 0 8px #1e3a5f}
        .p-title-sub{font-size:8px;opacity:0.35;letter-spacing:2px}
        .p-page-meta{display:flex;align-items:center;gap:14px;background:#050505;padding:6px 12px;border:1px solid #1e3a5f}
        .p-version{color:#1e3a5f;font-size:9px}
        .p-time{font-size:10px}
        .p-log-box{border-left:1px solid #1e3a5f;padding-left:12px}
        .p-log-line{font-size:9px;opacity:0.7;animation:pfadeIn 0.3s ease}
        @keyframes pfadeIn{from{opacity:0;transform:translateX(8px)}to{opacity:1;transform:translateX(0)}}

        /* ── STATS ── */
        .p-stats-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:1px;background:#1e3a5f;border:1px solid #1e3a5f;flex-shrink:0}
        .p-stat-card{background:#0a0a0a;padding:12px 14px;display:flex;flex-direction:column;gap:6px;transition:transform 0.2s,box-shadow 0.2s}
        .p-stat-card:hover{transform:translateY(-2px);box-shadow:0 4px 18px rgba(30,58,95,0.3)}
        .psc-head{display:flex;justify-content:space-between;align-items:center;padding-bottom:5px;border-bottom:1px solid #1e3a5f}
        .psc-head span:first-child{font-size:9px;opacity:0.6;letter-spacing:0.5px}
        .psc-val{font-size:14px;font-weight:700}
        .psc-bar{height:2px;background:#1a1a1a;overflow:hidden}
        .psc-fill{height:100%;background:#1e3a5f;transition:width 0.5s}

        /* ── MAIN ── */
        .p-main{display:flex;flex:1;gap:1px;background:#1e3a5f;border:1px solid #1e3a5f;min-height:0}

        /* ── SIDEBAR ── */
        .p-sidebar{width:260px;min-width:260px;background:#0a0a0a;display:flex;flex-direction:column;overflow-y:auto}
        .p-sidebar::-webkit-scrollbar{width:4px}
        .p-sidebar::-webkit-scrollbar-track{background:#111}
        .p-sidebar::-webkit-scrollbar-thumb{background:#222}
        .p-sidebar::-webkit-scrollbar-thumb:hover{background:#1e3a5f}
        .p-sb-section{padding:12px 14px;border-bottom:1px solid #1e3a5f;flex-shrink:0}
        .p-sb-flex{flex:1}
        .p-sb-title{font-size:7px;letter-spacing:1.5px;opacity:0.35;margin-bottom:8px}
        .p-sb-btn{width:100%;background:none;border:none;color:#fff;font-family:inherit;font-size:10px;padding:7px 0;text-align:left;cursor:pointer;opacity:0.5;display:flex;align-items:center;gap:7px;transition:opacity 0.15s;border-bottom:1px dotted #111}
        .p-sb-btn:hover{opacity:0.85}
        .p-sb-btn.p-sb-active{opacity:1}
        .p-sb-arrow{color:#1e3a5f;font-size:10px;width:10px}
        .p-sb-poll{padding:6px 0;border-bottom:1px dotted #111;cursor:pointer}
        .p-sb-poll:hover .p-sb-pname{opacity:1}
        .p-sb-poll-top{display:flex;align-items:center;gap:6px;margin-bottom:3px}
        .p-sb-dot{width:5px;height:5px;border-radius:50%;background:#4a90d9;flex-shrink:0;animation:pdot 2s infinite}
        @keyframes pdot{0%,100%{opacity:1}50%{opacity:0.3}}
        .p-sb-pname{font-size:9px;opacity:0.8;transition:opacity 0.15s}
        .p-sb-pmeta{display:flex;justify-content:space-between;font-size:7px;opacity:0.45;margin-bottom:3px}
        .p-sb-timer{color:#6ab4ff}
        .p-sb-pbar{height:2px;background:#111}
        .p-sb-pfill{height:100%;background:#1e3a5f;transition:width 0.5s}
        .p-sb-events{display:flex;flex-direction:column;gap:2px;max-height:130px;overflow-y:auto}
        .p-sb-ev{display:flex;align-items:center;gap:6px;padding:2px 0;border-bottom:1px dotted #0d0d0d;font-size:8px}
        .p-sb-ev-voter{flex:0 0 60px;opacity:0.5;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .p-sb-ev-opt{flex:1;opacity:0.8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .p-sb-ev-time{flex-shrink:0;opacity:0.35;font-size:7px;font-family:monospace}
        .p-sb-ev-empty{font-size:8px;opacity:0.2;font-style:italic}
        .p-sb-logs{display:flex;flex-direction:column;gap:2px;max-height:120px;overflow-y:auto}
        .p-sb-log{font-size:8px;opacity:0.5;padding:2px 0;border-bottom:1px dotted #0d0d0d;font-family:monospace}
        .p-sb-log-empty{font-size:8px;opacity:0.2;font-style:italic}

        /* ── CONTENT ── */
        .p-content{flex:1;background:#0a0a0a;overflow-y:auto;padding:20px;min-width:0}
        .p-content::-webkit-scrollbar{width:4px}
        .p-content::-webkit-scrollbar-track{background:#111}
        .p-content::-webkit-scrollbar-thumb{background:#222}
        .p-content::-webkit-scrollbar-thumb:hover{background:#1e3a5f}
        .p-view-title{font-size:13px;font-weight:700;letter-spacing:2px;margin-bottom:16px;border-left:3px solid #1e3a5f;padding-left:10px}

        /* ── TOOLBAR ── */
        .p-toolbar{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px;flex-wrap:wrap}
        .p-toolbar-right{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
        .p-search{background:#0e0e0e;border:1px solid #1e3a5f;color:#fff;padding:6px 12px;font-size:10px;font-family:inherit;outline:none;width:220px;transition:border-color 0.2s}
        .p-search:focus{border-color:rgba(255,255,255,0.3)}
        .p-search::placeholder{opacity:0.28}
        .p-filters{display:flex;gap:3px}
        .p-fbtn{background:none;border:1px solid #141414;color:#fff;opacity:0.4;font-size:7px;padding:3px 8px;cursor:pointer;font-family:inherit;letter-spacing:0.5px;transition:all 0.15s}
        .p-fbtn:hover{opacity:0.75}
        .p-fbtn.p-factive{opacity:1;border-color:#1e3a5f;background:rgba(30,58,95,0.18)}
        .p-cat-sel{background:#0e0e0e;border:1px solid #1a1a1a;color:#fff;padding:3px 8px;font-size:8px;font-family:inherit;outline:none;cursor:pointer}

        /* ── TABLE ── */
        .p-table-header{display:grid;grid-template-columns:2.5fr 80px 100px 90px 80px 90px 50px 90px 100px;padding:6px 10px;background:#070707;border:1px solid #1e3a5f;border-bottom:none;font-size:7px;letter-spacing:1px;opacity:0.45}
        .p-table-body{border:1px solid #1e3a5f}
        .p-table-row{display:grid;grid-template-columns:2.5fr 80px 100px 90px 80px 90px 50px 90px 100px;padding:9px 10px;border-bottom:1px solid #0d0d0d;align-items:center;font-size:9px;transition:background 0.15s}
        .p-table-row:hover{background:#0e0e0e}
        .p-table-row:last-child{border-bottom:none}
        .p-empty{padding:30px;text-align:center;opacity:0.25;font-size:10px}
        .p-row-title{display:flex;flex-direction:column;gap:2px}
        .p-row-name{font-size:10px;font-weight:600}
        .p-row-q{font-size:7px;opacity:0.4}
        .p-row-code{font-family:monospace;font-size:9px;opacity:0.75}
        .p-row-creator{font-size:8px;opacity:0.6}
        .p-row-type{display:flex;gap:4px;flex-wrap:wrap}
        .p-type{font-size:6px;padding:2px 5px;border-radius:1px}
        .p-type-single{background:rgba(30,58,95,0.3);color:#6ab4ff}
        .p-type-multi{background:rgba(60,95,30,0.3);color:#6dba72}
        .p-type-anon{background:rgba(80,80,80,0.3);color:#888}
        .p-status{font-size:7px;padding:2px 5px;border-radius:1px}
        .pstat-active{background:rgba(30,58,95,0.4);color:#6ab4ff}
        .pstat-sched{background:rgba(200,150,50,0.2);color:#c8964a}
        .pstat-ended{background:rgba(80,80,80,0.3);color:#888}
        .pstat-paused{background:rgba(180,60,60,0.2);color:#c86060}
        .p-row-voters{display:flex;flex-direction:column;gap:2px}
        .p-mini-bar{height:2px;background:#1a1a1a}
        .p-mini-fill{height:100%;background:#1e3a5f}
        .p-row-remain{font-family:monospace;font-size:8px}
        .p-ended{opacity:0.35}
        .p-row-acts{display:flex;gap:5px}
        .p-act-vote,.p-act-view{background:none;border:1px solid #1a1a1a;color:#fff;font-size:7px;padding:3px 7px;cursor:pointer;font-family:inherit;letter-spacing:0.5px;transition:all 0.15s}
        .p-act-vote{background:#1e3a5f;border-color:#1e3a5f}
        .p-act-vote:hover{background:#2a4a7a}
        .p-act-view:hover{border-color:#1e3a5f;background:rgba(30,58,95,0.2)}
        .p-table-footer{display:flex;gap:24px;padding:6px 10px;background:#070707;border:1px solid #1e3a5f;border-top:none;font-size:7px;opacity:0.35;letter-spacing:0.5px}

        /* ── JOIN VIEW ── */
        .p-join-view{display:flex;flex-direction:column;gap:16px}
        .p-join-section-title{font-size:8px;letter-spacing:1.5px;opacity:0.35;margin-bottom:8px}
        .p-join-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:4px}
        .p-join-card{background:#0e0e0e;border:1px solid #1a1a1a;padding:12px;cursor:pointer;transition:border-color 0.15s}
        .p-join-card:hover{border-color:#1e3a5f}
        .p-join-sel{border-color:#1e3a5f!important;background:rgba(30,58,95,0.1)}
        .pjc-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px}
        .pjc-title{font-size:10px;font-weight:600;margin-bottom:2px}
        .pjc-code{font-size:7px;opacity:0.4;font-family:monospace}
        .pjc-question{font-size:8px;opacity:0.55;margin-bottom:8px;line-height:1.4}
        .pjc-meta{display:flex;flex-direction:column;gap:2px;margin-bottom:6px}
        .pjc-row{display:flex;justify-content:space-between;font-size:7px;padding:2px 0;border-bottom:1px dotted #0d0d0d}
        .pjc-row span:first-child{opacity:0.4}
        .pjc-bar{height:2px;background:#1a1a1a}
        .pjc-fill{height:100%;background:#1e3a5f;transition:width 0.5s}
        .p-join-manual{display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:16px;background:#070707;border:1px solid #1e3a5f}
        .p-join-form{display:flex;flex-direction:column;gap:10px}
        .p-jfield{display:flex;flex-direction:column;gap:4px}
        .p-jfield label{font-size:7px;opacity:0.45;letter-spacing:1px}
        .p-code-input{background:#0e0e0e;border:1px solid #1e3a5f;color:#fff;padding:9px 12px;font-size:14px;font-family:monospace;letter-spacing:4px;text-align:center;outline:none;width:100%}
        .p-code-input:focus{border-color:#fff}
        .p-pass-input{font-size:12px;letter-spacing:2px}
        .p-join-submit{background:#1e3a5f;border:none;color:#fff;padding:10px;font-size:10px;cursor:pointer;font-family:inherit;letter-spacing:1px;transition:background 0.2s;margin-top:4px}
        .p-join-submit:hover:not(:disabled){background:#2a4a7a}
        .p-join-submit:disabled{opacity:0.35;cursor:not-allowed}
        .p-join-info{display:flex;flex-direction:column;gap:4px;justify-content:center}
        .p-info-row{display:flex;justify-content:space-between;font-size:8px;padding:4px 0;border-bottom:1px dotted #111}
        .p-info-row span:first-child{opacity:0.4}

        /* ── VOTE VIEW ── */
        .p-vote-view{display:flex;flex-direction:column;gap:12px}
        .pv-header{display:flex;justify-content:space-between;align-items:flex-start;padding:14px 16px;background:#070707;border:1px solid #1e3a5f}
        .pv-category{font-size:7px;opacity:0.4;letter-spacing:1px;margin-bottom:3px}
        .pv-title{font-size:14px;font-weight:700;margin-bottom:4px}
        .pv-question{font-size:10px;opacity:0.7;line-height:1.5;max-width:600px}
        .pv-head-right{display:flex;gap:12px;flex-shrink:0}
        .pv-stat-box{display:flex;flex-direction:column;align-items:flex-end}
        .pv-stat-box span:first-child{font-size:7px;opacity:0.35}
        .pv-stat-box span:last-child{font-size:13px;font-weight:700;font-family:monospace}
        .pv-warn{color:#c86060;animation:pdot 0.5s infinite}
        .pv-badges{display:flex;gap:6px;flex-wrap:wrap}
        .pv-badge{font-size:7px;padding:2px 8px;letter-spacing:0.5px;border-radius:1px}
        .pv-badge-multi{background:rgba(60,95,30,0.3);color:#6dba72;border:1px solid rgba(109,186,114,0.2)}
        .pv-badge-anon{background:rgba(80,80,80,0.3);color:#aaa;border:1px solid #333}
        .pv-badge-locked{background:rgba(180,60,60,0.2);color:#c86060;border:1px solid rgba(200,96,96,0.2)}
        .pv-badge-change{background:rgba(200,150,50,0.2);color:#c8964a;border:1px solid rgba(200,150,50,0.2)}
        .pv-body{display:grid;grid-template-columns:1fr 260px;gap:12px}
        .pv-options-panel{background:#090909;border:1px solid #1e3a5f;padding:14px;display:flex;flex-direction:column;gap:8px}
        .pv-panel-title{font-size:7px;letter-spacing:1.5px;opacity:0.35;margin-bottom:4px}
        .pv-opt{display:flex;flex-direction:column;gap:4px}
        .pv-opt-pulse .pv-opt-btn{animation:ppulse 0.8s ease}
        @keyframes ppulse{0%{border-color:#1e3a5f;background:rgba(30,58,95,0.2)}50%{border-color:#4a90d9;background:rgba(74,144,217,0.15)}100%{border-color:#1e3a5f;background:transparent}}
        .pv-opt-btn{display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:#0e0e0e;border:1px solid #1a1a1a;color:#fff;cursor:pointer;font-family:inherit;font-size:10px;text-align:left;transition:all 0.15s;width:100%}
        .pv-opt-btn:hover:not(.pv-opt-disabled){border-color:#1e3a5f;background:#111}
        .pv-opted{background:rgba(30,58,95,0.25)!important;border-color:#1e3a5f!important}
        .pv-opt-disabled{opacity:0.5;cursor:default}
        .pv-opt-left{display:flex;align-items:center;gap:10px}
        .pv-opt-check{font-size:13px;opacity:0.4;flex-shrink:0;transition:opacity 0.2s}
        .pv-check-on{opacity:1;color:#6ab4ff}
        .pv-opt-text{font-size:10px}
        .pv-opt-right{display:flex;align-items:center;gap:10px}
        .pv-opt-pct{font-size:11px;font-weight:700;font-family:monospace}
        .pv-opt-count{font-size:8px;opacity:0.45}
        .pv-opt-bar-wrap{padding:0 2px}
        .pv-opt-bar{height:3px;background:#111;overflow:hidden}
        .pv-opt-fill{height:100%;transition:width 0.5s}
        .pv-voted-msg{font-size:8px;letter-spacing:1px;opacity:0.5;text-align:center;padding:8px;border:1px solid #1e3a5f;background:#070707;margin-top:4px}
        .pv-hint{font-size:8px;opacity:0.3;text-align:center;padding:8px}
        .pv-live-panel{background:#090909;border:1px solid #1e3a5f;padding:12px;display:flex;flex-direction:column;gap:6px}
        .pv-live-list{display:flex;flex-direction:column;gap:4px;max-height:160px;overflow-y:auto;margin-bottom:4px}
        .pv-live-empty{font-size:8px;opacity:0.2;font-style:italic}
        .pv-live-ev{display:flex;align-items:center;gap:6px;padding:3px 0;border-bottom:1px dotted #0d0d0d}
        .pv-ev-dot{width:4px;height:4px;border-radius:50%;background:#4a90d9;flex-shrink:0;animation:pdot 2s infinite}
        .pv-ev-voter{font-size:8px;opacity:0.5;width:70px;flex-shrink:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .pv-ev-opt{font-size:8px;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .pv-ev-time{font-size:7px;opacity:0.35;font-family:monospace;flex-shrink:0}
        .pv-breakdown-row{display:flex;align-items:center;gap:6px;padding:3px 0}
        .pv-bd-label{font-size:8px;width:90px;flex-shrink:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;opacity:0.7}
        .pv-bd-bar{flex:1;height:4px;background:#111;overflow:hidden}
        .pv-bd-fill{height:100%;transition:width 0.5s}
        .pv-bd-pct{font-size:8px;width:28px;text-align:right;flex-shrink:0;font-family:monospace}
        .pv-close-btn{margin-top:10px;width:100%;background:none;border:1px solid rgba(180,60,60,0.4);color:#c86060;padding:6px;font-size:8px;cursor:pointer;font-family:inherit;letter-spacing:1px;transition:all 0.2s}
        .pv-close-btn:hover{background:rgba(180,60,60,0.1)}

        /* ── RESULTS VIEW ── */
        .p-results-view{display:flex;flex-direction:column;gap:14px}
        .pr-header{display:flex;justify-content:space-between;align-items:flex-start}
        .pr-question{font-size:9px;opacity:0.5;margin-top:4px;max-width:600px}
        .pr-back-btn{background:none;border:1px solid #1a1a1a;color:#fff;padding:5px 12px;font-size:8px;cursor:pointer;font-family:inherit;letter-spacing:0.5px;transition:border-color 0.2s;flex-shrink:0}
        .pr-back-btn:hover{border-color:#1e3a5f}
        .pr-stats{display:grid;grid-template-columns:repeat(6,1fr);gap:6px}
        .pr-stat{background:#090909;border:1px solid #111;padding:8px 10px;display:flex;flex-direction:column;gap:3px}
        .pr-stat span:first-child{font-size:7px;opacity:0.35}
        .pr-stat span:last-child{font-size:12px;font-weight:700}
        .pr-results-grid{display:grid;grid-template-columns:1fr 280px;gap:12px}
        .pr-panel,.pr-summary-panel{background:#090909;border:1px solid #1e3a5f;padding:14px;display:flex;flex-direction:column;gap:6px}
        .pr-panel-title{font-size:7px;letter-spacing:1.5px;opacity:0.35;margin-bottom:4px}
        .pr-bar-row{display:flex;align-items:flex-start;gap:8px;padding:6px 0;border-bottom:1px dotted #0d0d0d}
        .pr-bar-rank{font-size:9px;opacity:0.4;font-weight:700;width:20px;flex-shrink:0;padding-top:2px}
        .pr-bar-info{flex:1;display:flex;flex-direction:column;gap:3px}
        .pr-bar-label{font-size:9px;display:flex;align-items:center;gap:8px}
        .pr-winner{font-size:6px;color:#6dba72;border:1px solid rgba(109,186,114,0.3);padding:1px 5px;letter-spacing:0.5px}
        .pr-bar-track{height:5px;background:#111;overflow:hidden}
        .pr-bar-fill{height:100%;transition:width 0.5s}
        .pr-bar-meta{display:flex;justify-content:space-between;font-size:7px;opacity:0.45}
        .pr-sum-row{display:flex;justify-content:space-between;font-size:8px;padding:4px 0;border-bottom:1px dotted #0d0d0d}
        .pr-sum-row span:first-child{opacity:0.4}
        .pr-actions{display:flex;gap:6px;margin-top:8px}
        .pr-btn{padding:8px 20px;font-size:9px;cursor:pointer;font-family:inherit;letter-spacing:1px;transition:all 0.2s}
        .pr-btn.primary{background:#1e3a5f;border:none;color:#fff}
        .pr-btn.primary:hover{background:#2a4a7a}
        .pr-btn.secondary{background:none;border:1px solid #1a1a1a;color:#fff;flex:1}
        .pr-btn.secondary:hover{border-color:#1e3a5f}
        .pr-feed-title{font-size:8px;letter-spacing:1.5px;opacity:0.35}
        .pr-feed{display:flex;flex-direction:column;gap:2px;border:1px solid #1e3a5f;max-height:200px;overflow-y:auto}
        .pr-feed::-webkit-scrollbar{width:4px}
        .pr-feed::-webkit-scrollbar-track{background:#111}
        .pr-feed::-webkit-scrollbar-thumb{background:#222}
        .pr-feed-empty{padding:20px;text-align:center;opacity:0.2;font-size:9px}
        .pr-feed-row{display:grid;grid-template-columns:40px 140px 1fr 90px;gap:8px;padding:5px 10px;border-bottom:1px solid #0d0d0d;font-size:8px;align-items:center}
        .pr-feed-row:hover{background:#0e0e0e}
        .pr-feed-idx{opacity:0.25;font-family:monospace}
        .pr-feed-voter{opacity:0.6;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .pr-feed-opt{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .pr-feed-time{font-family:monospace;opacity:0.4;font-size:7px}

        /* ── CREATE VIEW ── */
        .p-create-view{display:flex;flex-direction:column;gap:12px}
        .pc-layout{display:grid;grid-template-columns:1fr 340px;gap:12px}
        .pc-form,.pc-settings{background:#090909;border:1px solid #1e3a5f;padding:16px;display:flex;flex-direction:column;gap:8px}
        .pc-section-title{font-size:7px;letter-spacing:1.5px;opacity:0.35;margin-bottom:4px}
        .pc-field{display:flex;flex-direction:column;gap:4px}
        .pc-field label{font-size:7px;opacity:0.45;letter-spacing:1px}
        .pc-input{background:#0e0e0e;border:1px solid #1a1a1a;color:#fff;padding:7px 10px;font-size:10px;font-family:inherit;outline:none;transition:border-color 0.15s;width:100%}
        .pc-input:focus{border-color:#1e3a5f}
        .pc-input::placeholder{opacity:0.25}
        .pc-textarea{resize:vertical;min-height:52px;line-height:1.5}
        select.pc-input{cursor:pointer}
        .pc-grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        .pc-opt-row{display:flex;align-items:center;gap:8px;margin-bottom:4px}
        .pc-opt-letter{font-size:9px;opacity:0.5;width:14px;flex-shrink:0;font-weight:700}
        .pc-opt-inp{flex:1}
        .pc-opt-rm{background:none;border:none;color:#555;font-size:16px;cursor:pointer;line-height:1;flex-shrink:0}
        .pc-opt-rm:hover{color:#fff}
        .pc-add-opt{background:none;border:1px dashed #1a1a1a;color:#fff;opacity:0.5;padding:5px;font-size:8px;cursor:pointer;font-family:inherit;transition:all 0.15s;letter-spacing:1px}
        .pc-add-opt:hover{opacity:0.85;border-color:#1e3a5f}
        .pc-setting-card{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:8px;border:1px solid #111;transition:border-color 0.15s}
        .pc-setting-card:hover{border-color:#1e3a5f}
        .pc-sc-label{font-size:9px;margin-bottom:2px}
        .pc-sc-sub{font-size:7px;opacity:0.35}
        .pc-toggle{width:34px;height:17px;border-radius:8px;background:#1a1a1a;border:1px solid #222;position:relative;cursor:pointer;flex-shrink:0;transition:background 0.2s}
        .pc-toggle-on{background:#1e3a5f;border-color:#1e3a5f}
        .pc-toggle-knob{position:absolute;top:2px;left:2px;width:11px;height:11px;border-radius:50%;background:#555;transition:transform 0.2s,background 0.2s}
        .pc-toggle-on .pc-toggle-knob{transform:translateX(17px);background:#fff}
        .pc-preview{background:#070707;border:1px solid #111;padding:10px;display:flex;flex-direction:column;gap:6px}
        .pc-prev-title{font-size:10px;font-weight:600}
        .pc-prev-q{font-size:8px;opacity:0.6;line-height:1.4}
        .pc-prev-opts{display:flex;flex-direction:column;gap:2px}
        .pc-prev-opt{display:flex;gap:8px;font-size:8px;padding:2px 0}
        .pc-prev-opt span:first-child{opacity:0.4;flex-shrink:0}
        .pc-prev-meta{display:flex;gap:8px;font-size:7px;opacity:0.35;margin-top:4px}
        .pc-create-btn{width:100%;background:#1e3a5f;border:none;color:#fff;padding:10px;font-size:10px;cursor:pointer;font-family:inherit;letter-spacing:1px;transition:background 0.2s;margin-top:8px}
        .pc-create-btn:hover:not(:disabled){background:#2a4a7a}
        .pc-create-btn:disabled{opacity:0.35;cursor:not-allowed}
        .pc-published{display:flex;flex-direction:column;align-items:center;gap:20px;text-align:center;padding:40px;background:#090909;border:1px solid #1e3a5f}
        .pc-pub-title{font-size:16px;font-weight:700;letter-spacing:3px;color:#6ab4ff}
        .pc-pub-sub{font-size:9px;opacity:0.4}
        .pc-pub-creds{display:flex;gap:20px;flex-wrap:wrap;justify-content:center}
        .pc-pub-cred{background:#070707;border:1px solid #1e3a5f;padding:16px 28px;display:flex;flex-direction:column;gap:6px;align-items:center}
        .pc-pub-cred>span:first-child{font-size:7px;opacity:0.4;letter-spacing:1px}
        .pc-pub-code{font-size:28px;font-weight:700;letter-spacing:6px}
        .pc-pub-pass{font-size:24px;font-weight:700;letter-spacing:4px;color:#6ab4ff}
        .pc-pub-details{background:#070707;border:1px solid #1e3a5f;padding:14px 24px;min-width:320px}
        .pc-pd-row{display:flex;justify-content:space-between;font-size:9px;padding:4px 0;border-bottom:1px dotted #0d0d0d}
        .pc-pd-row span:first-child{opacity:0.4}
        .pc-pub-acts{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}

        /* Scan line */
        .p-scan-line{position:fixed;top:0;left:0;right:0;height:100%;background:linear-gradient(to bottom,transparent 0%,rgba(30,58,95,0.02) 50%,transparent 100%);pointer-events:none;animation:pscan 8s linear infinite;z-index:999}
        @keyframes pscan{0%{transform:translateY(-100%)}100%{transform:translateY(100%)}}

        /* Responsive */
        @media(max-width:1200px){.p-stats-grid{grid-template-columns:repeat(3,1fr)}.p-table-header,.p-table-row{grid-template-columns:2fr 75px 95px 85px 75px 85px 45px 85px 95px}}
        @media(max-width:1100px){.pr-results-grid{grid-template-columns:1fr}.pv-body{grid-template-columns:1fr}.p-join-grid{grid-template-columns:1fr 1fr}.pc-layout{grid-template-columns:1fr}}
        @media(max-width:768px){.p-stats-grid{grid-template-columns:repeat(2,1fr)}.p-join-grid{grid-template-columns:1fr}.p-join-manual{grid-template-columns:1fr}.pr-stats{grid-template-columns:repeat(2,1fr)}.pr-results-grid{grid-template-columns:1fr}.pr-feed-row{grid-template-columns:30px 100px 1fr 70px}}
      `}</style>
    </div>
  )
}
