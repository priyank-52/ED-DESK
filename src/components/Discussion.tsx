// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

// ==================== TYPES ====================

interface Reply {
  id: string
  userId: string
  userName: string
  userRole: 'teacher' | 'student' | 'admin'
  content: string
  codeSnippet?: string
  timestamp: Date
  editedAt?: Date
  likes: string[]
  dislikes: string[]
  replies?: Reply[]
  parentId?: string
  isSolution?: boolean
  isPinned?: boolean
  isEdited?: boolean
}

interface Discussion {
  id: string
  topic: string
  content: string
  codeSnippet?: string
  createdBy: string
  creatorName: string
  creatorRole: 'teacher' | 'student' | 'admin'
  creatorBadges: string[]
  createdAt: Date
  views: number
  replies: Reply[]
  likes: number
  dislikes: number
  tags: string[]
  category: string
  isPinned: boolean
  isLocked: boolean
  isSolved: boolean
  hasSolution: boolean
  lastActivity: Date
  contributors: string[]
}

interface Category {
  id: string
  name: string
  description: string
  count: number
}

interface ForumStats {
  totalTopics: number
  totalReplies: number
  totalContributors: number
  solvedCount: number
  activeToday: number
  views: number
}

// ==================== COMPONENT ====================

export default function DiscussionForum() {
  const navigate = useNavigate()
  const editorRef = useRef<HTMLTextAreaElement>(null)

  // ── View State ──
  const [view, setView] = useState<'list' | 'detail' | 'create'>('list')
  const [time, setTime] = useState(new Date())
  const [logs, setLogs] = useState<string[]>([])

  // ── List State ──
  const [selectedDiscussion, setSelectedDiscussion] = useState<Discussion | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'unanswered' | 'solved'>('latest')
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week' | 'month'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  // ── Create State ──
  const [draftTopic, setDraftTopic] = useState('')
  const [draftContent, setDraftContent] = useState('')
  const [draftCategory, setDraftCategory] = useState('general')
  const [draftCode, setDraftCode] = useState('')
  const [draftTags, setDraftTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [showCodeInCreate, setShowCodeInCreate] = useState(false)

  // ── Reply State ──
  const [newReply, setNewReply] = useState('')
  const [replyCode, setReplyCode] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [showCodeEditor, setShowCodeEditor] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ── Modals ──
  const [showReport, setShowReport] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [reportTarget, setReportTarget] = useState('')

  // ── Data ──
  const [categories] = useState<Category[]>([
    { id: 'general', name: 'General', description: 'General CS topics', count: 156 },
    { id: 'algorithms', name: 'Algorithms', description: 'Algorithm design and analysis', count: 89 },
    { id: 'data-structures', name: 'Data Structures', description: 'Arrays, trees, graphs', count: 67 },
    { id: 'web-dev', name: 'Web Dev', description: 'Frontend and backend', count: 123 },
    { id: 'system-design', name: 'System Design', description: 'Architecture and scalability', count: 28 },
    { id: 'database', name: 'Databases', description: 'SQL, NoSQL, optimization', count: 34 },
    { id: 'career', name: 'Career', description: 'Interview prep and advice', count: 92 },
  ])

  const [stats, setStats] = useState<ForumStats>({
    totalTopics: 3, totalReplies: 8, totalContributors: 6,
    solvedCount: 2, activeToday: 5, views: 2693
  })

  const [discussions, setDiscussions] = useState<Discussion[]>([
    {
      id: 'd1', topic: 'Understanding Time Complexity: A Comprehensive Guide',
      content: `I have been struggling with Big O notation and time complexity analysis. Can someone explain the difference between O(n), O(log n), and O(n log n) with practical examples?\n\nI understand the basics but when it comes to analyzing recursive algorithms, I get confused. For example, how do we analyze the time complexity of merge sort?\n\nWould appreciate:\n1. Clear definitions\n2. Visual examples\n3. Common pitfalls\n4. Practice problems`,
      codeSnippet: `function mergeSort(arr) {\n  if (arr.length <= 1) return arr;\n  const mid = Math.floor(arr.length / 2);\n  const left = mergeSort(arr.slice(0, mid));\n  const right = mergeSort(arr.slice(mid));\n  return merge(left, right);\n}`,
      createdBy: 'u1', creatorName: 'Dr. Sharma', creatorRole: 'teacher',
      creatorBadges: ['PhD', 'Mentor', 'Top Contributor'],
      createdAt: new Date(Date.now() - 86400000 * 2), views: 1234,
      replies: [
        {
          id: 'r1', userId: 'u2', userName: 'Priya Singh', userRole: 'student',
          content: `Great question. Let me break down time complexity:\n\nO(1) — Constant time. Operations that take the same time regardless of input size. Example: array access by index.\n\nO(log n) — Logarithmic time. Operations that halve the problem each step. Example: binary search.\n\nO(n) — Linear time. Operations that scale linearly. Example: single loop through array.\n\nO(n log n) — Linearithmic. Common in efficient sorting. Example: merge sort, quicksort average case.\n\nO(n2) — Quadratic. Nested loops. Example: bubble sort, selection sort.\n\nFor merge sort specifically: each level splits array in half giving log n levels. At each level we do O(n) work merging. Total: O(n log n).`,
          codeSnippet: `// Binary Search O(log n)\nfunction binarySearch(arr, target) {\n  let left = 0, right = arr.length - 1;\n  while (left <= right) {\n    const mid = Math.floor((left + right) / 2);\n    if (arr[mid] === target) return mid;\n    if (arr[mid] < target) left = mid + 1;\n    else right = mid - 1;\n  }\n  return -1;\n}`,
          timestamp: new Date(Date.now() - 43200000),
          likes: ['u3', 'u4', 'u5', 'u6'], dislikes: [],
          isSolution: false, isPinned: false,
          replies: [
            {
              id: 'r1_1', userId: 'u3', userName: 'Rahul Kumar', userRole: 'student',
              content: 'This is incredibly helpful. Can you also explain space complexity?',
              timestamp: new Date(Date.now() - 21600000), likes: ['u2'], dislikes: []
            },
            {
              id: 'r1_2', userId: 'u2', userName: 'Priya Singh', userRole: 'student',
              content: `Space complexity refers to memory usage:\n\nO(1) — Constant space, in-place algorithms.\nO(n) — Linear space, copying arrays.\nO(n2) — Quadratic space, 2D matrices.\n\nFor recursive algorithms, remember to account for the call stack space as well.`,
              timestamp: new Date(Date.now() - 10800000), likes: ['u1', 'u3'], dislikes: []
            }
          ]
        },
        {
          id: 'r2', userId: 'u4', userName: 'Prof. Verma', userRole: 'teacher',
          content: `Excellent discussion. Let me add some practical tips:\n\n1. Always look for nested loops — they often indicate O(n2).\n2. Recursion with multiple calls per level often indicates O(2^n).\n3. Sorting algorithms are usually O(n log n).\n4. Hash table operations are O(1) average case.\n5. Binary search on sorted data is always O(log n).\n\nVisualize the problem size growth: double the input, how much slower does it get? O(1): same. O(log n): barely more. O(n): twice as slow. O(n2): four times as slow.`,
          timestamp: new Date(Date.now() - 86400000),
          likes: ['u1', 'u2', 'u5', 'u7'], dislikes: [],
          isSolution: true, isPinned: true
        }
      ],
      likes: 45, dislikes: 3,
      tags: ['algorithms', 'time-complexity', 'big-o', 'beginner'],
      category: 'algorithms', isPinned: true, isLocked: false,
      isSolved: true, hasSolution: true,
      lastActivity: new Date(Date.now() - 3600000),
      contributors: ['u2', 'u3', 'u4']
    },
    {
      id: 'd2', topic: 'System Design: Designing a URL Shortener like TinyURL',
      content: `I am preparing for system design interviews and want to understand how to design a URL shortener.\n\nRequirements:\n- Generate unique short URLs\n- Handle millions of URLs\n- High availability and low latency\n\nMy initial thoughts:\n1. Base62 encoding for short URLs\n2. Database to store mappings\n3. Cache frequently accessed URLs\n4. Load balancers for scaling\n\nWhat am I missing? How would you handle custom short URLs, analytics tracking, expiration policies, and rate limiting?`,
      createdBy: 'u5', creatorName: 'Anjali Patel', creatorRole: 'student',
      creatorBadges: ['SDE Intern', 'Top Contributor'],
      createdAt: new Date(Date.now() - 86400000 * 5), views: 892,
      replies: [
        {
          id: 'r3', userId: 'u6', userName: 'Vikram Singh', userRole: 'student',
          content: `Great question. Here is a comprehensive design:\n\nAPI Layer:\n- POST /shorten — Create short URL\n- GET /{shortCode} — Redirect\n- GET /analytics/{shortCode} — Get stats\n\nLoad Balancers: distribute traffic using consistent hashing for cache affinity.\n\nDatabase Layer:\n- Primary DB (PostgreSQL) for mappings\n- Table: url_mappings (id, long_url, short_code, created_at, expires_at, user_id)\n- Cache Layer (Redis) with LRU eviction and TTL\n\nURL Generation Strategies:\n1. Base62 encoding — counter-based, predictable\n2. MD5 hashing with first 6 chars — risk of collision\n3. Distributed ID Generator (Snowflake) — guarantees uniqueness\n\nScaling: shard by short_code, read replicas for analytics, CDN for static assets, message queue for async processing.`,
          codeSnippet: `class URLShortener {\n  async createShortURL(longUrl, userId) {\n    await this.checkRateLimit(userId);\n    const shortCode = await this.generateUniqueCode();\n    await db.urlMappings.create({ shortCode, longUrl, userId });\n    await redis.setex(shortCode, 3600, longUrl);\n    await queue.add('analytics', { shortCode, event: 'create' });\n    return \`https://short.url/\${shortCode}\`;\n  }\n}`,
          timestamp: new Date(Date.now() - 86400000 * 3),
          likes: ['u1', 'u4', 'u7', 'u8'], dislikes: [],
          isSolution: true, isPinned: false,
          replies: [
            {
              id: 'r3_1', userId: 'u5', userName: 'Anjali Patel', userRole: 'student',
              content: 'This is extremely detailed, thank you. How would you handle custom short URLs specifically?',
              timestamp: new Date(Date.now() - 86400000 * 2), likes: ['u6'], dislikes: []
            },
            {
              id: 'r3_2', userId: 'u6', userName: 'Vikram Singh', userRole: 'student',
              content: `For custom URLs:\n\n1. Validation: check if custom code is already taken.\n2. Constraints: min 3 chars, max 16 chars, alphanumeric plus dash and underscore.\n3. Reservation: let users reserve custom URLs in advance.\n4. Premium Feature: consider making it a paid feature to reduce abuse.\n\nAdditional: profanity filter, reserved words (api, admin, www), case-insensitive uniqueness check.`,
              timestamp: new Date(Date.now() - 86400000), likes: ['u5'], dislikes: []
            }
          ]
        }
      ],
      likes: 67, dislikes: 2,
      tags: ['system-design', 'scalability', 'database', 'caching'],
      category: 'system-design', isPinned: true, isLocked: false,
      isSolved: true, hasSolution: true,
      lastActivity: new Date(Date.now() - 3600000),
      contributors: ['u6', 'u7', 'u8']
    },
    {
      id: 'd3', topic: 'JavaScript Closures: Understanding the Magic',
      content: `I have been learning JavaScript and closures are confusing me. Can someone explain:\n\n1. What exactly is a closure?\n2. How do they work under the hood?\n3. Practical use cases\n4. Common pitfalls\n\nI have read the MDN docs but still struggling with practical implementation.`,
      codeSnippet: `function outer() {\n  let count = 0;\n  return function inner() {\n    count++;\n    console.log(count);\n  }\n}\nconst counter = outer();\ncounter(); // 1\ncounter(); // 2\ncounter(); // 3`,
      createdBy: 'u8', creatorName: 'Neha Gupta', creatorRole: 'student',
      creatorBadges: [],
      createdAt: new Date(Date.now() - 86400000 * 3), views: 567,
      replies: [
        {
          id: 'r5', userId: 'u9', userName: 'Rajesh Kumar', userRole: 'student',
          content: `A closure is a function that has access to its outer function scope even after the outer function has returned.\n\nHow it works: when a function is defined in JavaScript, it carries its lexical environment with it — local variables, outer function variables, global variables. The inner function maintains a reference to outer variables, preventing garbage collection.\n\nCommon Use Cases:\n\n1. Data Privacy — encapsulate private state using closures instead of exposing variables globally.\n\n2. Function Factories — create specialized functions that share a common base.\n\n3. Event Handlers — closures let handlers remember context from when they were created.\n\nCommon Pitfalls:\n\nMemory Leaks — if a large object is captured in a closure and the closure lives long, the object is never garbage collected.\n\nLoop with var — var is function-scoped not block-scoped, so all iterations share the same variable. Use let instead.`,
          codeSnippet: `// Data Privacy\nconst BankAccount = (initialBalance) => {\n  let balance = initialBalance;\n  return {\n    deposit: (amt) => { balance += amt; return balance; },\n    withdraw: (amt) => {\n      if (amt <= balance) { balance -= amt; return balance; }\n      return 'Insufficient funds';\n    },\n    getBalance: () => balance\n  };\n};\n\n// Function Factory\nconst multiplyBy = (x) => (y) => x * y;\nconst double = multiplyBy(2);\nconst triple = multiplyBy(3);`,
          timestamp: new Date(Date.now() - 86400000 * 2),
          likes: ['u1', 'u3', 'u5', 'u8'], dislikes: [],
          isSolution: true, isPinned: false,
          replies: [
            {
              id: 'r5_1', userId: 'u8', userName: 'Neha Gupta', userRole: 'student',
              content: 'The BankAccount example made it click instantly. Thank you so much.',
              timestamp: new Date(Date.now() - 86400000), likes: ['u9'], dislikes: []
            }
          ]
        }
      ],
      likes: 34, dislikes: 1,
      tags: ['javascript', 'closures', 'beginner', 'web-dev'],
      category: 'web-dev', isPinned: false, isLocked: false,
      isSolved: true, hasSolution: true,
      lastActivity: new Date(Date.now() - 86400000),
      contributors: ['u9']
    }
  ])

  // ── Effects ──

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // Simulate live view increments
  useEffect(() => {
    const interval = setInterval(() => {
      setDiscussions(prev => prev.map(d => ({
        ...d,
        views: d.views + (Math.random() > 0.7 ? 1 : 0)
      })))
      setStats(prev => ({ ...prev, views: prev.views + Math.floor(Math.random() * 3) }))
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // Update selectedDiscussion when data changes
  useEffect(() => {
    if (selectedDiscussion) {
      const updated = discussions.find(d => d.id === selectedDiscussion.id)
      if (updated) setSelectedDiscussion(updated)
    }
  }, [discussions])

  // ── Utilities ──

  const ft = (d: Date) => d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const ftShort = (d: Date) => d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
  const addLog = (msg: string) => setLogs(prev => [`[${ft(new Date())}] ${msg}`, ...prev.slice(0, 29)])

  const timeAgo = (date: Date): string => {
    const s = Math.floor((Date.now() - date.getTime()) / 1000)
    if (s < 60) return `${s}s ago`
    if (s < 3600) return `${Math.floor(s / 60)}m ago`
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`
    if (s < 2592000) return `${Math.floor(s / 86400)}d ago`
    return `${Math.floor(s / 2592000)}mo ago`
  }

  const roleClass = (role: string) => role === 'teacher' ? 'role-teacher' : role === 'admin' ? 'role-admin' : 'role-student'

  const totalReplies = (replies: Reply[]): number =>
    replies.reduce((s, r) => s + 1 + totalReplies(r.replies || []), 0)

  // ── Filter / Sort ──

  const filtered = discussions
    .filter(d => {
      if (selectedCategory !== 'all' && d.category !== selectedCategory) return false
      if (search) {
        const q = search.toLowerCase()
        return d.topic.toLowerCase().includes(q) || d.content.toLowerCase().includes(q) || d.tags.some(t => t.includes(q))
      }
      if (timeFilter !== 'all') {
        const ranges: Record<string, number> = { today: 86400000, week: 86400000 * 7, month: 86400000 * 30 }
        if (d.createdAt.getTime() < Date.now() - ranges[timeFilter]) return false
      }
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'latest') return b.lastActivity.getTime() - a.lastActivity.getTime()
      if (sortBy === 'popular') return (b.likes + b.views) - (a.likes + a.views)
      if (sortBy === 'unanswered') return a.replies.length - b.replies.length
      if (sortBy === 'solved') return (b.hasSolution ? 1 : 0) - (a.hasSolution ? 1 : 0)
      return 0
    })

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage))
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // ── Actions ──

  const handleCreate = () => {
    if (!draftTopic.trim() || !draftContent.trim()) return
    setIsSubmitting(true)
    const d: Discussion = {
      id: `d-${Date.now()}`, topic: draftTopic, content: draftContent,
      codeSnippet: draftCode || undefined,
      createdBy: 'me', creatorName: 'You', creatorRole: 'student', creatorBadges: [],
      createdAt: new Date(), views: 0, replies: [],
      likes: 0, dislikes: 0, tags: draftTags, category: draftCategory,
      isPinned: false, isLocked: false, isSolved: false, hasSolution: false,
      lastActivity: new Date(), contributors: ['me']
    }
    setDiscussions(prev => [d, ...prev])
    setStats(prev => ({ ...prev, totalTopics: prev.totalTopics + 1 }))
    addLog(`POSTED "${draftTopic.substring(0, 30)}"`)
    setDraftTopic(''); setDraftContent(''); setDraftCode(''); setDraftTags([]); setTagInput('')
    setIsSubmitting(false)
    setView('list')
  }

  const handleAddReply = (discussionId: string) => {
    if (!newReply.trim() && !replyCode.trim()) return
    setIsSubmitting(true)
    const reply: Reply = {
      id: `r-${Date.now()}`, userId: 'me', userName: 'You', userRole: 'student',
      content: newReply, codeSnippet: replyCode || undefined,
      timestamp: new Date(), likes: [], dislikes: [], parentId: replyTo || undefined
    }
    setDiscussions(prev => prev.map(d => {
      if (d.id !== discussionId) return d
      const updatedReplies = replyTo ? addNestedReply(d.replies, replyTo, reply) : [...d.replies, reply]
      return {
        ...d, replies: updatedReplies, lastActivity: new Date(),
        contributors: [...new Set([...d.contributors, 'me'])]
      }
    }))
    setStats(prev => ({ ...prev, totalReplies: prev.totalReplies + 1 }))
    addLog(`REPLIED in "${selectedDiscussion?.topic.substring(0, 24)}"`)
    setNewReply(''); setReplyCode(''); setReplyTo(null); setShowCodeEditor(false)
    setIsSubmitting(false)
  }

  const addNestedReply = (replies: Reply[], parentId: string, newR: Reply): Reply[] =>
    replies.map(r => {
      if (r.id === parentId) return { ...r, replies: [...(r.replies || []), newR] }
      if (r.replies) return { ...r, replies: addNestedReply(r.replies, parentId, newR) }
      return r
    })

  const handleLikeReply = (discussionId: string, replyId: string) => {
    setDiscussions(prev => prev.map(d => {
      if (d.id !== discussionId) return d
      return { ...d, replies: toggleLike(d.replies, replyId, 'me') }
    }))
  }

  const toggleLike = (replies: Reply[], id: string, userId: string): Reply[] =>
    replies.map(r => {
      if (r.id === id) {
        const liked = r.likes.includes(userId)
        return { ...r, likes: liked ? r.likes.filter(u => u !== userId) : [...r.likes, userId] }
      }
      if (r.replies) return { ...r, replies: toggleLike(r.replies, id, userId) }
      return r
    })

  const handleMarkSolution = (discussionId: string, replyId: string) => {
    setDiscussions(prev => prev.map(d => {
      if (d.id !== discussionId) return d
      return {
        ...d, isSolved: true, hasSolution: true,
        replies: d.replies.map(r => ({ ...r, isSolution: r.id === replyId }))
      }
    }))
    setStats(prev => ({ ...prev, solvedCount: prev.solvedCount + 1 }))
    addLog(`SOLUTION marked in "${selectedDiscussion?.topic.substring(0, 24)}"`)
  }

  const handleVoteDiscussion = (id: string, type: 'up' | 'down') => {
    setDiscussions(prev => prev.map(d =>
      d.id === id ? { ...d, likes: d.likes + (type === 'up' ? 1 : 0), dislikes: d.dislikes + (type === 'down' ? 1 : 0) } : d
    ))
  }

  const openDiscussion = (d: Discussion) => {
    setSelectedDiscussion(d)
    setDiscussions(prev => prev.map(p => p.id === d.id ? { ...p, views: p.views + 1 } : p))
    setView('detail')
    addLog(`VIEWED "${d.topic.substring(0, 30)}"`)
  }

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      setDraftTags(prev => [...prev, tagInput.trim().toLowerCase()])
      setTagInput('')
    }
  }

  // ── Render Reply Tree ──

  const renderReplies = (replies: Reply[], depth = 0): React.ReactNode => {
    return replies.map(reply => (
      <div key={reply.id} className={`df-reply-thread depth-${Math.min(depth, 3)}`}>
        <div className={`df-reply-item ${reply.isSolution ? 'df-reply-solution' : ''} ${reply.isPinned ? 'df-reply-pinned' : ''}`}>
          {/* Vote Column */}
          <div className="df-reply-votes">
            <button className="df-vote-btn" onClick={() => handleLikeReply(selectedDiscussion?.id || '', reply.id)}>▲</button>
            <span className="df-vote-cnt">{reply.likes.length - reply.dislikes.length}</span>
            <button className="df-vote-btn">▼</button>
            {reply.isSolution && <span className="df-sol-badge">SOL</span>}
            {reply.isPinned && <span className="df-pin-badge">PIN</span>}
          </div>

          {/* Content */}
          <div className="df-reply-body">
            <div className="df-reply-head">
              <div className="df-reply-user">
                <span className={`df-rbadge ${roleClass(reply.userRole)}`}>{reply.userRole.toUpperCase()}</span>
                <span className="df-rname">{reply.userName}</span>
                <span className="df-rtime">{timeAgo(reply.timestamp)}</span>
                {reply.isEdited && <span className="df-edited">EDITED</span>}
              </div>
            </div>

            <div className="df-reply-content">
              {reply.content.split('\n').filter(l => l).map((line, i) => {
                if (line.match(/^\d\./)) return <div key={i} className="df-list-item">{line}</div>
                if (line.startsWith('- ')) return <div key={i} className="df-list-item">{line}</div>
                return <div key={i} className="df-line">{line}</div>
              })}
            </div>

            {reply.codeSnippet && (
              <div className="df-reply-code">
                <div className="df-code-header">CODE SNIPPET</div>
                <pre><code>{reply.codeSnippet}</code></pre>
              </div>
            )}

            <div className="df-reply-acts">
              <button
                className={`df-act-btn ${reply.likes.includes('me') ? 'df-act-liked' : ''}`}
                onClick={() => handleLikeReply(selectedDiscussion?.id || '', reply.id)}
              >
                {reply.likes.includes('me') ? '▲ ' : '▲ '}{reply.likes.length} LIKES
              </button>
              <button className="df-act-btn" onClick={() => {
                setReplyTo(reply.id)
                setNewReply(`@${reply.userName} `)
                editorRef.current?.focus()
              }}>
                REPLY
              </button>
              {selectedDiscussion?.creatorRole === 'teacher' && !selectedDiscussion?.hasSolution && (
                <button className="df-act-btn df-act-sol" onClick={() => handleMarkSolution(selectedDiscussion?.id || '', reply.id)}>
                  MARK SOLUTION
                </button>
              )}
              <button className="df-act-btn" onClick={() => { setReportTarget(reply.id); setShowReport(true) }}>REPORT</button>
            </div>
          </div>
        </div>

        {reply.replies && reply.replies.length > 0 && (
          <div className="df-nested">{renderReplies(reply.replies, depth + 1)}</div>
        )}
      </div>
    ))
  }

  // ==================== RENDER ====================

  return (
    <div className="dfroot">

      {/* ── PAGE HEADER ── */}
      <div className="df-page-header">
        <div className="df-page-title">
          <span className="df-title-text">DISCUSSION FORUM</span>
          <span className="df-title-sub">OFFLINE ACADEMIC DISCUSSION BOARD • LAN-BASED • END-TO-END ENCRYPTED</span>
        </div>
        <div className="df-page-meta">
          <span className="df-version">v1.0.0</span>
          <span className="df-time">{ftShort(time)}</span>
          <div className="df-log-box">
            <span className="df-log-line">{logs[0] || '[System ready]'}</span>
          </div>
        </div>
      </div>

      {/* ── STATS GRID ── */}
      <div className="df-stats-grid">
        {[
          { label: 'TOTAL TOPICS', val: stats.totalTopics, pct: 100 },
          { label: 'TOTAL REPLIES', val: stats.totalReplies, pct: 72 },
          { label: 'CONTRIBUTORS', val: stats.totalContributors, pct: 60 },
          { label: 'SOLVED', val: stats.solvedCount, pct: (stats.solvedCount / Math.max(stats.totalTopics, 1)) * 100 },
          { label: 'ACTIVE TODAY', val: stats.activeToday, pct: 50 },
          { label: 'TOTAL VIEWS', val: stats.views, pct: 80 },
        ].map((s, i) => (
          <div key={i} className="df-stat-card">
            <div className="dfsc-head">
              <span>{s.label}</span>
              <span className="dfsc-val">{s.val}</span>
            </div>
            <div className="dfsc-bar"><div className="dfsc-fill" style={{ width: `${Math.min(s.pct, 100)}%` }} /></div>
          </div>
        ))}
      </div>

      {/* ── MAIN PANEL ── */}
      <div className="df-main">

        {/* ── SIDEBAR ── */}
        <aside className="df-sidebar">
          <div className="df-sb-section">
            <div className="df-sb-title">NAVIGATION</div>
            {[
              { key: 'list', label: 'Discussion List' },
              { key: 'create', label: 'New Discussion' },
            ].map(item => (
              <button key={item.key} className={`df-sb-btn ${view === item.key ? 'df-sb-active' : ''}`}
                onClick={() => { setView(item.key as any); setSelectedDiscussion(null) }}>
                <span className="df-sb-arrow">{view === item.key ? '▸' : '·'}</span>
                {item.label}
              </button>
            ))}
          </div>

          {/* Categories */}
          <div className="df-sb-section">
            <div className="df-sb-title">CATEGORIES</div>
            <button className={`df-cat-btn ${selectedCategory === 'all' ? 'df-cat-active' : ''}`}
              onClick={() => { setSelectedCategory('all'); setView('list'); setCurrentPage(1) }}>
              <span>All Topics</span>
              <span className="df-cat-cnt">{discussions.length}</span>
            </button>
            {categories.map(cat => (
              <button key={cat.id} className={`df-cat-btn ${selectedCategory === cat.id ? 'df-cat-active' : ''}`}
                onClick={() => { setSelectedCategory(cat.id); setView('list'); setCurrentPage(1) }}>
                <span>{cat.name}</span>
                <span className="df-cat-cnt">{cat.count}</span>
              </button>
            ))}
          </div>

          {/* Trending Tags */}
          <div className="df-sb-section">
            <div className="df-sb-title">TRENDING TAGS</div>
            <div className="df-tags-cloud">
              {Array.from(new Set(discussions.flatMap(d => d.tags))).slice(0, 12).map(tag => (
                <button key={tag} className={`df-tag-chip ${search === tag ? 'df-tag-active' : ''}`}
                  onClick={() => { setSearch(tag); setView('list') }}>
                  #{tag}
                </button>
              ))}
            </div>
          </div>

          {/* Activity Log */}
          <div className="df-sb-section df-sb-flex">
            <div className="df-sb-title">ACTIVITY LOG</div>
            <div className="df-sb-logs">
              {logs.length === 0 ? <div className="df-sb-log-empty">[Awaiting activity]</div>
                : logs.slice(0, 12).map((l, i) => <div key={i} className="df-sb-log">{l}</div>)}
            </div>
          </div>
        </aside>

        {/* ── CONTENT ── */}
        <div className="df-content">

          {/* ════════════════ LIST VIEW ════════════════ */}
          {view === 'list' && (
            <div className="df-list-view">
              {/* Toolbar */}
              <div className="df-toolbar">
                <input className="df-search" placeholder="Search discussions, topics, tags..."
                  value={search} onChange={e => setSearch(e.target.value)} />
                <div className="df-toolbar-right">
                  <div className="df-filters">
                    {(['latest', 'popular', 'unanswered', 'solved'] as const).map(f => (
                      <button key={f} className={`df-fbtn ${sortBy === f ? 'df-factive' : ''}`}
                        onClick={() => setSortBy(f)}>{f.toUpperCase()}</button>
                    ))}
                  </div>
                  <div className="df-filters">
                    {(['all', 'today', 'week', 'month'] as const).map(f => (
                      <button key={f} className={`df-fbtn ${timeFilter === f ? 'df-factive' : ''}`}
                        onClick={() => setTimeFilter(f)}>{f.toUpperCase()}</button>
                    ))}
                  </div>
                  <button className="df-new-btn" onClick={() => setView('create')}>+ NEW DISCUSSION</button>
                </div>
              </div>

              {/* Table header */}
              <div className="df-table-header">
                <span>TOPIC</span>
                <span>CATEGORY</span>
                <span>AUTHOR</span>
                <span>TAGS</span>
                <span>STATUS</span>
                <span>VIEWS</span>
                <span>REPLIES</span>
                <span>LAST ACTIVITY</span>
              </div>
              <div className="df-table-body">
                {paginated.length === 0 && <div className="df-empty">No discussions match your filters</div>}
                {paginated.map(d => (
                  <div key={d.id} className={`df-table-row ${d.isPinned ? 'df-row-pinned' : ''} ${d.isSolved ? 'df-row-solved' : ''}`}
                    onClick={() => openDiscussion(d)}>
                    <div className="df-row-topic">
                      <div className="df-row-badges">
                        {d.isPinned && <span className="df-badge-pin">PINNED</span>}
                        {d.isSolved && <span className="df-badge-sol">SOLVED</span>}
                        {d.isLocked && <span className="df-badge-lock">LOCKED</span>}
                      </div>
                      <div className="df-row-name">{d.topic}</div>
                      <div className="df-row-excerpt">{d.content.substring(0, 80).replace(/\n/g, ' ')}...</div>
                    </div>
                    <span className="df-row-cat">{d.category}</span>
                    <div className="df-row-author">
                      <span className={`df-rbadge ${roleClass(d.creatorRole)}`}>{d.creatorRole.toUpperCase()}</span>
                      <span>{d.creatorName}</span>
                    </div>
                    <div className="df-row-tags">
                      {d.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="df-tag">#{tag}</span>
                      ))}
                      {d.tags.length > 2 && <span className="df-tag-more">+{d.tags.length - 2}</span>}
                    </div>
                    <div className="df-row-status">
                      <span className={`df-status ${d.hasSolution ? 'df-status-solved' : d.isLocked ? 'df-status-locked' : 'df-status-open'}`}>
                        {d.hasSolution ? 'SOLVED' : d.isLocked ? 'LOCKED' : 'OPEN'}
                      </span>
                    </div>
                    <span className="df-row-views">{d.views.toLocaleString()}</span>
                    <span className="df-row-replies">{totalReplies(d.replies)}</span>
                    <span className="df-row-time">{timeAgo(d.lastActivity)}</span>
                  </div>
                ))}
              </div>

              {/* Table Footer + Pagination */}
              <div className="df-table-footer">
                <span>SHOWING {Math.min((currentPage - 1) * itemsPerPage + 1, filtered.length)}–{Math.min(currentPage * itemsPerPage, filtered.length)} OF {filtered.length}</span>
                <div className="df-pagination">
                  <button className="df-page-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>←</button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                    .map((p, idx, arr) => (
                      <React.Fragment key={p}>
                        {idx > 0 && arr[idx - 1] !== p - 1 && <span className="df-page-ellipsis">…</span>}
                        <button className={`df-page-btn ${currentPage === p ? 'df-page-active' : ''}`} onClick={() => setCurrentPage(p)}>{p}</button>
                      </React.Fragment>
                    ))}
                  <button className="df-page-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>→</button>
                </div>
                <span>{filtered.filter(d => d.isSolved).length} SOLVED / {filtered.filter(d => !d.isSolved).length} OPEN</span>
              </div>
            </div>
          )}

          {/* ════════════════ DETAIL VIEW ════════════════ */}
          {view === 'detail' && selectedDiscussion && (
            <div className="df-detail-view">
              {/* Nav */}
              <div className="df-detail-nav">
                <button className="df-back-btn" onClick={() => { setView('list'); setSelectedDiscussion(null) }}>
                  ← BACK TO LIST
                </button>
                <div className="df-nav-acts">
                  <button className="df-nav-btn" onClick={() => handleVoteDiscussion(selectedDiscussion.id, 'up')}>
                    UPVOTE ({selectedDiscussion.likes})
                  </button>
                  <button className="df-nav-btn" onClick={() => setShowShare(true)}>SHARE</button>
                  <button className="df-nav-btn" onClick={() => { setReportTarget(selectedDiscussion.id); setShowReport(true) }}>REPORT</button>
                </div>
              </div>

              {/* Discussion Header */}
              <div className="df-disc-header">
                <div className="df-disc-badges">
                  {selectedDiscussion.isPinned && <span className="df-badge-pin">PINNED</span>}
                  {selectedDiscussion.isSolved && <span className="df-badge-sol">SOLVED</span>}
                  {selectedDiscussion.isLocked && <span className="df-badge-lock">LOCKED</span>}
                  <span className="df-badge-cat">{selectedDiscussion.category.toUpperCase()}</span>
                </div>
                <div className="df-disc-title">{selectedDiscussion.topic}</div>
                <div className="df-disc-meta">
                  <div className="df-disc-author">
                    <span className={`df-rbadge ${roleClass(selectedDiscussion.creatorRole)}`}>
                      {selectedDiscussion.creatorRole.toUpperCase()}
                    </span>
                    <span className="df-disc-aname">{selectedDiscussion.creatorName}</span>
                    {selectedDiscussion.creatorBadges.map(b => (
                      <span key={b} className="df-user-badge">{b}</span>
                    ))}
                  </div>
                  <div className="df-disc-stats">
                    <span>POSTED {timeAgo(selectedDiscussion.createdAt)}</span>
                    <span>{selectedDiscussion.views} VIEWS</span>
                    <span>{totalReplies(selectedDiscussion.replies)} REPLIES</span>
                    <span>{selectedDiscussion.likes} LIKES</span>
                    <span>LAST ACTIVE {timeAgo(selectedDiscussion.lastActivity)}</span>
                  </div>
                </div>
                <div className="df-disc-tags">
                  {selectedDiscussion.tags.map(tag => (
                    <span key={tag} className="df-tag">#{tag}</span>
                  ))}
                </div>
              </div>

              {/* Discussion Content */}
              <div className="df-disc-content">
                <div className="df-content-body">
                  {selectedDiscussion.content.split('\n').filter(l => l).map((line, i) => {
                    if (line.match(/^\d\./)) return <div key={i} className="df-list-item">{line}</div>
                    if (line.startsWith('- ')) return <div key={i} className="df-list-item">{line}</div>
                    return <div key={i} className="df-line">{line}</div>
                  })}
                </div>

                {selectedDiscussion.codeSnippet && (
                  <div className="df-disc-code">
                    <div className="df-code-header">CODE SNIPPET</div>
                    <pre><code>{selectedDiscussion.codeSnippet}</code></pre>
                  </div>
                )}

                <div className="df-disc-actions">
                  <button className="df-act-btn df-act-up" onClick={() => handleVoteDiscussion(selectedDiscussion.id, 'up')}>
                    ▲ UPVOTE ({selectedDiscussion.likes})
                  </button>
                  <button className="df-act-btn" onClick={() => handleVoteDiscussion(selectedDiscussion.id, 'down')}>
                    ▼ DOWNVOTE ({selectedDiscussion.dislikes})
                  </button>
                </div>
              </div>

              {/* Contributors */}
              {selectedDiscussion.contributors.length > 0 && (
                <div className="df-contributors">
                  <div className="df-section-title">CONTRIBUTORS ({selectedDiscussion.contributors.length})</div>
                  <div className="df-contrib-list">
                    {selectedDiscussion.contributors.map(cid => {
                      const r = selectedDiscussion.replies.find(r => r.userId === cid) ||
                        selectedDiscussion.replies.flatMap(r => r.replies || []).find(r => r.userId === cid)
                      const name = cid === 'me' ? 'You' : r?.userName || cid
                      return (
                        <div key={cid} className="df-contrib-chip">
                          <span className="df-contrib-name">{name}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Replies */}
              <div className="df-replies-section">
                <div className="df-replies-header">
                  <div className="df-section-title">{totalReplies(selectedDiscussion.replies)} REPLIES</div>
                  <select className="df-sort-sel" onChange={() => {}}>
                    <option value="top">TOP VOTED</option>
                    <option value="latest">LATEST</option>
                    <option value="oldest">OLDEST</option>
                  </select>
                </div>

                {renderReplies(selectedDiscussion.replies)}

                {/* Add Reply */}
                {!selectedDiscussion.isLocked && (
                  <div className="df-add-reply">
                    <div className="df-section-title">ADD REPLY</div>

                    {replyTo && (
                      <div className="df-reply-indicator">
                        REPLYING TO: @{selectedDiscussion.replies.find(r => r.id === replyTo)?.userName ||
                          selectedDiscussion.replies.flatMap(r => r.replies || []).find(r => r.id === replyTo)?.userName}
                        <button className="df-cancel-reply" onClick={() => { setReplyTo(null); setNewReply('') }}>×</button>
                      </div>
                    )}

                    <textarea
                      ref={editorRef}
                      className="df-reply-textarea"
                      placeholder="Write your reply... Be specific and constructive."
                      value={newReply}
                      onChange={e => setNewReply(e.target.value)}
                      rows={5}
                    />

                    {showCodeEditor && (
                      <div className="df-code-editor-wrap">
                        <div className="df-code-header">CODE SNIPPET</div>
                        <textarea
                          className="df-code-textarea"
                          placeholder="Paste your code here..."
                          value={replyCode}
                          onChange={e => setReplyCode(e.target.value)}
                          rows={8}
                        />
                      </div>
                    )}

                    <div className="df-reply-toolbar">
                      <button className={`df-toolbar-btn ${showCodeEditor ? 'df-toolbar-active' : ''}`}
                        onClick={() => setShowCodeEditor(p => !p)}>
                        CODE SNIPPET
                      </button>
                      <button className="df-toolbar-btn" onClick={() => {
                        const words = ['**bold**', '*italic*', '`code`', '> quote']
                        setNewReply(p => p + words[0])
                      }}>BOLD</button>
                      <button className="df-toolbar-btn" onClick={() => setNewReply(p => p + '\n1. ')}>LIST</button>
                      <div className="df-toolbar-right">
                        <span className="df-char-cnt">{newReply.length} chars</span>
                        <button className="df-submit-btn"
                          onClick={() => handleAddReply(selectedDiscussion.id)}
                          disabled={isSubmitting || (!newReply.trim() && !replyCode.trim())}>
                          {isSubmitting ? 'POSTING...' : 'POST REPLY'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {selectedDiscussion.isLocked && (
                  <div className="df-locked-msg">THIS DISCUSSION IS LOCKED — No new replies can be added</div>
                )}
              </div>
            </div>
          )}

          {/* ════════════════ CREATE VIEW ════════════════ */}
          {view === 'create' && (
            <div className="df-create-view">
              <div className="df-view-title">NEW DISCUSSION</div>
              <div className="df-create-layout">
                {/* Main Form */}
                <div className="df-create-form">
                  <div className="df-section-title">DISCUSSION DETAILS</div>
                  <div className="df-field">
                    <label>TOPIC TITLE</label>
                    <input className="df-input" value={draftTopic}
                      onChange={e => setDraftTopic(e.target.value)}
                      placeholder="Enter a clear and descriptive title" />
                  </div>
                  <div className="df-field">
                    <label>CATEGORY</label>
                    <select className="df-input" value={draftCategory} onChange={e => setDraftCategory(e.target.value)}>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="df-field">
                    <label>CONTENT</label>
                    <textarea className="df-input df-textarea" rows={10} value={draftContent}
                      onChange={e => setDraftContent(e.target.value)}
                      placeholder="Describe your topic in detail. Be specific about what you are asking or sharing. Markdown-style formatting is supported." />
                  </div>
                  <div className="df-field">
                    <label>
                      CODE SNIPPET (OPTIONAL)
                      <button className="df-toggle-code-btn" onClick={() => setShowCodeInCreate(p => !p)}>
                        {showCodeInCreate ? 'HIDE' : 'SHOW'}
                      </button>
                    </label>
                    {showCodeInCreate && (
                      <textarea className="df-input df-code-input df-textarea" rows={8} value={draftCode}
                        onChange={e => setDraftCode(e.target.value)}
                        placeholder="Paste relevant code here..." />
                    )}
                  </div>
                  <div className="df-field">
                    <label>TAGS (Press Enter to add)</label>
                    <input className="df-input" value={tagInput}
                      onChange={e => setTagInput(e.target.value)}
                      onKeyDown={handleAddTag}
                      placeholder="e.g., algorithms, javascript, beginner" />
                    <div className="df-draft-tags">
                      {draftTags.map(tag => (
                        <span key={tag} className="df-tag-edit">
                          #{tag}
                          <button onClick={() => setDraftTags(prev => prev.filter(t => t !== tag))}>×</button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Guidelines + Preview */}
                <div className="df-create-aside">
                  <div className="df-guide-panel">
                    <div className="df-section-title">POSTING GUIDELINES</div>
                    <div className="df-guide-list">
                      <div className="df-guide-item"><span className="df-guide-num">01</span><span>Use a clear, specific title that describes your question or topic.</span></div>
                      <div className="df-guide-item"><span className="df-guide-num">02</span><span>Include code snippets when relevant. Paste complete, runnable examples where possible.</span></div>
                      <div className="df-guide-item"><span className="df-guide-num">03</span><span>Add relevant tags to help others find your discussion.</span></div>
                      <div className="df-guide-item"><span className="df-guide-num">04</span><span>Search before posting to avoid duplicates.</span></div>
                      <div className="df-guide-item"><span className="df-guide-num">05</span><span>Be respectful and constructive in all interactions.</span></div>
                      <div className="df-guide-item"><span className="df-guide-num">06</span><span>Mark solutions when your question is answered.</span></div>
                    </div>
                  </div>

                  <div className="df-preview-panel">
                    <div className="df-section-title">PREVIEW</div>
                    <div className="df-preview-title">{draftTopic || '(no title)'}</div>
                    <div className="df-preview-content">{draftContent.substring(0, 120).replace(/\n/g, ' ')}{draftContent.length > 120 ? '...' : ''}</div>
                    <div className="df-preview-meta">
                      <span>{draftCategory}</span>
                      <span>{draftTags.length} tags</span>
                      {showCodeInCreate && draftCode && <span>CODE ATTACHED</span>}
                    </div>
                  </div>

                  <button className="df-submit-disc-btn"
                    onClick={handleCreate}
                    disabled={!draftTopic.trim() || !draftContent.trim() || isSubmitting}>
                    {isSubmitting ? 'POSTING...' : 'POST DISCUSSION'}
                  </button>
                  <button className="df-cancel-disc-btn" onClick={() => setView('list')}>CANCEL</button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── REPORT MODAL ── */}
      {showReport && (
        <div className="df-modal-overlay" onClick={() => setShowReport(false)}>
          <div className="df-modal-box" onClick={e => e.stopPropagation()}>
            <div className="df-modal-title">REPORT CONTENT</div>
            <div className="df-modal-sub">Target: {reportTarget}</div>
            <div className="df-report-options">
              {['Spam', 'Harassment', 'Inappropriate Content', 'Off Topic', 'Other'].map(r => (
                <label key={r} className="df-report-opt">
                  <input type="radio" name="report" value={r.toLowerCase()} />
                  <span>{r.toUpperCase()}</span>
                </label>
              ))}
            </div>
            <textarea className="df-modal-textarea" rows={3} placeholder="Additional details..." />
            <div className="df-modal-acts">
              <button className="df-modal-cancel" onClick={() => setShowReport(false)}>CANCEL</button>
              <button className="df-modal-submit" onClick={() => { addLog(`REPORT filed`); setShowReport(false) }}>SUBMIT REPORT</button>
            </div>
            <button className="df-modal-close" onClick={() => setShowReport(false)}>×</button>
          </div>
        </div>
      )}

      {/* ── SHARE MODAL ── */}
      {showShare && selectedDiscussion && (
        <div className="df-modal-overlay" onClick={() => setShowShare(false)}>
          <div className="df-modal-box" onClick={e => e.stopPropagation()}>
            <div className="df-modal-title">SHARE DISCUSSION</div>
            <div className="df-share-link">
              <input className="df-modal-input" readOnly value={`${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'}/discussion/${selectedDiscussion.id}`} />
              <button className="df-modal-submit" onClick={() => {
                typeof navigator !== 'undefined' && navigator.clipboard?.writeText(`http://localhost:5173/discussion/${selectedDiscussion.id}`)
                addLog(`LINK copied for "${selectedDiscussion.topic.substring(0, 24)}"`)
                setShowShare(false)
              }}>COPY LINK</button>
            </div>
            <div className="df-share-meta">
              <div className="df-sm-row"><span>TOPIC</span><span>{selectedDiscussion.topic.substring(0, 40)}</span></div>
              <div className="df-sm-row"><span>AUTHOR</span><span>{selectedDiscussion.creatorName}</span></div>
              <div className="df-sm-row"><span>REPLIES</span><span>{totalReplies(selectedDiscussion.replies)}</span></div>
            </div>
            <button className="df-modal-close" onClick={() => setShowShare(false)}>×</button>
          </div>
        </div>
      )}

      {/* Scan line */}
      <div className="df-scan-line" />

      {/* ══════════════════ STYLES ══════════════════ */}
      <style>{`
        * { margin:0; padding:0; box-sizing:border-box; }

        .dfroot {
          min-height:calc(100vh - 56px);
          background:#030303; color:#ffffff;
          font-family:'SF Mono','Monaco','Fira Code',monospace;
          font-size:11px; display:flex; flex-direction:column;
          gap:1px; position:relative; overflow-x:hidden; overflow-y:auto;
        }
        .dfroot::-webkit-scrollbar{width:4px}
        .dfroot::-webkit-scrollbar-track{background:#111}
        .dfroot::-webkit-scrollbar-thumb{background:#222}
        .dfroot::-webkit-scrollbar-thumb:hover{background:#1e3a5f}
        *{scrollbar-width:thin;scrollbar-color:#222 #111}

        /* ── PAGE HEADER ── */
        .df-page-header{background:#0a0a0a;border:1px solid #1e3a5f;padding:12px 20px;display:flex;justify-content:space-between;align-items:center;position:relative;overflow:hidden;flex-shrink:0}
        .df-page-header::before{content:'';position:absolute;top:0;left:-100%;width:100%;height:2px;background:linear-gradient(90deg,transparent,#1e3a5f,transparent);animation:dfscan 3s linear infinite}
        @keyframes dfscan{0%{left:-100%}100%{left:100%}}
        .df-page-title{display:flex;flex-direction:column;gap:3px}
        .df-title-text{color:#1e3a5f;font-size:18px;font-weight:700;letter-spacing:3px;text-shadow:0 0 8px #1e3a5f}
        .df-title-sub{font-size:8px;opacity:0.35;letter-spacing:2px}
        .df-page-meta{display:flex;align-items:center;gap:14px;background:#050505;padding:6px 12px;border:1px solid #1e3a5f}
        .df-version{color:#1e3a5f;font-size:9px}
        .df-time{font-size:10px}
        .df-log-box{border-left:1px solid #1e3a5f;padding-left:12px}
        .df-log-line{font-size:9px;opacity:0.7;animation:dffade 0.3s ease}
        @keyframes dffade{from{opacity:0;transform:translateX(8px)}to{opacity:1;transform:translateX(0)}}

        /* ── STATS ── */
        .df-stats-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:1px;background:#1e3a5f;border:1px solid #1e3a5f;flex-shrink:0}
        .df-stat-card{background:#0a0a0a;padding:12px 14px;display:flex;flex-direction:column;gap:6px;transition:transform 0.2s,box-shadow 0.2s}
        .df-stat-card:hover{transform:translateY(-2px);box-shadow:0 4px 18px rgba(30,58,95,0.3)}
        .dfsc-head{display:flex;justify-content:space-between;align-items:center;padding-bottom:5px;border-bottom:1px solid #1e3a5f}
        .dfsc-head span:first-child{font-size:9px;opacity:0.6;letter-spacing:0.5px}
        .dfsc-val{font-size:14px;font-weight:700}
        .dfsc-bar{height:2px;background:#1a1a1a;overflow:hidden}
        .dfsc-fill{height:100%;background:#1e3a5f;transition:width 0.5s}

        /* ── MAIN ── */
        .df-main{display:flex;flex:1;gap:1px;background:#1e3a5f;border:1px solid #1e3a5f;min-height:0}

        /* ── SIDEBAR ── */
        .df-sidebar{width:240px;min-width:240px;background:#0a0a0a;display:flex;flex-direction:column;overflow-y:auto}
        .df-sidebar::-webkit-scrollbar{width:4px}
        .df-sidebar::-webkit-scrollbar-track{background:#111}
        .df-sidebar::-webkit-scrollbar-thumb{background:#222}
        .df-sidebar::-webkit-scrollbar-thumb:hover{background:#1e3a5f}
        .df-sb-section{padding:12px 14px;border-bottom:1px solid #1e3a5f;flex-shrink:0}
        .df-sb-flex{flex:1}
        .df-sb-title{font-size:7px;letter-spacing:1.5px;opacity:0.35;margin-bottom:8px}
        .df-sb-btn{width:100%;background:none;border:none;color:#fff;font-family:inherit;font-size:10px;padding:7px 0;text-align:left;cursor:pointer;opacity:0.5;display:flex;align-items:center;gap:7px;transition:opacity 0.15s;border-bottom:1px dotted #111}
        .df-sb-btn:hover{opacity:0.85}
        .df-sb-btn.df-sb-active{opacity:1}
        .df-sb-arrow{color:#1e3a5f;font-size:10px;width:10px}
        .df-cat-btn{width:100%;background:none;border:none;color:#fff;font-family:inherit;font-size:9px;padding:5px 0;text-align:left;cursor:pointer;opacity:0.5;display:flex;justify-content:space-between;align-items:center;border-bottom:1px dotted #111;transition:opacity 0.15s}
        .df-cat-btn:hover{opacity:0.85}
        .df-cat-btn.df-cat-active{opacity:1;color:#6ab4ff}
        .df-cat-cnt{font-size:8px;opacity:0.4;background:#111;padding:1px 5px;border-radius:2px}
        .df-tags-cloud{display:flex;flex-wrap:wrap;gap:4px}
        .df-tag-chip{background:none;border:1px solid #111;color:#fff;font-family:inherit;font-size:7px;padding:2px 6px;cursor:pointer;opacity:0.5;transition:all 0.15s;border-radius:1px}
        .df-tag-chip:hover{opacity:0.85;border-color:#1e3a5f}
        .df-tag-chip.df-tag-active{opacity:1;border-color:#1e3a5f;background:rgba(30,58,95,0.2)}
        .df-sb-logs{display:flex;flex-direction:column;gap:2px;max-height:140px;overflow-y:auto}
        .df-sb-log{font-size:8px;opacity:0.5;padding:2px 0;border-bottom:1px dotted #0d0d0d;font-family:monospace}
        .df-sb-log-empty{font-size:8px;opacity:0.2;font-style:italic}

        /* ── CONTENT ── */
        .df-content{flex:1;background:#0a0a0a;overflow-y:auto;padding:20px;min-width:0}
        .df-content::-webkit-scrollbar{width:4px}
        .df-content::-webkit-scrollbar-track{background:#111}
        .df-content::-webkit-scrollbar-thumb{background:#222}
        .df-content::-webkit-scrollbar-thumb:hover{background:#1e3a5f}
        .df-view-title{font-size:13px;font-weight:700;letter-spacing:2px;margin-bottom:16px;border-left:3px solid #1e3a5f;padding-left:10px}
        .df-section-title{font-size:8px;letter-spacing:1.5px;opacity:0.35;margin-bottom:8px}

        /* ── TOOLBAR ── */
        .df-toolbar{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap}
        .df-toolbar-right{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
        .df-search{background:#0e0e0e;border:1px solid #1e3a5f;color:#fff;padding:6px 12px;font-size:10px;font-family:inherit;outline:none;width:240px;transition:border-color 0.2s}
        .df-search:focus{border-color:rgba(255,255,255,0.3)}
        .df-search::placeholder{opacity:0.28}
        .df-filters{display:flex;gap:3px}
        .df-fbtn{background:none;border:1px solid #141414;color:#fff;opacity:0.4;font-size:7px;padding:3px 8px;cursor:pointer;font-family:inherit;letter-spacing:0.5px;transition:all 0.15s}
        .df-fbtn:hover{opacity:0.75}
        .df-fbtn.df-factive{opacity:1;border-color:#1e3a5f;background:rgba(30,58,95,0.18)}
        .df-new-btn{background:#1e3a5f;border:none;color:#fff;padding:5px 14px;font-size:9px;cursor:pointer;font-family:inherit;letter-spacing:1px;transition:background 0.2s}
        .df-new-btn:hover{background:#2a4a7a}

        /* ── TABLE ── */
        .df-table-header{display:grid;grid-template-columns:3fr 90px 110px 120px 70px 60px 60px 90px;padding:6px 10px;background:#070707;border:1px solid #1e3a5f;border-bottom:none;font-size:7px;letter-spacing:1px;opacity:0.45}
        .df-table-body{border:1px solid #1e3a5f}
        .df-table-row{display:grid;grid-template-columns:3fr 90px 110px 120px 70px 60px 60px 90px;padding:10px;border-bottom:1px solid #0d0d0d;align-items:center;font-size:9px;cursor:pointer;transition:background 0.15s}
        .df-table-row:hover{background:#0e0e0e}
        .df-table-row:last-child{border-bottom:none}
        .df-row-pinned{border-left:3px solid #1e3a5f}
        .df-row-solved{border-right:3px solid rgba(109,186,114,0.5)}
        .df-empty{padding:30px;text-align:center;opacity:0.25;font-size:10px}
        .df-row-topic{display:flex;flex-direction:column;gap:3px;min-width:0}
        .df-row-badges{display:flex;gap:4px;margin-bottom:2px}
        .df-badge-pin{font-size:6px;padding:1px 5px;background:rgba(30,58,95,0.4);border:1px solid #1e3a5f;color:#6ab4ff;letter-spacing:0.5px}
        .df-badge-sol{font-size:6px;padding:1px 5px;background:rgba(74,144,80,0.3);border:1px solid rgba(109,186,114,0.4);color:#6dba72;letter-spacing:0.5px}
        .df-badge-lock{font-size:6px;padding:1px 5px;background:rgba(180,60,60,0.2);border:1px solid rgba(200,96,96,0.3);color:#c86060;letter-spacing:0.5px}
        .df-badge-cat{font-size:6px;padding:1px 5px;background:#0d0d0d;border:1px solid #111;opacity:0.6;letter-spacing:0.5px}
        .df-row-name{font-size:10px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .df-row-excerpt{font-size:7px;opacity:0.4;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .df-row-cat{font-size:8px;opacity:0.55}
        .df-row-author{display:flex;flex-direction:column;gap:3px}
        .df-row-tags{display:flex;gap:3px;flex-wrap:wrap}
        .df-tag{font-size:7px;padding:1px 5px;background:#111;border:1px solid #1a1a1a;opacity:0.7;white-space:nowrap}
        .df-tag-more{font-size:7px;opacity:0.35}
        .df-row-status{}
        .df-status{font-size:7px;padding:2px 5px;letter-spacing:0.5px}
        .df-status-solved{background:rgba(74,144,80,0.2);color:#6dba72}
        .df-status-locked{background:rgba(180,60,60,0.2);color:#c86060}
        .df-status-open{background:rgba(30,58,95,0.3);color:#6ab4ff}
        .df-row-views,.df-row-replies{font-size:9px;font-family:monospace}
        .df-row-time{font-size:8px;opacity:0.45;font-family:monospace}
        .df-table-footer{display:flex;justify-content:space-between;align-items:center;padding:8px 10px;background:#070707;border:1px solid #1e3a5f;border-top:none;font-size:7px;opacity:0.45;letter-spacing:0.5px}
        .df-pagination{display:flex;gap:3px;align-items:center}
        .df-page-btn{background:none;border:1px solid #1a1a1a;color:#fff;font-size:9px;width:24px;height:24px;cursor:pointer;font-family:inherit;transition:all 0.15s;display:flex;align-items:center;justify-content:center}
        .df-page-btn:hover:not(:disabled){border-color:#1e3a5f;background:rgba(30,58,95,0.18)}
        .df-page-btn.df-page-active{background:#1e3a5f;border-color:#1e3a5f}
        .df-page-btn:disabled{opacity:0.3;cursor:not-allowed}
        .df-page-ellipsis{font-size:9px;opacity:0.35;padding:0 2px}

        /* ── ROLE BADGES ── */
        .df-rbadge{font-size:6px;padding:1px 5px;border-radius:1px;font-weight:700;letter-spacing:0.5px;flex-shrink:0}
        .role-teacher{background:rgba(30,58,95,0.5);color:#6ab4ff;border:1px solid rgba(30,58,95,0.5)}
        .role-admin{background:rgba(180,60,60,0.3);color:#c86060;border:1px solid rgba(200,96,96,0.2)}
        .role-student{background:rgba(80,80,80,0.3);color:#aaa;border:1px solid #333}
        .df-user-badge{font-size:6px;padding:1px 5px;background:#111;border:1px solid #1a1a1a;opacity:0.6;letter-spacing:0.3px}

        /* ── DETAIL VIEW ── */
        .df-detail-view{display:flex;flex-direction:column;gap:14px}
        .df-detail-nav{display:flex;justify-content:space-between;align-items:center}
        .df-back-btn{background:none;border:1px solid #1a1a1a;color:#fff;padding:5px 12px;font-size:8px;cursor:pointer;font-family:inherit;letter-spacing:0.5px;transition:border-color 0.2s}
        .df-back-btn:hover{border-color:#1e3a5f}
        .df-nav-acts{display:flex;gap:6px}
        .df-nav-btn{background:none;border:1px solid #1a1a1a;color:#fff;padding:5px 12px;font-size:8px;cursor:pointer;font-family:inherit;letter-spacing:0.5px;transition:all 0.15s}
        .df-nav-btn:hover{border-color:#1e3a5f;background:rgba(30,58,95,0.1)}
        .df-disc-header{background:#090909;border:1px solid #1e3a5f;padding:16px}
        .df-disc-badges{display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap}
        .df-disc-title{font-size:16px;font-weight:700;line-height:1.4;margin-bottom:10px}
        .df-disc-meta{display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px}
        .df-disc-author{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
        .df-disc-aname{font-size:10px;font-weight:600}
        .df-disc-stats{display:flex;gap:14px;font-size:8px;opacity:0.45;flex-wrap:wrap}
        .df-disc-tags{display:flex;gap:5px;flex-wrap:wrap;margin-top:8px}
        .df-disc-content{background:#090909;border:1px solid #1e3a5f;padding:16px;display:flex;flex-direction:column;gap:12px}
        .df-content-body{line-height:1.7;font-size:10px}
        .df-line{padding:2px 0}
        .df-list-item{padding:2px 0 2px 12px;opacity:0.85}
        .df-disc-code,.df-reply-code{background:#070707;border:1px solid #111;overflow-x:auto}
        .df-code-header{font-size:7px;opacity:0.4;letter-spacing:1px;padding:5px 10px;border-bottom:1px solid #111;background:#060606}
        .df-disc-code pre,.df-reply-code pre{padding:12px;font-size:9px;line-height:1.6;font-family:'SF Mono','Monaco','Fira Code',monospace}
        .df-disc-actions{display:flex;gap:8px;margin-top:4px}
        .df-act-btn{background:none;border:1px solid #1a1a1a;color:#fff;padding:5px 12px;font-size:8px;cursor:pointer;font-family:inherit;letter-spacing:0.5px;transition:all 0.15s}
        .df-act-btn:hover{border-color:#1e3a5f;background:rgba(30,58,95,0.1)}
        .df-act-liked{color:#6ab4ff;border-color:#1e3a5f}
        .df-act-up{background:rgba(30,58,95,0.2);border-color:#1e3a5f}
        .df-act-sol{color:#6dba72;border-color:rgba(109,186,114,0.3)}
        .df-act-sol:hover{background:rgba(74,144,80,0.1)}
        .df-contributors{background:#090909;border:1px solid #1e3a5f;padding:12px}
        .df-contrib-list{display:flex;gap:6px;flex-wrap:wrap}
        .df-contrib-chip{background:#0e0e0e;border:1px solid #111;padding:3px 10px;font-size:8px}
        .df-contrib-name{opacity:0.7}

        /* ── REPLIES ── */
        .df-replies-section{display:flex;flex-direction:column;gap:10px}
        .df-replies-header{display:flex;justify-content:space-between;align-items:center}
        .df-sort-sel{background:#0e0e0e;border:1px solid #1a1a1a;color:#fff;padding:3px 8px;font-size:8px;font-family:inherit;outline:none;cursor:pointer}
        .df-reply-thread{margin-bottom:8px}
        .depth-1{margin-left:24px}
        .depth-2{margin-left:48px}
        .depth-3{margin-left:72px}
        .df-reply-item{display:flex;gap:10px;padding:12px;background:#090909;border:1px solid #111;border-radius:1px;transition:border-color 0.15s}
        .df-reply-item:hover{border-color:#1e3a5f}
        .df-reply-solution{border-left:3px solid rgba(109,186,114,0.5);background:rgba(74,144,80,0.04)}
        .df-reply-pinned{border-left:3px solid #1e3a5f;background:rgba(30,58,95,0.04)}
        .df-reply-votes{display:flex;flex-direction:column;align-items:center;gap:3px;flex-shrink:0;width:36px}
        .df-vote-btn{background:none;border:none;color:#555;cursor:pointer;font-size:11px;padding:1px;transition:color 0.15s}
        .df-vote-btn:hover{color:#6ab4ff}
        .df-vote-cnt{font-size:11px;font-weight:700;font-family:monospace}
        .df-sol-badge{font-size:6px;color:#6dba72;border:1px solid rgba(109,186,114,0.3);padding:1px 3px;text-align:center}
        .df-pin-badge{font-size:6px;color:#6ab4ff;border:1px solid rgba(106,180,255,0.3);padding:1px 3px;text-align:center}
        .df-reply-body{flex:1;display:flex;flex-direction:column;gap:8px;min-width:0}
        .df-reply-head{}
        .df-reply-user{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
        .df-rname{font-size:10px;font-weight:600}
        .df-rtime{font-size:7px;opacity:0.35;font-family:monospace}
        .df-edited{font-size:7px;opacity:0.35;font-style:italic}
        .df-reply-content{font-size:10px;line-height:1.65}
        .df-reply-acts{display:flex;gap:6px;flex-wrap:wrap;margin-top:4px}
        .df-nested{margin-top:6px}
        .df-add-reply{background:#090909;border:1px solid #1e3a5f;padding:14px;display:flex;flex-direction:column;gap:10px}
        .df-reply-indicator{display:flex;justify-content:space-between;align-items:center;background:rgba(30,58,95,0.2);border:1px solid #1e3a5f;padding:4px 10px;font-size:8px}
        .df-cancel-reply{background:none;border:none;color:#fff;font-size:14px;cursor:pointer;opacity:0.5;line-height:1}
        .df-cancel-reply:hover{opacity:1}
        .df-reply-textarea{background:#0e0e0e;border:1px solid #1a1a1a;color:#fff;padding:10px;font-size:10px;font-family:inherit;outline:none;transition:border-color 0.15s;resize:vertical;width:100%}
        .df-reply-textarea:focus{border-color:#1e3a5f}
        .df-reply-textarea::placeholder{opacity:0.25}
        .df-code-editor-wrap{display:flex;flex-direction:column}
        .df-code-textarea{background:#070707;border:1px solid #111;color:#fff;padding:10px;font-size:9px;font-family:'SF Mono','Monaco','Fira Code',monospace;outline:none;transition:border-color 0.15s;resize:vertical;width:100%;line-height:1.6}
        .df-code-textarea:focus{border-color:#1e3a5f}
        .df-code-textarea::placeholder{opacity:0.25}
        .df-reply-toolbar{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
        .df-toolbar-btn{background:none;border:1px solid #1a1a1a;color:#fff;padding:4px 10px;font-size:8px;cursor:pointer;font-family:inherit;letter-spacing:0.5px;transition:all 0.15s}
        .df-toolbar-btn:hover{border-color:#1e3a5f}
        .df-toolbar-active{background:rgba(30,58,95,0.2);border-color:#1e3a5f}
        .df-toolbar-right{margin-left:auto;display:flex;align-items:center;gap:8px}
        .df-char-cnt{font-size:8px;opacity:0.3}
        .df-submit-btn{background:#1e3a5f;border:none;color:#fff;padding:7px 20px;font-size:9px;cursor:pointer;font-family:inherit;letter-spacing:1px;transition:background 0.2s}
        .df-submit-btn:hover:not(:disabled){background:#2a4a7a}
        .df-submit-btn:disabled{opacity:0.3;cursor:not-allowed}
        .df-locked-msg{text-align:center;padding:12px;font-size:8px;opacity:0.4;letter-spacing:1px;border:1px solid #111;background:#070707}

        /* ── CREATE VIEW ── */
        .df-create-view{display:flex;flex-direction:column;gap:14px}
        .df-create-layout{display:grid;grid-template-columns:1fr 300px;gap:14px}
        .df-create-form{background:#090909;border:1px solid #1e3a5f;padding:16px;display:flex;flex-direction:column;gap:10px}
        .df-create-aside{display:flex;flex-direction:column;gap:10px}
        .df-field{display:flex;flex-direction:column;gap:4px}
        .df-field label{font-size:7px;opacity:0.45;letter-spacing:1px;display:flex;justify-content:space-between;align-items:center}
        .df-toggle-code-btn{background:none;border:1px solid #1a1a1a;color:#fff;font-size:7px;padding:1px 6px;cursor:pointer;font-family:inherit;opacity:0.5;transition:all 0.15s}
        .df-toggle-code-btn:hover{border-color:#1e3a5f;opacity:1}
        .df-input{background:#0e0e0e;border:1px solid #1a1a1a;color:#fff;padding:7px 10px;font-size:10px;font-family:inherit;outline:none;transition:border-color 0.15s;width:100%}
        .df-input:focus{border-color:#1e3a5f}
        .df-input::placeholder{opacity:0.25}
        select.df-input{cursor:pointer}
        .df-textarea{resize:vertical;min-height:60px;line-height:1.6}
        .df-code-input{font-family:'SF Mono','Monaco','Fira Code',monospace;font-size:9px}
        .df-draft-tags{display:flex;flex-wrap:wrap;gap:4px;margin-top:6px}
        .df-tag-edit{font-size:8px;padding:2px 8px;background:#0e0e0e;border:1px solid #1e3a5f;display:flex;align-items:center;gap:4px}
        .df-tag-edit button{background:none;border:none;color:#555;cursor:pointer;font-size:11px;line-height:1}
        .df-tag-edit button:hover{color:#fff}
        .df-guide-panel,.df-preview-panel{background:#090909;border:1px solid #1e3a5f;padding:12px}
        .df-guide-list{display:flex;flex-direction:column;gap:6px}
        .df-guide-item{display:flex;gap:8px;font-size:8px;opacity:0.65;line-height:1.4}
        .df-guide-num{font-size:7px;color:#1e3a5f;font-weight:700;flex-shrink:0;opacity:1}
        .df-preview-title{font-size:10px;font-weight:600;margin-bottom:6px}
        .df-preview-content{font-size:8px;opacity:0.5;line-height:1.5;margin-bottom:8px}
        .df-preview-meta{display:flex;gap:8px;font-size:7px;opacity:0.35}
        .df-submit-disc-btn{width:100%;background:#1e3a5f;border:none;color:#fff;padding:10px;font-size:10px;cursor:pointer;font-family:inherit;letter-spacing:1px;transition:background 0.2s}
        .df-submit-disc-btn:hover:not(:disabled){background:#2a4a7a}
        .df-submit-disc-btn:disabled{opacity:0.35;cursor:not-allowed}
        .df-cancel-disc-btn{width:100%;background:none;border:1px solid #1a1a1a;color:#fff;padding:8px;font-size:9px;cursor:pointer;font-family:inherit;letter-spacing:1px;transition:all 0.15s}
        .df-cancel-disc-btn:hover{border-color:#1e3a5f}

        /* ── MODALS ── */
        .df-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.92);display:flex;align-items:center;justify-content:center;z-index:2000}
        .df-modal-box{background:#0a0a0a;border:1px solid #1e3a5f;padding:20px;width:420px;max-width:94vw;max-height:80vh;overflow-y:auto;position:relative;display:flex;flex-direction:column;gap:10px}
        .df-modal-box::-webkit-scrollbar{width:4px}
        .df-modal-box::-webkit-scrollbar-track{background:#111}
        .df-modal-box::-webkit-scrollbar-thumb{background:#222}
        .df-modal-title{font-size:12px;letter-spacing:2px;font-weight:700}
        .df-modal-sub{font-size:8px;opacity:0.35;font-family:monospace}
        .df-report-options{display:flex;flex-direction:column;gap:6px}
        .df-report-opt{display:flex;align-items:center;gap:8px;cursor:pointer;font-size:9px;opacity:0.7;padding:4px 0}
        .df-report-opt:hover{opacity:1}
        .df-modal-textarea{background:#0e0e0e;border:1px solid #1a1a1a;color:#fff;padding:8px 10px;font-size:9px;font-family:inherit;outline:none;resize:vertical;width:100%}
        .df-modal-textarea:focus{border-color:#1e3a5f}
        .df-modal-input{background:#0e0e0e;border:1px solid #1e3a5f;color:#fff;padding:8px 12px;font-size:9px;font-family:monospace;outline:none;width:100%}
        .df-modal-acts{display:flex;gap:8px;justify-content:flex-end;margin-top:4px}
        .df-modal-cancel{background:none;border:1px solid #1a1a1a;color:#fff;padding:7px 16px;font-size:9px;cursor:pointer;font-family:inherit;letter-spacing:0.5px;transition:all 0.15s}
        .df-modal-cancel:hover{border-color:#1e3a5f}
        .df-modal-submit{background:#1e3a5f;border:none;color:#fff;padding:7px 16px;font-size:9px;cursor:pointer;font-family:inherit;letter-spacing:0.5px;transition:background 0.2s}
        .df-modal-submit:hover{background:#2a4a7a}
        .df-modal-close{position:absolute;top:10px;right:14px;background:none;border:none;color:#fff;font-size:18px;cursor:pointer;opacity:0.35;line-height:1}
        .df-modal-close:hover{opacity:1}
        .df-share-link{display:flex;gap:8px}
        .df-share-meta{display:flex;flex-direction:column;gap:4px}
        .df-sm-row{display:flex;justify-content:space-between;font-size:8px;padding:3px 0;border-bottom:1px dotted #111}
        .df-sm-row span:first-child{opacity:0.4}

        /* Scan line */
        .df-scan-line{position:fixed;top:0;left:0;right:0;height:100%;background:linear-gradient(to bottom,transparent 0%,rgba(30,58,95,0.02) 50%,transparent 100%);pointer-events:none;animation:dfscanline 8s linear infinite;z-index:999}
        @keyframes dfscanline{0%{transform:translateY(-100%)}100%{transform:translateY(100%)}}

        /* Responsive */
        @media(max-width:1200px){.df-stats-grid{grid-template-columns:repeat(3,1fr)}.df-table-header,.df-table-row{grid-template-columns:2fr 80px 100px 100px 60px 55px 55px 80px}}
        @media(max-width:1000px){.df-main{flex-direction:column}.df-sidebar{width:100%}.df-create-layout{grid-template-columns:1fr}}
        @media(max-width:768px){.df-stats-grid{grid-template-columns:repeat(2,1fr)}.depth-1{margin-left:12px}.depth-2{margin-left:24px}.depth-3{margin-left:36px}.df-table-header,.df-table-row{grid-template-columns:2fr 80px 90px 50px 55px}.df-row-tags,.df-row-views{display:none}}
      `}</style>
    </div>
  )
}
