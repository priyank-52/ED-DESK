// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

// ==================== TYPES ====================

interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation?: string
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
  points: number
  timeLimit?: number
}

interface QuizSession {
  id: string
  title: string
  description: string
  questions: QuizQuestion[]
  timeLimit: number
  shuffleQuestions: boolean
  shuffleOptions: boolean
  createdBy: string
  isLocked: boolean
  code: string
  participants: number
  maxParticipants: number
  status: 'active' | 'scheduled' | 'ended'
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
  avgScore: number
  attempts: number
  createdAt: Date
}

interface LiveParticipant {
  id: string
  name: string
  score: number
  answered: number
  total: number
  status: 'answering' | 'completed' | 'idle'
  joinedAt: Date
}

interface QuizStats {
  totalQuizzes: number
  activeNow: number
  participantsToday: number
  avgScore: number
  questionsAnswered: number
  topCategory: string
}

// ==================== COMPONENT ====================

export default function QuizSystem() {
  const navigate = useNavigate()

  // ── View State ──
  const [view, setView] = useState<'list' | 'join' | 'create' | 'take' | 'results' | 'leaderboard'>('list')
  const [time, setTime] = useState(new Date())
  const [logs, setLogs] = useState<string[]>([])

  // ── List / Filter ──
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'scheduled' | 'ended'>('all')
  const [filterDiff, setFilterDiff] = useState<'all' | 'easy' | 'medium' | 'hard'>('all')
  const [filterCat, setFilterCat] = useState('all')

  // ── Join ──
  const [joinCode, setJoinCode] = useState('')
  const [joinPass, setJoinPass] = useState('')

  // ── Create ──
  const [step, setStep] = useState(1)
  const [draftTitle, setDraftTitle] = useState('')
  const [draftDesc, setDraftDesc] = useState('')
  const [draftCategory, setDraftCategory] = useState('General')
  const [draftDiff, setDraftDiff] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [draftTimeLimit, setDraftTimeLimit] = useState(10)
  const [draftMaxPart, setDraftMaxPart] = useState(30)
  const [draftLocked, setDraftLocked] = useState(false)
  const [draftShuffle, setDraftShuffle] = useState(true)
  const [draftShuffleOpts, setDraftShuffleOpts] = useState(false)
  const [draftShowExpl, setDraftShowExpl] = useState(true)
  const [draftInstant, setDraftInstant] = useState(true)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [editQ, setEditQ] = useState<QuizQuestion>(blankQ())
  const [genCode, setGenCode] = useState('')
  const [genPass, setGenPass] = useState('')

  // ── Take Quiz ──
  const [activeQuiz, setActiveQuiz] = useState<QuizSession | null>(null)
  const [qIndex, setQIndex] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [revealed, setRevealed] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [quizDone, setQuizDone] = useState(false)
  const [score, setScore] = useState(0)
  const [liveBoard, setLiveBoard] = useState<LiveParticipant[]>([])
  const [questionTimer, setQuestionTimer] = useState(0)

  // ── Data ──
  const [quizzes, setQuizzes] = useState<QuizSession[]>([
    {
      id: 'q1', title: 'Data Structures & Algorithms', description: 'Arrays, linked lists, trees, sorting algorithms and complexity analysis.',
      questions: [
        { id: 'qq1', question: 'What is the time complexity of binary search?', options: ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'], correctAnswer: 1, explanation: 'Binary search halves the search space each iteration.', category: 'algorithms', difficulty: 'easy', points: 10 },
        { id: 'qq2', question: 'Which data structure uses LIFO ordering?', options: ['Queue', 'Deque', 'Stack', 'Heap'], correctAnswer: 2, explanation: 'Stack uses Last In First Out.', category: 'data-structures', difficulty: 'easy', points: 10 },
        { id: 'qq3', question: 'What is the worst-case complexity of quicksort?', options: ['O(n log n)', 'O(n)', 'O(n²)', 'O(log n)'], correctAnswer: 2, explanation: 'Worst case occurs when pivot is always min or max.', category: 'algorithms', difficulty: 'medium', points: 15 },
        { id: 'qq4', question: 'In a min-heap, where is the smallest element?', options: ['Leaf node', 'Root node', 'Last node', 'Random node'], correctAnswer: 1, explanation: 'The root of a min-heap always contains the minimum.', category: 'data-structures', difficulty: 'easy', points: 10 },
      ],
      timeLimit: 10, shuffleQuestions: true, shuffleOptions: false, createdBy: 'Prof. Sharma',
      isLocked: false, code: 'DSA101', participants: 23, maxParticipants: 40,
      status: 'active', category: 'Data Structures', difficulty: 'medium', avgScore: 74, attempts: 18, createdAt: new Date(Date.now() - 3600000)
    },
    {
      id: 'q2', title: 'JavaScript Fundamentals', description: 'Closures, prototypes, async/await, event loop and ES6+ features.',
      questions: [
        { id: 'qq5', question: 'What is a closure in JavaScript?', options: ['Function accessing outer scope variables', 'A way to close browser tabs', 'A type of for-loop', 'Error handling mechanism'], correctAnswer: 0, explanation: 'Closure is when a function remembers its outer scope.', category: 'javascript', difficulty: 'medium', points: 15 },
        { id: 'qq6', question: 'Which method adds an element to the end of an array?', options: ['shift()', 'unshift()', 'pop()', 'push()'], correctAnswer: 3, explanation: 'push() adds to end, pop() removes from end.', category: 'javascript', difficulty: 'easy', points: 10 },
        { id: 'qq7', question: 'What does the "==" operator check?', options: ['Type and value', 'Value only', 'Reference only', 'Type only'], correctAnswer: 1, explanation: '== checks value with type coercion, === checks both.', category: 'javascript', difficulty: 'easy', points: 10 },
      ],
      timeLimit: 8, shuffleQuestions: true, shuffleOptions: false, createdBy: 'Dr. Verma',
      isLocked: true, code: 'JS2024', participants: 15, maxParticipants: 30,
      status: 'active', category: 'Web Dev', difficulty: 'medium', avgScore: 82, attempts: 15, createdAt: new Date(Date.now() - 1800000)
    },
    {
      id: 'q3', title: 'Operating Systems Concepts', description: 'Process management, memory, scheduling and synchronization.',
      questions: [
        { id: 'qq8', question: 'What is a deadlock?', options: ['System crash', 'Circular wait for resources', 'High CPU usage', 'Memory overflow'], correctAnswer: 1, explanation: 'Deadlock occurs when processes wait for each other forever.', category: 'os', difficulty: 'hard', points: 20 },
        { id: 'qq9', question: 'Which scheduling algorithm gives CPU to shortest job?', options: ['FCFS', 'Round Robin', 'SJF', 'Priority'], correctAnswer: 2, explanation: 'Shortest Job First minimizes average waiting time.', category: 'os', difficulty: 'medium', points: 15 },
      ],
      timeLimit: 5, shuffleQuestions: false, shuffleOptions: false, createdBy: 'Prof. Rao',
      isLocked: true, code: 'OS404', participants: 8, maxParticipants: 25,
      status: 'scheduled', category: 'Systems', difficulty: 'hard', avgScore: 0, attempts: 0, createdAt: new Date(Date.now() - 600000)
    },
    {
      id: 'q4', title: 'Computer Networks Basics', description: 'OSI model, TCP/IP, routing protocols and network security.',
      questions: [
        { id: 'qq10', question: 'How many layers does the OSI model have?', options: ['5', '6', '7', '8'], correctAnswer: 2, explanation: 'OSI has 7 layers from Physical to Application.', category: 'networks', difficulty: 'easy', points: 10 },
      ],
      timeLimit: 6, shuffleQuestions: true, shuffleOptions: false, createdBy: 'Dr. Mehta',
      isLocked: false, code: 'NET303', participants: 31, maxParticipants: 35,
      status: 'ended', category: 'Networks', difficulty: 'easy', avgScore: 88, attempts: 31, createdAt: new Date(Date.now() - 7200000)
    },
  ])

  const [stats, setStats] = useState<QuizStats>({
    totalQuizzes: 4, activeNow: 2, participantsToday: 77,
    avgScore: 81, questionsAnswered: 342, topCategory: 'Algorithms'
  })

  // ── Effects ──

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // Live participant simulation
  useEffect(() => {
    if (!activeQuiz) return
    const interval = setInterval(() => {
      setLiveBoard(prev => prev.map(p => {
        if (p.status === 'answering' && Math.random() > 0.5) {
          const newAns = Math.min(p.answered + 1, p.total)
          return { ...p, answered: newAns, score: p.score + (Math.random() > 0.3 ? 10 : 0), status: newAns === p.total ? 'completed' : 'answering' }
        }
        return p
      }))
    }, 3000)
    return () => clearInterval(interval)
  }, [activeQuiz])

  // Quiz countdown
  useEffect(() => {
    if (view !== 'take' || quizDone || timeLeft <= 0) return
    const t = setInterval(() => {
      setTimeLeft(p => {
        if (p <= 1) { setQuizDone(true); return 0 }
        return p - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [view, quizDone, timeLeft])

  // Per-question timer
  useEffect(() => {
    if (view !== 'take' || quizDone || revealed) return
    setQuestionTimer(30)
    const t = setInterval(() => {
      setQuestionTimer(p => {
        if (p <= 1) { setRevealed(true); return 0 }
        return p - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [qIndex, view, quizDone])

  // ── Utilities ──

  function blankQ(): QuizQuestion {
    return {
      id: Math.random().toString(36).substr(2, 9),
      question: '', options: ['', '', '', ''],
      correctAnswer: 0, explanation: '',
      category: 'general', difficulty: 'easy', points: 10
    }
  }

  const ft = (d: Date) => d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const ftShort = (d: Date) => d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
  const addLog = (msg: string) => setLogs(prev => [`[${ft(new Date())}] ${msg}`, ...prev.slice(0, 29)])

  const fmtTimer = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  const diffClass = (d: string) => d === 'easy' ? 'diff-easy' : d === 'medium' ? 'diff-med' : 'diff-hard'
  const statClass = (s: string) => s === 'active' ? 'stat-active' : s === 'scheduled' ? 'stat-sched' : 'stat-ended'

  const categories = ['all', ...Array.from(new Set(quizzes.flatMap(q => [q.category])))]

  const filtered = quizzes.filter(q => {
    if (filterStatus !== 'all' && q.status !== filterStatus) return false
    if (filterDiff !== 'all' && q.difficulty !== filterDiff) return false
    if (filterCat !== 'all' && q.category !== filterCat) return false
    if (search && !q.title.toLowerCase().includes(search.toLowerCase()) && !q.code.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  // ── Actions ──

  const startQuiz = (quiz: QuizSession) => {
    const q = quiz.shuffleQuestions ? { ...quiz, questions: [...quiz.questions].sort(() => Math.random() - 0.5) } : quiz
    setActiveQuiz(q)
    setQIndex(0)
    setAnswers([])
    setRevealed(false)
    setQuizDone(false)
    setScore(0)
    setTimeLeft(quiz.timeLimit * 60)
    setView('take')
    setLiveBoard([
      { id: 'me', name: 'You', score: 0, answered: 0, total: quiz.questions.length, status: 'answering', joinedAt: new Date() },
      { id: 'p2', name: 'Student_42', score: 0, answered: 0, total: quiz.questions.length, status: 'answering', joinedAt: new Date(Date.now() - 30000) },
      { id: 'p3', name: 'Student_77', score: 0, answered: 0, total: quiz.questions.length, status: 'answering', joinedAt: new Date(Date.now() - 60000) },
      { id: 'p4', name: 'Teacher Kumar', score: 0, answered: 0, total: quiz.questions.length, status: 'answering', joinedAt: new Date(Date.now() - 90000) },
    ])
    addLog(`STARTED quiz "${quiz.title}" • ${quiz.questions.length} questions`)
  }

  const handleAnswer = (idx: number) => {
    if (revealed || answers[qIndex] !== undefined) return
    const newAns = [...answers]
    newAns[qIndex] = idx
    setAnswers(newAns)
    if (draftInstant) setRevealed(true)
    const correct = activeQuiz!.questions[qIndex].correctAnswer === idx
    if (correct) setScore(s => s + activeQuiz!.questions[qIndex].points)
    setLiveBoard(prev => prev.map(p => p.id === 'me' ? { ...p, answered: p.answered + 1, score: p.score + (correct ? activeQuiz!.questions[qIndex].points : 0) } : p))
    addLog(`Q${qIndex + 1} answered — ${correct ? 'CORRECT' : 'WRONG'}`)
  }

  const nextQ = () => {
    if (!activeQuiz) return
    setRevealed(false)
    if (qIndex < activeQuiz.questions.length - 1) {
      setQIndex(i => i + 1)
    } else {
      setQuizDone(true)
      setView('results')
      addLog(`QUIZ COMPLETE — Score: ${score} pts`)
    }
  }

  const handleJoin = () => {
    if (!joinCode.trim()) return
    const found = quizzes.find(q => q.code === joinCode)
    if (!found) { addLog(`JOIN FAILED — code ${joinCode} not found`); return }
    if (found.isLocked && !joinPass.trim()) { addLog(`JOIN FAILED — password required`); return }
    addLog(`JOINED quiz ${joinCode}`)
    startQuiz(found)
  }

  const handleCreate = () => {
    if (!draftTitle.trim() || questions.length === 0) return
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    const pass = draftLocked ? Math.floor(1000 + Math.random() * 9000).toString() : ''
    setGenCode(code)
    setGenPass(pass)
    const newQ: QuizSession = {
      id: `q-${Date.now()}`, title: draftTitle, description: draftDesc,
      questions, timeLimit: draftTimeLimit, shuffleQuestions: draftShuffle,
      shuffleOptions: draftShuffleOpts, createdBy: 'You', isLocked: draftLocked,
      code, participants: 0, maxParticipants: draftMaxPart, status: 'scheduled',
      category: draftCategory, difficulty: draftDiff, avgScore: 0, attempts: 0, createdAt: new Date()
    }
    setQuizzes(prev => [newQ, ...prev])
    setStats(prev => ({ ...prev, totalQuizzes: prev.totalQuizzes + 1 }))
    addLog(`CREATED quiz "${draftTitle}" • ${code}`)
    setStep(4)
  }

  const addQuestion = () => {
    if (!editQ.question.trim()) return
    setQuestions(prev => [...prev, { ...editQ, id: Math.random().toString(36).substr(2, 9) }])
    setEditQ(blankQ())
    addLog(`Q${questions.length + 1} added`)
  }

  // ==================== RENDER ====================

  return (
    <div className="qroot">

      {/* ── PAGE HEADER ── */}
      <div className="q-page-header">
        <div className="q-page-title">
          <span className="q-title-text">QUIZ MODULE</span>
          <span className="q-title-sub">REAL-TIME INTERACTIVE QUIZ SYSTEM • LAN-BASED</span>
        </div>
        <div className="q-page-meta">
          <span className="q-version">v1.0.0</span>
          <span className="q-time">{ftShort(time)}</span>
          <div className="q-log-box">
            <span className="q-log-line">{logs[0] || '[System ready]'}</span>
          </div>
        </div>
      </div>

      {/* ── STATS GRID ── */}
      <div className="q-stats-grid">
        {[
          { label: 'TOTAL QUIZZES', val: stats.totalQuizzes, pct: 100 },
          { label: 'ACTIVE NOW', val: stats.activeNow, pct: (stats.activeNow / stats.totalQuizzes) * 100 },
          { label: 'PARTICIPANTS', val: stats.participantsToday, pct: 72 },
          { label: 'AVG SCORE', val: `${stats.avgScore}%`, pct: stats.avgScore },
          { label: 'QUESTIONS ANS.', val: stats.questionsAnswered, pct: 65 },
          { label: 'TOP CATEGORY', val: stats.topCategory, pct: 80 },
        ].map((s, i) => (
          <div key={i} className="q-stat-card">
            <div className="qsc-head">
              <span>{s.label}</span>
              <span className="qsc-val">{s.val}</span>
            </div>
            <div className="qsc-bar"><div className="qsc-fill" style={{ width: `${s.pct}%` }} /></div>
          </div>
        ))}
      </div>

      {/* ── MAIN PANEL ── */}
      <div className="q-main">

        {/* ── SIDEBAR ── */}
        <aside className="q-sidebar">
          <div className="q-sb-section">
            <div className="q-sb-title">NAVIGATION</div>
            {[
              { key: 'list', label: 'Quiz List' },
              { key: 'join', label: 'Join Session' },
              { key: 'create', label: 'Create Quiz' },
            ].map(item => (
              <button key={item.key} className={`q-sb-btn ${view === item.key ? 'q-sb-active' : ''}`}
                onClick={() => { setView(item.key as any); setStep(1); setQuizDone(false) }}>
                <span className="q-sb-arrow">{view === item.key ? '▸' : '·'}</span>
                {item.label}
              </button>
            ))}
          </div>

          {/* Live Quizzes */}
          <div className="q-sb-section">
            <div className="q-sb-title">LIVE QUIZZES</div>
            {quizzes.filter(q => q.status === 'active').map(q => (
              <div key={q.id} className="q-sb-quiz">
                <div className="q-sb-quiz-top">
                  <span className="q-sb-dot" />
                  <span className="q-sb-qname">{q.title.substring(0, 22)}{q.title.length > 22 ? '...' : ''}</span>
                </div>
                <div className="q-sb-qmeta">
                  <span>{q.participants}/{q.maxParticipants} online</span>
                  <span className="q-sb-code">{q.code}</span>
                </div>
                <div className="q-sb-qbar"><div className="q-sb-qfill" style={{ width: `${(q.participants / q.maxParticipants) * 100}%` }} /></div>
              </div>
            ))}
          </div>

          {/* Activity Log */}
          <div className="q-sb-section q-sb-log-section">
            <div className="q-sb-title">ACTIVITY LOG</div>
            <div className="q-sb-logs">
              {logs.length === 0 ? <div className="q-sb-log-empty">[Awaiting activity]</div>
                : logs.map((l, i) => <div key={i} className="q-sb-log">{l}</div>)}
            </div>
          </div>
        </aside>

        {/* ── CONTENT ── */}
        <div className="q-content">

          {/* ════════════════ LIST VIEW ════════════════ */}
          {view === 'list' && (
            <div className="q-list-view">
              {/* Toolbar */}
              <div className="q-toolbar">
                <input className="q-search" placeholder="Search by title or code..." value={search} onChange={e => setSearch(e.target.value)} />
                <div className="q-toolbar-right">
                  <div className="q-filters">
                    {(['all', 'active', 'scheduled', 'ended'] as const).map(f => (
                      <button key={f} className={`q-fbtn ${filterStatus === f ? 'q-factive' : ''}`} onClick={() => setFilterStatus(f)}>{f.toUpperCase()}</button>
                    ))}
                  </div>
                  <div className="q-filters">
                    {(['all', 'easy', 'medium', 'hard'] as const).map(f => (
                      <button key={f} className={`q-fbtn ${filterDiff === f ? 'q-factive' : ''}`} onClick={() => setFilterDiff(f)}>{f.toUpperCase()}</button>
                    ))}
                  </div>
                  <select className="q-cat-sel" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
                    {categories.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="q-table-header">
                <span>TITLE / CATEGORY</span>
                <span>CODE</span>
                <span>CREATOR</span>
                <span>DIFF</span>
                <span>STATUS</span>
                <span>USERS</span>
                <span>QUESTIONS</span>
                <span>TIME</span>
                <span>AVG</span>
                <span>ACTION</span>
              </div>
              <div className="q-table-body">
                {filtered.length === 0 && <div className="q-empty">No quizzes match filters</div>}
                {filtered.map(q => (
                  <div key={q.id} className="q-table-row">
                    <div className="q-row-title">
                      <span className="q-row-name">{q.title}</span>
                      <span className="q-row-cat">{q.category}</span>
                    </div>
                    <span className="q-row-code">{q.code}{q.isLocked ? ' ⬡' : ''}</span>
                    <span className="q-row-creator">{q.createdBy}</span>
                    <span className={`q-diff ${diffClass(q.difficulty)}`}>{q.difficulty.toUpperCase()}</span>
                    <span className={`q-status ${statClass(q.status)}`}>{q.status.toUpperCase()}</span>
                    <div className="q-row-users">
                      <span>{q.participants}/{q.maxParticipants}</span>
                      <div className="q-mini-bar"><div className="q-mini-fill" style={{ width: `${(q.participants / q.maxParticipants) * 100}%` }} /></div>
                    </div>
                    <span>{q.questions.length} Q</span>
                    <span>{q.timeLimit}m</span>
                    <span>{q.avgScore > 0 ? `${q.avgScore}%` : '--'}</span>
                    <div className="q-row-acts">
                      {q.status !== 'ended' && (
                        <button className="q-act-join" onClick={() => { setJoinCode(q.code); startQuiz(q) }}>START</button>
                      )}
                      <button className="q-act-view" onClick={() => { setJoinCode(q.code); setView('join') }}>JOIN</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="q-table-footer">
                <span>SHOWING {filtered.length} / {quizzes.length} QUIZZES</span>
                <span>{filtered.filter(q => q.status === 'active').length} ACTIVE</span>
                <span>TOTAL PARTICIPANTS: {filtered.reduce((s, q) => s + q.participants, 0)}</span>
              </div>
            </div>
          )}

          {/* ════════════════ JOIN VIEW ════════════════ */}
          {view === 'join' && (
            <div className="q-join-view">
              <div className="q-view-title">JOIN QUIZ SESSION</div>

              <div className="q-join-section-title">AVAILABLE SESSIONS ON LAN</div>
              <div className="q-join-grid">
                {quizzes.filter(q => q.status !== 'ended').map(q => (
                  <div key={q.id} className={`q-join-card ${joinCode === q.code ? 'q-join-sel' : ''}`} onClick={() => setJoinCode(q.code)}>
                    <div className="qjc-top">
                      <div>
                        <div className="qjc-title">{q.title}</div>
                        <div className="qjc-code">{q.code} — {q.isLocked ? 'PRIVATE' : 'PUBLIC'}</div>
                      </div>
                      <span className={`q-status ${statClass(q.status)}`}>{q.status.toUpperCase()}</span>
                    </div>
                    <div className="qjc-meta">
                      <div className="qjc-row"><span>CREATOR</span><span>{q.createdBy}</span></div>
                      <div className="qjc-row"><span>CATEGORY</span><span>{q.category}</span></div>
                      <div className="qjc-row"><span>QUESTIONS</span><span>{q.questions.length}</span></div>
                      <div className="qjc-row"><span>TIME LIMIT</span><span>{q.timeLimit}m</span></div>
                      <div className="qjc-row"><span>DIFFICULTY</span><span className={diffClass(q.difficulty)}>{q.difficulty.toUpperCase()}</span></div>
                      <div className="qjc-row"><span>PARTICIPANTS</span><span>{q.participants}/{q.maxParticipants}</span></div>
                    </div>
                    <div className="qjc-bar"><div className="qjc-fill" style={{ width: `${(q.participants / q.maxParticipants) * 100}%` }} /></div>
                  </div>
                ))}
              </div>

              <div className="q-join-manual">
                <div className="q-join-section-title">ENTER CODE MANUALLY</div>
                <div className="q-join-form">
                  <div className="q-jfield">
                    <label>SESSION CODE</label>
                    <input className="q-code-input" placeholder="XXXXXX" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} maxLength={6} />
                  </div>
                  <div className="q-jfield">
                    <label>PASSWORD (IF LOCKED)</label>
                    <input type="password" className="q-code-input q-pass-input" placeholder="••••" value={joinPass} onChange={e => setJoinPass(e.target.value)} />
                  </div>
                  <button className="q-join-submit" onClick={handleJoin} disabled={!joinCode.trim()}>JOIN SESSION</button>
                </div>
                <div className="q-join-info">
                  <div className="q-info-row"><span>ENCRYPTION</span><span>AES-256-GCM</span></div>
                  <div className="q-info-row"><span>NETWORK</span><span>LAN / WebSocket</span></div>
                  <div className="q-info-row"><span>BLOCKCHAIN</span><span>HASH VERIFIED</span></div>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════ TAKE VIEW ════════════════ */}
          {view === 'take' && activeQuiz && !quizDone && (
            <div className="q-take-view">
              {/* Quiz Header */}
              <div className="qt-header">
                <div className="qt-head-left">
                  <div className="qt-title">{activeQuiz.title}</div>
                  <div className="qt-meta">
                    <span className="qt-progress">Q {qIndex + 1} / {activeQuiz.questions.length}</span>
                    <span className={`q-diff ${diffClass(activeQuiz.questions[qIndex].difficulty)}`}>
                      {activeQuiz.questions[qIndex].difficulty.toUpperCase()}
                    </span>
                    <span className="qt-pts">{activeQuiz.questions[qIndex].points} PTS</span>
                  </div>
                </div>
                <div className="qt-head-right">
                  <div className="qt-timer-box">
                    <span className="qt-timer-label">QUIZ TIME</span>
                    <span className={`qt-timer ${timeLeft < 60 ? 'qt-timer-warn' : ''}`}>{fmtTimer(timeLeft)}</span>
                  </div>
                  <div className="qt-timer-box">
                    <span className="qt-timer-label">QUESTION</span>
                    <span className={`qt-timer ${questionTimer < 10 ? 'qt-timer-warn' : ''}`}>{questionTimer}s</span>
                  </div>
                  <div className="qt-timer-box">
                    <span className="qt-timer-label">SCORE</span>
                    <span className="qt-timer">{score}</span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="qt-prog-bar">
                <div className="qt-prog-fill" style={{ width: `${((qIndex + 1) / activeQuiz.questions.length) * 100}%` }} />
              </div>
              <div className="qt-prog-dots">
                {activeQuiz.questions.map((_, i) => (
                  <div key={i} className={`qt-dot ${i < qIndex ? 'qt-dot-done' : i === qIndex ? 'qt-dot-curr' : ''} ${answers[i] !== undefined ? (answers[i] === activeQuiz.questions[i].correctAnswer ? 'qt-dot-correct' : 'qt-dot-wrong') : ''}`} />
                ))}
              </div>

              <div className="qt-body">
                {/* Question */}
                <div className="qt-question-panel">
                  <div className="qt-q-text">{activeQuiz.questions[qIndex].question}</div>
                  <div className="qt-options">
                    {activeQuiz.questions[qIndex].options.map((opt, i) => {
                      const selected = answers[qIndex] === i
                      const correct = activeQuiz.questions[qIndex].correctAnswer === i
                      let cls = 'qt-opt'
                      if (revealed) {
                        if (correct) cls += ' qt-opt-correct'
                        else if (selected) cls += ' qt-opt-wrong'
                      } else if (selected) {
                        cls += ' qt-opt-selected'
                      }
                      return (
                        <button key={i} className={cls} onClick={() => handleAnswer(i)} disabled={revealed || answers[qIndex] !== undefined}>
                          <span className="qt-opt-letter">{String.fromCharCode(65 + i)}</span>
                          <span className="qt-opt-text">{opt}</span>
                          {revealed && correct && <span className="qt-opt-check">CORRECT</span>}
                          {revealed && selected && !correct && <span className="qt-opt-x">WRONG</span>}
                        </button>
                      )
                    })}
                  </div>

                  {revealed && activeQuiz.questions[qIndex].explanation && (
                    <div className="qt-explanation">
                      <span className="qt-expl-label">EXPLANATION</span>
                      <span>{activeQuiz.questions[qIndex].explanation}</span>
                    </div>
                  )}

                  <div className="qt-nav">
                    <button className="qt-nav-btn secondary" onClick={() => { if (qIndex > 0) { setQIndex(i => i - 1); setRevealed(answers[qIndex - 1] !== undefined) } }} disabled={qIndex === 0}>
                      PREVIOUS
                    </button>
                    <button className="qt-nav-btn primary" onClick={nextQ} disabled={!revealed && answers[qIndex] === undefined}>
                      {qIndex === activeQuiz.questions.length - 1 ? 'FINISH' : 'NEXT'}
                    </button>
                  </div>
                </div>

                {/* Live Leaderboard Sidebar */}
                <div className="qt-live-board">
                  <div className="qt-lb-title">LIVE LEADERBOARD</div>
                  {liveBoard.sort((a, b) => b.score - a.score).map((p, i) => (
                    <div key={p.id} className={`qt-lb-row ${p.id === 'me' ? 'qt-lb-me' : ''}`}>
                      <span className="qt-lb-rank">#{i + 1}</span>
                      <div className="qt-lb-info">
                        <span className="qt-lb-name">{p.name}</span>
                        <span className="qt-lb-prog">{p.answered}/{p.total} answered</span>
                      </div>
                      <span className="qt-lb-score">{p.score}</span>
                    </div>
                  ))}
                  <div className="qt-lb-net">
                    <div className="qt-lb-net-row"><span>QUESTIONS</span><span>{activeQuiz.questions.length}</span></div>
                    <div className="qt-lb-net-row"><span>CATEGORY</span><span>{activeQuiz.category}</span></div>
                    <div className="qt-lb-net-row"><span>DIFFICULTY</span><span className={diffClass(activeQuiz.difficulty)}>{activeQuiz.difficulty.toUpperCase()}</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════ RESULTS VIEW ════════════════ */}
          {view === 'results' && activeQuiz && (
            <div className="q-results-view">
              <div className="q-view-title">QUIZ RESULTS</div>

              {/* Score Banner */}
              <div className="qr-banner">
                <div className="qr-score-wrap">
                  <div className="qr-score-circle">
                    <span className="qr-score-val">{score}</span>
                    <span className="qr-score-total">/ {activeQuiz.questions.reduce((s, q) => s + q.points, 0)}</span>
                  </div>
                  <div className="qr-score-pct">
                    {Math.round((score / activeQuiz.questions.reduce((s, q) => s + q.points, 0)) * 100)}%
                  </div>
                </div>
                <div className="qr-stats">
                  <div className="qr-stat"><span>CORRECT</span><span>{answers.filter((a, i) => a === activeQuiz.questions[i].correctAnswer).length}</span></div>
                  <div className="qr-stat"><span>WRONG</span><span>{answers.filter((a, i) => a !== activeQuiz.questions[i].correctAnswer && a !== undefined).length}</span></div>
                  <div className="qr-stat"><span>SKIPPED</span><span>{activeQuiz.questions.length - answers.filter(a => a !== undefined).length}</span></div>
                  <div className="qr-stat"><span>TOTAL Q</span><span>{activeQuiz.questions.length}</span></div>
                  <div className="qr-stat"><span>POINTS</span><span>{score}</span></div>
                  <div className="qr-stat"><span>TIME USED</span><span>{fmtTimer(activeQuiz.timeLimit * 60 - timeLeft)}</span></div>
                </div>
              </div>

              {/* Per-question breakdown */}
              <div className="qr-breakdown-title">QUESTION BREAKDOWN</div>
              <div className="qr-breakdown">
                {activeQuiz.questions.map((q, i) => {
                  const userAns = answers[i]
                  const correct = userAns === q.correctAnswer
                  const skipped = userAns === undefined
                  return (
                    <div key={q.id} className={`qr-q-row ${correct ? 'qr-correct' : skipped ? 'qr-skipped' : 'qr-wrong'}`}>
                      <div className="qr-q-num">Q{i + 1}</div>
                      <div className="qr-q-info">
                        <div className="qr-q-text">{q.question}</div>
                        <div className="qr-q-ans">
                          <span>YOUR ANSWER: {userAns !== undefined ? q.options[userAns] : 'SKIPPED'}</span>
                          <span className="qr-correct-ans">CORRECT: {q.options[q.correctAnswer]}</span>
                        </div>
                        {q.explanation && <div className="qr-expl">{q.explanation}</div>}
                      </div>
                      <div className="qr-q-right">
                        <span className={`qr-result ${correct ? 'qr-c' : skipped ? 'qr-s' : 'qr-w'}`}>
                          {correct ? 'CORRECT' : skipped ? 'SKIPPED' : 'WRONG'}
                        </span>
                        <span className="qr-q-pts">{correct ? `+${q.points}` : '0'}</span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Final Leaderboard */}
              <div className="qr-lb-title">FINAL LEADERBOARD</div>
              <div className="qr-lb">
                {liveBoard.sort((a, b) => b.score - a.score).map((p, i) => (
                  <div key={p.id} className={`qr-lb-row ${p.id === 'me' ? 'qr-lb-me' : ''}`}>
                    <span className="qr-lb-rank">#{i + 1}</span>
                    <span className="qr-lb-name">{p.name}</span>
                    <div className="qr-lb-bar-wrap">
                      <div className="qr-lb-bar">
                        <div className="qr-lb-fill" style={{ width: `${(p.score / (activeQuiz.questions.reduce((s, q) => s + q.points, 0))) * 100}%` }} />
                      </div>
                    </div>
                    <span className="qr-lb-score">{p.score} pts</span>
                    <span className={`qr-lb-status ${p.status === 'completed' ? 'qr-done' : ''}`}>{p.status.toUpperCase()}</span>
                  </div>
                ))}
              </div>

              <div className="qr-actions">
                <button className="qr-btn primary" onClick={() => { startQuiz(activeQuiz) }}>RETRY QUIZ</button>
                <button className="qr-btn secondary" onClick={() => setView('list')}>BACK TO LIST</button>
              </div>
            </div>
          )}

          {/* ════════════════ CREATE VIEW ════════════════ */}
          {view === 'create' && (
            <div className="q-create-view">
              <div className="q-view-title">CREATE QUIZ</div>

              {/* Steps */}
              <div className="q-steps">
                {[{ n: 1, l: 'BASIC INFO' }, { n: 2, l: 'QUESTIONS' }, { n: 3, l: 'SETTINGS' }, { n: 4, l: 'PUBLISHED' }].map(s => (
                  <div key={s.n} className={`q-step ${step >= s.n ? 'q-step-done' : ''} ${step === s.n ? 'q-step-active' : ''}`}>
                    <div className="q-step-num">{s.n}</div>
                    <div className="q-step-label">{s.l}</div>
                    {s.n < 4 && <div className="q-step-line" />}
                  </div>
                ))}
              </div>

              {/* ── Step 1 ── */}
              {step === 1 && (
                <div className="q-step-body">
                  <div className="q-form-grid">
                    <div className="q-field">
                      <label>QUIZ TITLE</label>
                      <input className="q-input" value={draftTitle} onChange={e => setDraftTitle(e.target.value)} placeholder="e.g., JavaScript Fundamentals" />
                    </div>
                    <div className="q-field">
                      <label>CATEGORY</label>
                      <select className="q-input" value={draftCategory} onChange={e => setDraftCategory(e.target.value)}>
                        {['General', 'Algorithms', 'Data Structures', 'Web Dev', 'Databases', 'OOP', 'Networks', 'OS'].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div className="q-field q-field-full">
                      <label>DESCRIPTION</label>
                      <textarea className="q-input q-textarea" rows={2} value={draftDesc} onChange={e => setDraftDesc(e.target.value)} placeholder="Brief description..." />
                    </div>
                    <div className="q-field">
                      <label>TIME LIMIT (MINUTES)</label>
                      <input className="q-input" type="number" min={1} max={120} value={draftTimeLimit} onChange={e => setDraftTimeLimit(+e.target.value)} />
                    </div>
                    <div className="q-field">
                      <label>MAX PARTICIPANTS</label>
                      <input className="q-input" type="number" min={1} max={200} value={draftMaxPart} onChange={e => setDraftMaxPart(+e.target.value)} />
                    </div>
                    <div className="q-field">
                      <label>DIFFICULTY</label>
                      <select className="q-input" value={draftDiff} onChange={e => setDraftDiff(e.target.value as any)}>
                        <option value="easy">EASY</option>
                        <option value="medium">MEDIUM</option>
                        <option value="hard">HARD</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Step 2 ── */}
              {step === 2 && (
                <div className="q-step-body q-q-layout">
                  <div className="q-q-list">
                    <div className="q-ql-title">QUESTIONS ({questions.length})</div>
                    {questions.length === 0 && <div className="q-ql-empty">No questions yet</div>}
                    {questions.map((q, i) => (
                      <div key={q.id} className="q-ql-item">
                        <span className="q-ql-num">Q{i + 1}</span>
                        <div className="q-ql-info">
                          <div className="q-ql-text">{q.question.substring(0, 36)}{q.question.length > 36 ? '...' : ''}</div>
                          <div className="q-ql-meta">
                            <span className={diffClass(q.difficulty)}>{q.difficulty.toUpperCase()}</span>
                            <span>{q.points}pts</span>
                          </div>
                        </div>
                        <button className="q-ql-rm" onClick={() => setQuestions(p => p.filter(qq => qq.id !== q.id))}>×</button>
                      </div>
                    ))}
                    {questions.length > 0 && (
                      <div className="q-ql-sum">
                        <span>{questions.length} Q</span>
                        <span>{questions.reduce((s, q) => s + q.points, 0)} pts total</span>
                      </div>
                    )}
                  </div>

                  <div className="q-q-editor">
                    <div className="q-ql-title">ADD QUESTION</div>
                    <div className="q-form-grid">
                      <div className="q-field">
                        <label>DIFFICULTY</label>
                        <select className="q-input" value={editQ.difficulty} onChange={e => setEditQ({ ...editQ, difficulty: e.target.value as any })}>
                          <option value="easy">EASY</option>
                          <option value="medium">MEDIUM</option>
                          <option value="hard">HARD</option>
                        </select>
                      </div>
                      <div className="q-field">
                        <label>POINTS</label>
                        <input className="q-input" type="number" min={1} max={50} value={editQ.points} onChange={e => setEditQ({ ...editQ, points: +e.target.value })} />
                      </div>
                      <div className="q-field">
                        <label>CATEGORY</label>
                        <input className="q-input" value={editQ.category} onChange={e => setEditQ({ ...editQ, category: e.target.value })} placeholder="e.g., algorithms" />
                      </div>
                      <div className="q-field q-field-full">
                        <label>QUESTION</label>
                        <textarea className="q-input q-textarea" rows={2} value={editQ.question} onChange={e => setEditQ({ ...editQ, question: e.target.value })} placeholder="Enter your question..." />
                      </div>
                    </div>

                    <div className="q-opts-section">
                      <div className="q-ql-title">OPTIONS — SELECT CORRECT ANSWER</div>
                      {editQ.options.map((opt, i) => (
                        <div key={i} className="q-opt-row">
                          <input type="radio" name="correct" className="q-radio" checked={editQ.correctAnswer === i} onChange={() => setEditQ({ ...editQ, correctAnswer: i })} />
                          <span className="q-opt-label">{String.fromCharCode(65 + i)}</span>
                          <input className="q-input q-opt-inp" value={opt} placeholder={`Option ${String.fromCharCode(65 + i)}`} onChange={e => {
                            const opts = [...editQ.options]; opts[i] = e.target.value
                            setEditQ({ ...editQ, options: opts })
                          }} />
                        </div>
                      ))}
                    </div>

                    <div className="q-field" style={{ marginTop: 10 }}>
                      <label>EXPLANATION (OPTIONAL)</label>
                      <input className="q-input" value={editQ.explanation || ''} onChange={e => setEditQ({ ...editQ, explanation: e.target.value })} placeholder="Explain the correct answer..." />
                    </div>
                    <button className="q-add-q-btn" onClick={addQuestion} disabled={!editQ.question.trim()}>+ ADD QUESTION</button>
                  </div>
                </div>
              )}

              {/* ── Step 3 ── */}
              {step === 3 && (
                <div className="q-step-body">
                  <div className="q-settings-grid">
                    {[
                      { label: 'SHUFFLE QUESTIONS', sub: 'Randomize question order per student', val: draftShuffle, set: setDraftShuffle },
                      { label: 'SHUFFLE OPTIONS', sub: 'Randomize MCQ option order', val: draftShuffleOpts, set: setDraftShuffleOpts },
                      { label: 'LOCKED SESSION', sub: 'Require password to join', val: draftLocked, set: setDraftLocked },
                      { label: 'SHOW EXPLANATION', sub: 'Display explanation after each answer', val: draftShowExpl, set: setDraftShowExpl },
                      { label: 'INSTANT REVEAL', sub: 'Show correct answer immediately after selection', val: draftInstant, set: setDraftInstant },
                    ].map(s => (
                      <div key={s.label} className="q-setting-card">
                        <div className="q-sc-info">
                          <div className="q-sc-label">{s.label}</div>
                          <div className="q-sc-sub">{s.sub}</div>
                        </div>
                        <button className={`q-toggle ${s.val ? 'q-toggle-on' : ''}`} onClick={() => s.set(!s.val)}>
                          <span className="q-toggle-knob" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="q-review-panel" style={{ marginTop: 14 }}>
                    <div className="q-pd-title">REVIEW BEFORE PUBLISHING</div>
                    {[
                      ['TITLE', draftTitle || '(not set)'],
                      ['CATEGORY', draftCategory],
                      ['DIFFICULTY', draftDiff.toUpperCase()],
                      ['TIME LIMIT', `${draftTimeLimit} minutes`],
                      ['MAX PARTICIPANTS', draftMaxPart.toString()],
                      ['QUESTIONS', questions.length.toString()],
                      ['TOTAL POINTS', questions.reduce((s, q) => s + q.points, 0).toString()],
                      ['LOCKED', draftLocked ? 'YES — PASSWORD PROTECTED' : 'NO — OPEN'],
                    ].map(([k, v]) => (
                      <div key={k} className="q-pd-row"><span>{k}</span><span>{v}</span></div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Step 4: Published ── */}
              {step === 4 && (
                <div className="q-step-body q-published">
                  <div className="q-pub-title">QUIZ PUBLISHED</div>
                  <div className="q-pub-sub">Share these credentials with your students</div>
                  <div className="q-pub-creds">
                    <div className="q-pub-cred">
                      <span>SESSION CODE</span>
                      <span className="q-pub-code">{genCode}</span>
                    </div>
                    {genPass && (
                      <div className="q-pub-cred">
                        <span>PASSWORD</span>
                        <span className="q-pub-pass">{genPass}</span>
                      </div>
                    )}
                  </div>
                  <div className="q-pub-details">
                    <div className="q-pd-row"><span>TITLE</span><span>{draftTitle}</span></div>
                    <div className="q-pd-row"><span>QUESTIONS</span><span>{questions.length}</span></div>
                    <div className="q-pd-row"><span>TOTAL POINTS</span><span>{questions.reduce((s, q) => s + q.points, 0)}</span></div>
                    <div className="q-pd-row"><span>TIME LIMIT</span><span>{draftTimeLimit} min</span></div>
                  </div>
                  <div className="q-pub-acts">
                    <button className="qr-btn primary" onClick={() => { setView('list'); setStep(1) }}>VIEW IN LIST</button>
                    <button className="qr-btn secondary" onClick={() => { setStep(1); setDraftTitle(''); setDraftDesc(''); setQuestions([]) }}>CREATE ANOTHER</button>
                  </div>
                </div>
              )}

              {/* Step Nav */}
              {step < 4 && (
                <div className="q-step-nav">
                  <button className="q-nav-btn secondary" onClick={() => setStep(s => s - 1)} disabled={step === 1}>PREVIOUS</button>
                  <div className="q-step-indicator">STEP {step} / 3</div>
                  {step < 3 ? (
                    <button className="q-nav-btn primary" onClick={() => setStep(s => s + 1)} disabled={step === 1 && !draftTitle.trim()}>NEXT</button>
                  ) : (
                    <button className="q-nav-btn primary" onClick={handleCreate} disabled={!draftTitle.trim() || questions.length === 0}>PUBLISH QUIZ</button>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Scan line */}
      <div className="q-scan-line" />

      {/* ══════════════════ STYLES ══════════════════ */}
      <style>{`
        * { margin:0; padding:0; box-sizing:border-box; }

        .qroot {
          min-height: calc(100vh - 56px);
          background: #030303;
          color: #ffffff;
          font-family: 'SF Mono','Monaco','Fira Code',monospace;
          font-size: 11px;
          display: flex;
          flex-direction: column;
          gap: 1px;
          position: relative;
          overflow-x: hidden;
          overflow-y: auto;
        }
        .qroot::-webkit-scrollbar{width:4px}
        .qroot::-webkit-scrollbar-track{background:#111}
        .qroot::-webkit-scrollbar-thumb{background:#222}
        .qroot::-webkit-scrollbar-thumb:hover{background:#1e3a5f}
        *{scrollbar-width:thin;scrollbar-color:#222 #111}

        /* ── PAGE HEADER ── */
        .q-page-header {
          background:#0a0a0a; border:1px solid #1e3a5f;
          padding:12px 20px; display:flex; justify-content:space-between; align-items:center;
          position:relative; overflow:hidden; flex-shrink:0;
        }
        .q-page-header::before {
          content:''; position:absolute; top:0; left:-100%; width:100%; height:2px;
          background:linear-gradient(90deg,transparent,#1e3a5f,transparent);
          animation:qscanline 3s linear infinite;
        }
        @keyframes qscanline{0%{left:-100%}100%{left:100%}}
        .q-page-title{display:flex;flex-direction:column;gap:3px}
        .q-title-text{color:#1e3a5f;font-size:18px;font-weight:700;letter-spacing:3px;text-shadow:0 0 8px #1e3a5f}
        .q-title-sub{font-size:8px;opacity:0.35;letter-spacing:2px}
        .q-page-meta{display:flex;align-items:center;gap:14px;background:#050505;padding:6px 12px;border:1px solid #1e3a5f}
        .q-version{color:#1e3a5f;font-size:9px}
        .q-time{font-size:10px}
        .q-log-box{border-left:1px solid #1e3a5f;padding-left:12px}
        .q-log-line{font-size:9px;opacity:0.7;animation:qfadeIn 0.3s ease}
        @keyframes qfadeIn{from{opacity:0;transform:translateX(8px)}to{opacity:1;transform:translateX(0)}}

        /* ── STATS ── */
        .q-stats-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:1px;background:#1e3a5f;border:1px solid #1e3a5f;flex-shrink:0}
        .q-stat-card{background:#0a0a0a;padding:12px 14px;display:flex;flex-direction:column;gap:6px;transition:transform 0.2s,box-shadow 0.2s}
        .q-stat-card:hover{transform:translateY(-2px);box-shadow:0 4px 18px rgba(30,58,95,0.3)}
        .qsc-head{display:flex;justify-content:space-between;align-items:center;padding-bottom:5px;border-bottom:1px solid #1e3a5f}
        .qsc-head span:first-child{font-size:9px;opacity:0.6;letter-spacing:0.5px}
        .qsc-val{font-size:14px;font-weight:700}
        .qsc-bar{height:2px;background:#1a1a1a;overflow:hidden}
        .qsc-fill{height:100%;background:#1e3a5f;transition:width 0.5s}

        /* ── MAIN ── */
        .q-main{display:flex;flex:1;gap:1px;background:#1e3a5f;border:1px solid #1e3a5f;min-height:0}

        /* ── SIDEBAR ── */
        .q-sidebar{width:260px;min-width:260px;background:#0a0a0a;display:flex;flex-direction:column;overflow-y:auto}
        .q-sidebar::-webkit-scrollbar{width:4px}
        .q-sidebar::-webkit-scrollbar-track{background:#111}
        .q-sidebar::-webkit-scrollbar-thumb{background:#222}
        .q-sidebar::-webkit-scrollbar-thumb:hover{background:#1e3a5f}
        .q-sb-section{padding:12px 14px;border-bottom:1px solid #1e3a5f;flex-shrink:0}
        .q-sb-title{font-size:7px;letter-spacing:1.5px;opacity:0.35;margin-bottom:8px}
        .q-sb-btn{width:100%;background:none;border:none;color:#fff;font-family:inherit;font-size:10px;padding:7px 0;text-align:left;cursor:pointer;opacity:0.5;display:flex;align-items:center;gap:7px;transition:opacity 0.15s;border-bottom:1px dotted #111}
        .q-sb-btn:hover{opacity:0.85}
        .q-sb-btn.q-sb-active{opacity:1}
        .q-sb-arrow{color:#1e3a5f;font-size:10px;width:10px}
        .q-sb-quiz{padding:6px 0;border-bottom:1px dotted #111}
        .q-sb-quiz-top{display:flex;align-items:center;gap:6px;margin-bottom:3px}
        .q-sb-dot{width:5px;height:5px;border-radius:50%;background:#4a90d9;flex-shrink:0;animation:qdot 2s infinite}
        @keyframes qdot{0%,100%{opacity:1}50%{opacity:0.3}}
        .q-sb-qname{font-size:9px}
        .q-sb-qmeta{display:flex;justify-content:space-between;font-size:7px;opacity:0.45;margin-bottom:3px}
        .q-sb-code{color:#6ab4ff}
        .q-sb-qbar{height:2px;background:#111}
        .q-sb-qfill{height:100%;background:#1e3a5f;transition:width 0.5s}
        .q-sb-log-section{flex:1}
        .q-sb-logs{display:flex;flex-direction:column;gap:2px;max-height:160px;overflow-y:auto}
        .q-sb-log{font-size:8px;opacity:0.5;padding:2px 0;border-bottom:1px dotted #0d0d0d;font-family:monospace}
        .q-sb-log-empty{font-size:8px;opacity:0.2;font-style:italic}

        /* ── CONTENT ── */
        .q-content{flex:1;background:#0a0a0a;overflow-y:auto;padding:20px;min-width:0}
        .q-content::-webkit-scrollbar{width:4px}
        .q-content::-webkit-scrollbar-track{background:#111}
        .q-content::-webkit-scrollbar-thumb{background:#222}
        .q-content::-webkit-scrollbar-thumb:hover{background:#1e3a5f}
        .q-view-title{font-size:13px;font-weight:700;letter-spacing:2px;margin-bottom:16px;border-left:3px solid #1e3a5f;padding-left:10px}

        /* ── TOOLBAR ── */
        .q-toolbar{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px;flex-wrap:wrap}
        .q-toolbar-right{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
        .q-search{background:#0e0e0e;border:1px solid #1e3a5f;color:#fff;padding:6px 12px;font-size:10px;font-family:inherit;outline:none;width:220px;transition:border-color 0.2s}
        .q-search:focus{border-color:rgba(255,255,255,0.3)}
        .q-search::placeholder{opacity:0.28}
        .q-filters{display:flex;gap:3px}
        .q-fbtn{background:none;border:1px solid #141414;color:#fff;opacity:0.4;font-size:7px;padding:3px 8px;cursor:pointer;font-family:inherit;letter-spacing:0.5px;transition:all 0.15s}
        .q-fbtn:hover{opacity:0.75}
        .q-fbtn.q-factive{opacity:1;border-color:#1e3a5f;background:rgba(30,58,95,0.18)}
        .q-cat-sel{background:#0e0e0e;border:1px solid #1a1a1a;color:#fff;padding:3px 8px;font-size:8px;font-family:inherit;outline:none;cursor:pointer}

        /* ── TABLE ── */
        .q-table-header{display:grid;grid-template-columns:2fr 80px 100px 60px 80px 90px 60px 50px 50px 90px;padding:6px 10px;background:#070707;border:1px solid #1e3a5f;border-bottom:none;font-size:7px;letter-spacing:1px;opacity:0.45}
        .q-table-body{border:1px solid #1e3a5f}
        .q-table-row{display:grid;grid-template-columns:2fr 80px 100px 60px 80px 90px 60px 50px 50px 90px;padding:9px 10px;border-bottom:1px solid #0d0d0d;align-items:center;font-size:9px;transition:background 0.15s}
        .q-table-row:hover{background:#0e0e0e}
        .q-table-row:last-child{border-bottom:none}
        .q-empty{padding:30px;text-align:center;opacity:0.25;font-size:10px}
        .q-row-title{display:flex;flex-direction:column;gap:2px}
        .q-row-name{font-size:10px}
        .q-row-cat{font-size:7px;opacity:0.35}
        .q-row-code{font-family:monospace;font-size:9px;opacity:0.75}
        .q-row-creator{font-size:8px;opacity:0.6}
        .q-diff{font-size:7px;padding:2px 5px}
        .diff-easy{background:rgba(74,144,80,0.25);color:#6dba72}
        .diff-med{background:rgba(200,150,50,0.2);color:#c8964a}
        .diff-hard{background:rgba(180,60,60,0.2);color:#c86060}
        .q-status{font-size:7px;padding:2px 5px}
        .stat-active{background:rgba(30,58,95,0.4);color:#6ab4ff}
        .stat-sched{background:rgba(200,150,50,0.2);color:#c8964a}
        .stat-ended{background:rgba(80,80,80,0.3);color:#888}
        .q-row-users{display:flex;flex-direction:column;gap:2px}
        .q-mini-bar{height:2px;background:#1a1a1a}
        .q-mini-fill{height:100%;background:#1e3a5f}
        .q-row-acts{display:flex;gap:5px}
        .q-act-join,.q-act-view{background:none;border:1px solid #1a1a1a;color:#fff;font-size:7px;padding:3px 7px;cursor:pointer;font-family:inherit;letter-spacing:0.5px;transition:all 0.15s}
        .q-act-join{background:#1e3a5f;border-color:#1e3a5f}
        .q-act-join:hover{background:#2a4a7a}
        .q-act-view:hover{border-color:#1e3a5f;background:rgba(30,58,95,0.2)}
        .q-table-footer{display:flex;gap:24px;padding:6px 10px;background:#070707;border:1px solid #1e3a5f;border-top:none;font-size:7px;opacity:0.35;letter-spacing:0.5px}

        /* ── JOIN VIEW ── */
        .q-join-view{display:flex;flex-direction:column;gap:16px}
        .q-join-section-title{font-size:8px;letter-spacing:1.5px;opacity:0.35;margin-bottom:8px}
        .q-join-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:4px}
        .q-join-card{background:#0e0e0e;border:1px solid #1a1a1a;padding:12px;cursor:pointer;transition:border-color 0.15s}
        .q-join-card:hover{border-color:#1e3a5f}
        .q-join-sel{border-color:#1e3a5f!important;background:rgba(30,58,95,0.1)}
        .qjc-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px}
        .qjc-title{font-size:10px;font-weight:600;margin-bottom:2px}
        .qjc-code{font-size:7px;opacity:0.4;font-family:monospace}
        .qjc-meta{display:flex;flex-direction:column;gap:2px;margin-bottom:6px}
        .qjc-row{display:flex;justify-content:space-between;font-size:7px;padding:2px 0;border-bottom:1px dotted #0d0d0d}
        .qjc-row span:first-child{opacity:0.4}
        .qjc-bar{height:2px;background:#1a1a1a}
        .qjc-fill{height:100%;background:#1e3a5f;transition:width 0.5s}
        .q-join-manual{display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:16px;background:#070707;border:1px solid #1e3a5f}
        .q-join-form{display:flex;flex-direction:column;gap:10px}
        .q-jfield{display:flex;flex-direction:column;gap:4px}
        .q-jfield label{font-size:7px;opacity:0.45;letter-spacing:1px}
        .q-code-input{background:#0e0e0e;border:1px solid #1e3a5f;color:#fff;padding:9px 12px;font-size:14px;font-family:monospace;letter-spacing:4px;text-align:center;outline:none;width:100%}
        .q-code-input:focus{border-color:#fff}
        .q-pass-input{font-size:12px;letter-spacing:2px}
        .q-join-submit{background:#1e3a5f;border:none;color:#fff;padding:10px;font-size:10px;cursor:pointer;font-family:inherit;letter-spacing:1px;transition:background 0.2s;margin-top:4px}
        .q-join-submit:hover:not(:disabled){background:#2a4a7a}
        .q-join-submit:disabled{opacity:0.35;cursor:not-allowed}
        .q-join-info{display:flex;flex-direction:column;gap:4px;justify-content:center}
        .q-info-row{display:flex;justify-content:space-between;font-size:8px;padding:4px 0;border-bottom:1px dotted #111}
        .q-info-row span:first-child{opacity:0.4}

        /* ── TAKE VIEW ── */
        .q-take-view{display:flex;flex-direction:column;gap:12px}
        .qt-header{display:flex;justify-content:space-between;align-items:flex-start;padding:12px 14px;background:#070707;border:1px solid #1e3a5f}
        .qt-title{font-size:13px;font-weight:700;margin-bottom:4px}
        .qt-meta{display:flex;align-items:center;gap:10px;font-size:8px}
        .qt-progress{opacity:0.5}
        .qt-pts{color:#6ab4ff}
        .qt-head-right{display:flex;gap:12px}
        .qt-timer-box{display:flex;flex-direction:column;align-items:flex-end}
        .qt-timer-label{font-size:7px;opacity:0.35}
        .qt-timer{font-size:14px;font-weight:700;font-family:monospace}
        .qt-timer-warn{color:#c86060;animation:qdot 0.5s infinite}
        .qt-prog-bar{height:3px;background:#111;overflow:hidden}
        .qt-prog-fill{height:100%;background:#1e3a5f;transition:width 0.3s}
        .qt-prog-dots{display:flex;gap:4px;padding:6px 0}
        .qt-dot{width:8px;height:8px;border-radius:50%;background:#111;border:1px solid #1a1a1a;flex-shrink:0}
        .qt-dot-curr{border-color:#1e3a5f;background:rgba(30,58,95,0.4)}
        .qt-dot-done{border-color:#333;background:#1a1a1a}
        .qt-dot-correct{border-color:#6dba72;background:rgba(74,144,80,0.3)}
        .qt-dot-wrong{border-color:#c86060;background:rgba(180,60,60,0.3)}
        .qt-body{display:grid;grid-template-columns:1fr 240px;gap:12px}
        .qt-question-panel{background:#090909;border:1px solid #1e3a5f;padding:16px;display:flex;flex-direction:column;gap:12px}
        .qt-q-text{font-size:13px;line-height:1.6;font-weight:500}
        .qt-options{display:flex;flex-direction:column;gap:6px}
        .qt-opt{display:flex;align-items:center;gap:10px;padding:10px 14px;background:#0e0e0e;border:1px solid #1a1a1a;color:#fff;cursor:pointer;font-family:inherit;font-size:10px;text-align:left;transition:all 0.15s}
        .qt-opt:hover:not(:disabled){border-color:#1e3a5f;background:#111}
        .qt-opt:disabled{cursor:default}
        .qt-opt-selected{background:rgba(30,58,95,0.3)!important;border-color:#1e3a5f!important}
        .qt-opt-correct{background:rgba(74,144,80,0.2)!important;border-color:#6dba72!important}
        .qt-opt-wrong{background:rgba(180,60,60,0.15)!important;border-color:#c86060!important;opacity:0.7}
        .qt-opt-letter{width:22px;height:22px;border-radius:50%;background:#111;border:1px solid #222;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;flex-shrink:0}
        .qt-opt-text{flex:1}
        .qt-opt-check{margin-left:auto;font-size:7px;color:#6dba72;letter-spacing:0.5px}
        .qt-opt-x{margin-left:auto;font-size:7px;color:#c86060;letter-spacing:0.5px}
        .qt-explanation{background:#070707;border-left:2px solid #1e3a5f;padding:8px 12px;font-size:9px;opacity:0.75;line-height:1.5}
        .qt-expl-label{display:block;font-size:7px;opacity:0.4;letter-spacing:1px;margin-bottom:4px}
        .qt-nav{display:flex;justify-content:space-between;margin-top:4px}
        .qt-nav-btn{padding:8px 24px;font-size:9px;cursor:pointer;font-family:inherit;letter-spacing:1px;transition:all 0.2s}
        .qt-nav-btn.primary{background:#1e3a5f;border:none;color:#fff}
        .qt-nav-btn.primary:hover:not(:disabled){background:#2a4a7a}
        .qt-nav-btn.secondary{background:none;border:1px solid #1a1a1a;color:#fff}
        .qt-nav-btn.secondary:hover:not(:disabled){border-color:#1e3a5f}
        .qt-nav-btn:disabled{opacity:0.3;cursor:not-allowed}
        .qt-live-board{background:#090909;border:1px solid #1e3a5f;padding:12px;display:flex;flex-direction:column;gap:6px}
        .qt-lb-title{font-size:7px;letter-spacing:1.5px;opacity:0.35;margin-bottom:4px}
        .qt-lb-row{display:flex;align-items:center;gap:8px;padding:5px;border-bottom:1px dotted #0d0d0d}
        .qt-lb-me{background:rgba(30,58,95,0.12);border-color:#1e3a5f}
        .qt-lb-rank{font-size:9px;opacity:0.5;width:20px;flex-shrink:0}
        .qt-lb-info{flex:1}
        .qt-lb-name{display:block;font-size:9px}
        .qt-lb-prog{font-size:7px;opacity:0.4}
        .qt-lb-score{font-size:11px;font-weight:700;color:#6ab4ff}
        .qt-lb-net{margin-top:8px;padding-top:8px;border-top:1px solid #111;display:flex;flex-direction:column;gap:3px}
        .qt-lb-net-row{display:flex;justify-content:space-between;font-size:7px;opacity:0.45}

        /* ── RESULTS VIEW ── */
        .q-results-view{display:flex;flex-direction:column;gap:14px}
        .qr-banner{display:grid;grid-template-columns:auto 1fr;gap:24px;padding:20px;background:#090909;border:1px solid #1e3a5f;align-items:center}
        .qr-score-wrap{display:flex;flex-direction:column;align-items:center;gap:6px}
        .qr-score-circle{width:90px;height:90px;border-radius:50%;background:#070707;border:2px solid #1e3a5f;display:flex;flex-direction:column;align-items:center;justify-content:center}
        .qr-score-val{font-size:22px;font-weight:700}
        .qr-score-total{font-size:9px;opacity:0.4}
        .qr-score-pct{font-size:18px;font-weight:700;color:#6ab4ff}
        .qr-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
        .qr-stat{background:#070707;border:1px solid #111;padding:8px;display:flex;flex-direction:column;gap:3px}
        .qr-stat span:first-child{font-size:7px;opacity:0.35}
        .qr-stat span:last-child{font-size:13px;font-weight:700}
        .qr-breakdown-title{font-size:8px;letter-spacing:1.5px;opacity:0.35}
        .qr-breakdown{display:flex;flex-direction:column;gap:4px}
        .qr-q-row{display:grid;grid-template-columns:30px 1fr auto;gap:8px;padding:8px 10px;border:1px solid #111;align-items:flex-start;border-left:3px solid #111}
        .qr-correct{border-left-color:#6dba72;background:rgba(74,144,80,0.05)}
        .qr-wrong{border-left-color:#c86060;background:rgba(180,60,60,0.04)}
        .qr-skipped{border-left-color:#555;opacity:0.6}
        .qr-q-num{font-size:9px;opacity:0.5;font-weight:700;padding-top:1px}
        .qr-q-text{font-size:9px;margin-bottom:4px;line-height:1.4}
        .qr-q-ans{display:flex;gap:16px;font-size:7px;opacity:0.55}
        .qr-correct-ans{color:#6dba72}
        .qr-expl{font-size:7px;opacity:0.4;margin-top:3px;font-style:italic}
        .qr-q-right{display:flex;flex-direction:column;align-items:flex-end;gap:4px}
        .qr-result{font-size:7px;padding:2px 6px;letter-spacing:0.5px}
        .qr-c{background:rgba(74,144,80,0.2);color:#6dba72}
        .qr-w{background:rgba(180,60,60,0.2);color:#c86060}
        .qr-s{background:rgba(80,80,80,0.2);color:#888}
        .qr-q-pts{font-size:9px;font-weight:700;color:#6ab4ff}
        .qr-lb-title{font-size:8px;letter-spacing:1.5px;opacity:0.35}
        .qr-lb{display:flex;flex-direction:column;gap:4px}
        .qr-lb-row{display:grid;grid-template-columns:30px 140px 1fr 60px 80px;gap:8px;align-items:center;padding:6px 8px;border:1px solid #111;font-size:9px}
        .qr-lb-me{background:rgba(30,58,95,0.1);border-color:#1e3a5f}
        .qr-lb-rank{opacity:0.5;font-weight:700}
        .qr-lb-name{font-size:9px}
        .qr-lb-bar-wrap{overflow:hidden}
        .qr-lb-bar{height:4px;background:#111}
        .qr-lb-fill{height:100%;background:#1e3a5f;transition:width 0.5s}
        .qr-lb-score{font-size:10px;font-weight:700;text-align:right}
        .qr-lb-status{font-size:7px;opacity:0.5}
        .qr-done{color:#6dba72;opacity:1}
        .qr-actions{display:flex;gap:10px;margin-top:4px}
        .qr-btn{padding:9px 24px;font-size:9px;cursor:pointer;font-family:inherit;letter-spacing:1px;transition:all 0.2s}
        .qr-btn.primary{background:#1e3a5f;border:none;color:#fff}
        .qr-btn.primary:hover{background:#2a4a7a}
        .qr-btn.secondary{background:none;border:1px solid #1a1a1a;color:#fff}
        .qr-btn.secondary:hover{border-color:#1e3a5f}

        /* ── CREATE VIEW ── */
        .q-create-view{display:flex;flex-direction:column;gap:16px}
        .q-steps{display:flex;align-items:center;gap:0;margin-bottom:4px;overflow-x:auto}
        .q-step{display:flex;align-items:center;gap:0}
        .q-step-num{width:24px;height:24px;border-radius:50%;background:#111;border:1px solid #1a1a1a;color:#fff;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;flex-shrink:0;z-index:1}
        .q-step-label{font-size:7px;letter-spacing:1px;opacity:0.35;margin:0 6px;white-space:nowrap}
        .q-step-line{flex:1;height:1px;background:#1a1a1a;min-width:20px}
        .q-step-done .q-step-num{border-color:#1e3a5f;background:rgba(30,58,95,0.3)}
        .q-step-done .q-step-label{opacity:0.55}
        .q-step-done .q-step-line{background:#1e3a5f}
        .q-step-active .q-step-num{border-color:#1e3a5f;background:#1e3a5f}
        .q-step-active .q-step-label{opacity:1;color:#6ab4ff}
        .q-step-body{background:#090909;border:1px solid #1e3a5f;padding:20px;flex:1}
        .q-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        .q-field{display:flex;flex-direction:column;gap:5px}
        .q-field-full{grid-column:1/-1}
        .q-field label{font-size:7px;opacity:0.45;letter-spacing:1px}
        .q-input{background:#0e0e0e;border:1px solid #1a1a1a;color:#fff;padding:7px 10px;font-size:10px;font-family:inherit;outline:none;transition:border-color 0.15s;width:100%}
        .q-input:focus{border-color:#1e3a5f}
        .q-input::placeholder{opacity:0.25}
        .q-textarea{resize:vertical;min-height:52px;line-height:1.5}
        select.q-input{cursor:pointer}
        .q-q-layout{display:grid;grid-template-columns:200px 1fr;gap:12px;padding:0!important;background:none!important;border:none!important}
        .q-q-list{background:#090909;border:1px solid #1e3a5f;padding:12px;display:flex;flex-direction:column;gap:4px;overflow-y:auto;max-height:520px}
        .q-ql-title{font-size:7px;letter-spacing:1.5px;opacity:0.35;margin-bottom:6px}
        .q-ql-empty{font-size:8px;opacity:0.2;text-align:center;padding:20px 0}
        .q-ql-item{display:flex;align-items:center;gap:6px;padding:6px;border:1px solid #111;transition:border-color 0.15s}
        .q-ql-item:hover{border-color:#1e3a5f}
        .q-ql-num{font-size:9px;color:#1e3a5f;font-weight:700;flex-shrink:0;width:22px}
        .q-ql-info{flex:1;min-width:0}
        .q-ql-text{font-size:8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-bottom:2px}
        .q-ql-meta{display:flex;gap:6px;font-size:6px;opacity:0.45}
        .q-ql-rm{background:none;border:none;color:#555;font-size:14px;cursor:pointer;flex-shrink:0;line-height:1}
        .q-ql-rm:hover{color:#fff}
        .q-ql-sum{margin-top:8px;padding-top:8px;border-top:1px solid #1e3a5f;display:flex;justify-content:space-between;font-size:7px;opacity:0.5}
        .q-q-editor{background:#090909;border:1px solid #1e3a5f;padding:14px;overflow-y:auto}
        .q-opts-section{margin:10px 0}
        .q-opt-row{display:flex;align-items:center;gap:8px;margin-bottom:5px}
        .q-radio{width:12px;height:12px;cursor:pointer;flex-shrink:0;accent-color:#1e3a5f}
        .q-opt-label{font-size:8px;opacity:0.5;width:14px;flex-shrink:0}
        .q-opt-inp{flex:1}
        .q-add-q-btn{width:100%;background:#1e3a5f;border:none;color:#fff;padding:9px;font-size:9px;cursor:pointer;font-family:inherit;letter-spacing:1px;transition:background 0.2s;margin-top:12px}
        .q-add-q-btn:hover:not(:disabled){background:#2a4a7a}
        .q-add-q-btn:disabled{opacity:0.35;cursor:not-allowed}
        .q-settings-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
        .q-setting-card{background:#0e0e0e;border:1px solid #1a1a1a;padding:12px 14px;display:flex;justify-content:space-between;align-items:center;gap:12px;transition:border-color 0.15s}
        .q-setting-card:hover{border-color:#1e3a5f}
        .q-sc-label{font-size:9px;margin-bottom:2px}
        .q-sc-sub{font-size:7px;opacity:0.35}
        .q-toggle{width:36px;height:18px;border-radius:9px;background:#1a1a1a;border:1px solid #222;position:relative;cursor:pointer;flex-shrink:0;transition:background 0.2s}
        .q-toggle-on{background:#1e3a5f;border-color:#1e3a5f}
        .q-toggle-knob{position:absolute;top:2px;left:2px;width:12px;height:12px;border-radius:50%;background:#555;transition:transform 0.2s,background 0.2s}
        .q-toggle-on .q-toggle-knob{transform:translateX(18px);background:#fff}
        .q-review-panel{background:#090909;border:1px solid #1e3a5f;padding:14px}
        .q-pd-title{font-size:8px;letter-spacing:1.5px;opacity:0.35;margin-bottom:4px}
        .q-pd-row{display:flex;justify-content:space-between;font-size:9px;padding:4px 8px;border-bottom:1px dotted #0d0d0d;background:#090909}
        .q-pd-row span:first-child{opacity:0.45}
        .q-published{display:flex;flex-direction:column;align-items:center;gap:20px;text-align:center;padding:40px}
        .q-pub-title{font-size:16px;font-weight:700;letter-spacing:3px;color:#6ab4ff}
        .q-pub-sub{font-size:9px;opacity:0.4}
        .q-pub-creds{display:flex;gap:20px}
        .q-pub-cred{background:#090909;border:1px solid #1e3a5f;padding:16px 28px;display:flex;flex-direction:column;gap:6px;align-items:center}
        .q-pub-cred>span:first-child{font-size:7px;opacity:0.4;letter-spacing:1px}
        .q-pub-code{font-size:28px;font-weight:700;letter-spacing:6px}
        .q-pub-pass{font-size:24px;font-weight:700;letter-spacing:4px;color:#6ab4ff}
        .q-pub-details{background:#090909;border:1px solid #1e3a5f;padding:14px 24px;min-width:300px}
        .q-pub-acts{display:flex;gap:12px}
        .q-step-nav{display:flex;justify-content:space-between;align-items:center;padding:14px 0;border-top:1px solid #1e3a5f;margin-top:4px}
        .q-nav-btn{padding:8px 24px;font-size:9px;cursor:pointer;font-family:inherit;letter-spacing:1px;transition:all 0.2s}
        .q-nav-btn.primary{background:#1e3a5f;border:none;color:#fff}
        .q-nav-btn.primary:hover:not(:disabled){background:#2a4a7a}
        .q-nav-btn.secondary{background:none;border:1px solid #1a1a1a;color:#fff}
        .q-nav-btn.secondary:hover:not(:disabled){border-color:#1e3a5f}
        .q-nav-btn:disabled{opacity:0.3;cursor:not-allowed}
        .q-step-indicator{font-size:8px;opacity:0.35;letter-spacing:1px}

        /* Scan line */
        .q-scan-line{position:fixed;top:0;left:0;right:0;height:100%;background:linear-gradient(to bottom,transparent 0%,rgba(30,58,95,0.02) 50%,transparent 100%);pointer-events:none;animation:qscan 8s linear infinite;z-index:999}
        @keyframes qscan{0%{transform:translateY(-100%)}100%{transform:translateY(100%)}}

        /* Responsive */
        @media(max-width:1200px){.q-stats-grid{grid-template-columns:repeat(3,1fr)}.q-table-header,.q-table-row{grid-template-columns:2fr 70px 90px 55px 75px 80px 55px 45px 45px 80px}}
        @media(max-width:1000px){.q-main{flex-direction:column}.q-sidebar{width:100%}.qt-body{grid-template-columns:1fr}.q-join-grid{grid-template-columns:1fr 1fr}.q-q-layout{grid-template-columns:1fr}.q-settings-grid{grid-template-columns:1fr}}
        @media(max-width:768px){.q-stats-grid{grid-template-columns:repeat(2,1fr)}.q-join-grid{grid-template-columns:1fr}.q-form-grid{grid-template-columns:1fr}.q-join-manual{grid-template-columns:1fr}.qr-stats{grid-template-columns:repeat(2,1fr)}.qr-lb-row{grid-template-columns:24px 100px 1fr 50px 70px}}
      `}</style>
    </div>
  )
}
