import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

// ==================== TYPES ====================

interface Message {
  id: string
  sender: string
  role: 'teacher' | 'student' | 'admin' | 'system'
  content: string
  timestamp: Date
  isOwn: boolean
  system?: boolean
  encrypted?: boolean
  delivered?: boolean
  read?: boolean
  reactions?: Record<string, number>
  fileAttachment?: { name: string; size: string; type: string }
}

interface Session {
  code: string
  name: string
  participants: number
  encrypted: boolean
  created: Date
  description?: string
  activeUsers: string[]
  messageCount: number
  lastActivity: Date
}

interface Participant {
  id: string
  name: string
  role: 'teacher' | 'student' | 'admin'
  status: 'online' | 'away' | 'offline'
  joinedAt: Date
  device: string
  ipAddress: string
  messagesSent: number
}

interface NetworkNode {
  id: string
  name: string
  latency: number
  status: 'connected' | 'connecting' | 'lost'
}

// ==================== COMPONENT ====================

export default function Chat() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const sessionCode = searchParams.get('code')

  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [nearbySessions, setNearbySessions] = useState<Session[]>([])
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [showParticipants, setShowParticipants] = useState(false)
  const [showNetworkPanel, setShowNetworkPanel] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [joinPassword, setJoinPassword] = useState('')
  const [currentSession, setCurrentSession] = useState<Session | null>(null)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [networkNodes, setNetworkNodes] = useState<NetworkNode[]>([])
  const [time, setTime] = useState(new Date())
  const [sessionLogs, setSessionLogs] = useState<string[]>([])
  const [encryptionStatus, setEncryptionStatus] = useState<'idle' | 'encrypting' | 'active'>('idle')
  const [selectedTab, setSelectedTab] = useState<'messages' | 'logs' | 'network'>('messages')
  const [filter, setFilter] = useState<'all' | 'teacher' | 'student'>('all')
  const [broadcastMode, setBroadcastMode] = useState(false)
  const [packetCount, setPacketCount] = useState(0)
  const [rxBytes, setRxBytes] = useState(0)
  const [txBytes, setTxBytes] = useState(0)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // ==================== EFFECTS ====================

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (sessionCode) {
      const sess: Session = {
        code: sessionCode,
        name: `Session ${sessionCode}`,
        participants: 3,
        encrypted: true,
        created: new Date(),
        description: 'Auto-joined via URL',
        activeUsers: ['You', 'Teacher Kumar', 'Student_42'],
        messageCount: 0,
        lastActivity: new Date()
      }
      setCurrentSession(sess)
      initSession(sess)
    }
  }, [sessionCode])

  useEffect(() => {
    if (!currentSession) return
    const interval = setInterval(() => {
      setPacketCount(p => p + Math.floor(Math.random() * 12) + 1)
      setRxBytes(r => r + Math.floor(Math.random() * 2048))
      setTxBytes(t => t + Math.floor(Math.random() * 1024))
      setNetworkNodes(prev => prev.map(node => ({
        ...node,
        latency: Math.max(5, node.latency + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 8))
      })))
    }, 2000)
    return () => clearInterval(interval)
  }, [currentSession])

  useEffect(() => {
    if (!currentSession) return
    const interval = setInterval(() => {
      if (Math.random() > 0.65) {
        const senders = [
          { name: 'Teacher Kumar', role: 'teacher' as const },
          { name: 'Student_42', role: 'student' as const },
          { name: 'Student_88', role: 'student' as const },
        ]
        const sender = senders[Math.floor(Math.random() * senders.length)]
        const pool = [
          'Can everyone share their progress?',
          'Please refer to slide 12 of the notes.',
          'I have a doubt about recursion.',
          'How do we handle edge cases in this approach?',
          'The time complexity here is O(n log n).',
          'Can you share the code snippet?',
          'I submitted the assignment.',
          'When is the next assessment scheduled?',
          'Node 2 latency seems high today.',
          'Please check the updated problem statement.',
        ]
        const msg: Message = {
          id: `msg-${Date.now()}`,
          sender: sender.name,
          role: sender.role,
          content: pool[Math.floor(Math.random() * pool.length)],
          timestamp: new Date(),
          isOwn: false,
          encrypted: currentSession.encrypted,
          delivered: true,
          read: true,
        }
        setMessages(prev => [...prev, msg])
        setSessionLogs(prev => [`[${formatTime(new Date())}] MSG from ${sender.name}`, ...prev.slice(0, 49)])
        setParticipants(prev => prev.map(p =>
          p.name === sender.name ? { ...p, messagesSent: p.messagesSent + 1, status: 'online' } : p
        ))
        setTypingUsers([sender.name])
        setTimeout(() => setTypingUsers([]), 1500)
      }
    }, 6000)
    return () => clearInterval(interval)
  }, [currentSession])

  // ==================== UTILITIES ====================

  const formatTime = (date: Date) =>
    date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })

  const formatTimeShort = (date: Date) =>
    date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  }

  const initSession = (sess: Session) => {
    setParticipants([
      { id: 'p1', name: 'You', role: 'student', status: 'online', joinedAt: new Date(), device: 'localhost', ipAddress: '192.168.1.100', messagesSent: 0 },
      { id: 'p2', name: 'Teacher Kumar', role: 'teacher', status: 'online', joinedAt: new Date(Date.now() - 300000), device: 'Teacher-Desktop', ipAddress: '192.168.1.101', messagesSent: 12 },
      { id: 'p3', name: 'Student_42', role: 'student', status: 'online', joinedAt: new Date(Date.now() - 120000), device: 'Lab-PC-3', ipAddress: '192.168.1.112', messagesSent: 5 },
      { id: 'p4', name: 'Student_88', role: 'student', status: 'away', joinedAt: new Date(Date.now() - 60000), device: 'Student-Laptop', ipAddress: '192.168.1.118', messagesSent: 2 },
    ])
    setNetworkNodes([
      { id: 'n1', name: 'Gateway Node', latency: 12, status: 'connected' },
      { id: 'n2', name: 'Validator 1', latency: 28, status: 'connected' },
      { id: 'n3', name: 'Validator 2', latency: 45, status: 'connected' },
      { id: 'n4', name: 'Relay Node', latency: 67, status: 'connecting' },
    ])
    setMessages([
      { id: 'sys-1', sender: 'System', role: 'system', content: `SESSION ${sess.code} INITIALIZED • END-TO-END ENCRYPTION ACTIVE`, timestamp: new Date(), isOwn: false, system: true },
      { id: 'sys-2', sender: 'System', role: 'system', content: `AES-256-GCM KEY EXCHANGE COMPLETE • BLOCKCHAIN HASH RECORDED`, timestamp: new Date(), isOwn: false, system: true },
      { id: 'sys-3', sender: 'Teacher Kumar', role: 'teacher', content: `Welcome everyone. Today we will be covering advanced data structures. Please make sure your assignments are submitted.`, timestamp: new Date(Date.now() - 60000), isOwn: false, encrypted: true, delivered: true, read: true },
    ])
    setEncryptionStatus('active')
    setSessionLogs([
      `[${formatTime(new Date())}] Session initialized`,
      `[${formatTime(new Date())}] Encryption handshake OK`,
      `[${formatTime(new Date())}] 4 participants joined`,
    ])
  }

  // ==================== ACTIONS ====================

  const addLog = (msg: string) => setSessionLogs(prev => [`[${formatTime(new Date())}] ${msg}`, ...prev.slice(0, 49)])

  const scanForSessions = () => {
    setIsScanning(true)
    addLog('Scanning LAN for active sessions...')
    setTimeout(() => {
      setNearbySessions([
        { code: 'DS1234', name: 'Data Structures Lab', participants: 4, encrypted: false, created: new Date(), description: 'Lecture session — Stack & Queue', activeUsers: [], messageCount: 48, lastActivity: new Date(Date.now() - 30000) },
        { code: 'ALGO55', name: 'Algorithms — Group B', participants: 3, encrypted: true, created: new Date(), description: 'Private — DP Problems', activeUsers: [], messageCount: 120, lastActivity: new Date(Date.now() - 90000) },
        { code: 'JS2024', name: 'Web Dev Workshop', participants: 6, encrypted: false, created: new Date(), description: 'React + TypeScript intro', activeUsers: [], messageCount: 234, lastActivity: new Date(Date.now() - 10000) },
        { code: 'CODE99', name: 'Coding Buddies', participants: 2, encrypted: true, created: new Date(), description: 'Private — LeetCode session', activeUsers: [], messageCount: 67, lastActivity: new Date(Date.now() - 180000) },
        { code: 'STAFF1', name: 'Department Staff', participants: 5, encrypted: true, created: new Date(), description: 'Faculty coordination', activeUsers: [], messageCount: 89, lastActivity: new Date(Date.now() - 5000) },
      ])
      setIsScanning(false)
      setShowJoinModal(true)
      addLog('Found 5 active sessions on LAN')
    }, 2500)
  }

  const createSession = (encrypted: boolean) => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    const sess: Session = {
      code, name: `Session ${code}`, participants: 1, encrypted,
      created: new Date(),
      description: encrypted ? 'Private encrypted session' : 'Open public session',
      activeUsers: ['You'], messageCount: 0, lastActivity: new Date()
    }
    setCurrentSession(sess)
    initSession(sess)
    navigate(`/chat?code=${code}`)
    addLog(`Created ${encrypted ? 'private encrypted' : 'public'} session ${code}`)
  }

  const joinSession = (code: string, password?: string) => {
    const sess = nearbySessions.find(s => s.code === code) || {
      code, name: `Session ${code}`, participants: 1, encrypted: !!password,
      created: new Date(), activeUsers: ['You'], messageCount: 0, lastActivity: new Date()
    }
    if (sess.encrypted && !password) { alert('This session requires a password'); return }
    setCurrentSession(sess)
    initSession(sess)
    setShowJoinModal(false)
    setJoinCode('')
    setJoinPassword('')
    navigate(`/chat?code=${code}`)
    addLog(`Joined session ${code}`)
  }

  const leaveSession = () => {
    addLog(`Left session ${currentSession?.code}`)
    setCurrentSession(null)
    setMessages([])
    setParticipants([])
    setNetworkNodes([])
    setEncryptionStatus('idle')
    setBroadcastMode(false)
    setSelectedTab('messages')
    navigate('/chat')
  }

  const sendMessage = () => {
    if (!newMessage.trim() || !currentSession) return
    const msg: Message = {
      id: `msg-${Date.now()}`,
      sender: 'You', role: 'student',
      content: newMessage,
      timestamp: new Date(),
      isOwn: true,
      encrypted: currentSession.encrypted,
      delivered: false, read: false,
    }
    setMessages(prev => [...prev, msg])
    setNewMessage('')
    addLog(`MSG sent • ${msg.content.length} chars`)
    setTxBytes(t => t + msg.content.length * 2)
    setPacketCount(p => p + 1)
    setTimeout(() => setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, delivered: true } : m)), 400)
    setTimeout(() => setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, read: true } : m)), 1200)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const filteredMessages = messages.filter(m => {
    if (filter === 'teacher') return m.role === 'teacher' || m.system
    if (filter === 'student') return m.role === 'student' || m.system
    return true
  })

  // ==================== RENDER ====================

  return (
    <div className="chat-root">

      {/* ── SIDEBAR ── */}
      <aside className="chat-sidebar">

        <div className="sb-header">
          <span className="sb-title">CHAT SESSIONS</span>
          <div className="sb-header-right">
            <span className="sb-time">{formatTimeShort(time)}</span>
            {!currentSession && (
              <button className="btn-scan" onClick={scanForSessions} disabled={isScanning}>
                {isScanning ? '◌ SCAN' : 'SCAN'}
              </button>
            )}
          </div>
        </div>

        {currentSession ? (
          <div className="session-panel">
            <div className="session-code-row">
              <span className="session-code">{currentSession.code}</span>
              <span className={`session-badge ${currentSession.encrypted ? 'priv' : 'pub'}`}>
                {currentSession.encrypted ? '⬡ PRIVATE' : '◎ PUBLIC'}
              </span>
            </div>
            <div className="session-desc">{currentSession.description}</div>
            <div className="session-stats">
              <div className="sstat"><span>PARTICIPANTS</span><span>{participants.length}</span></div>
              <div className="sstat"><span>MESSAGES</span><span>{messages.filter(m => !m.system).length}</span></div>
              <div className="sstat"><span>PACKETS</span><span>{packetCount}</span></div>
              <div className="sstat"><span>RX</span><span>{formatBytes(rxBytes)}</span></div>
              <div className="sstat"><span>TX</span><span>{formatBytes(txBytes)}</span></div>
              <div className="sstat"><span>ENCRYPT</span>
                <span className={`enc-val ${encryptionStatus}`}>
                  {encryptionStatus === 'active' ? '✓ AES-256' : 'OFF'}
                </span>
              </div>
            </div>
            <div className="session-actions">
              <button className="btn-panel" onClick={() => setShowParticipants(p => !p)}>
                USERS ({participants.length})
              </button>
              <button className="btn-panel" onClick={() => setShowNetworkPanel(p => !p)}>
                NODES
              </button>
            </div>

            {showParticipants && (
              <div className="sub-panel">
                <div className="sub-panel-title">PARTICIPANTS</div>
                {participants.map(p => (
                  <div key={p.id} className="participant-row">
                    <span className={`p-dot ${p.status}`} />
                    <div className="p-info">
                      <span className="p-name">{p.name}</span>
                      <span className="p-role">{p.role.toUpperCase()}</span>
                    </div>
                    <div className="p-meta">
                      <span className="p-msgs">{p.messagesSent}m</span>
                      <span className="p-ip">{p.ipAddress}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {showNetworkPanel && (
              <div className="sub-panel">
                <div className="sub-panel-title">NETWORK NODES</div>
                {networkNodes.map(n => (
                  <div key={n.id} className="node-row">
                    <span className={`n-dot ${n.status}`} />
                    <span className="n-name">{n.name}</span>
                    <span className="n-lat">{n.latency}ms</span>
                  </div>
                ))}
              </div>
            )}

            <button className="btn-leave" onClick={leaveSession}>LEAVE SESSION</button>
          </div>
        ) : (
          <div className="no-session">
            <div className="no-session-icon">⬡</div>
            <p>No active session</p>
            <p className="hint">Create or scan to join</p>
          </div>
        )}

        <div className="quick-actions">
          <div className="qa-title">QUICK ACTIONS</div>
          <button className="qa-btn" onClick={() => createSession(false)}>
            <span className="qa-badge pub">PUB</span> New Public Session
          </button>
          <button className="qa-btn" onClick={() => createSession(true)}>
            <span className="qa-badge priv">PRI</span> New Private Session
          </button>
          <button className="qa-btn" onClick={scanForSessions} disabled={isScanning}>
            <span className="qa-badge scan">NET</span> Scan LAN Sessions
          </button>
          <button className={`qa-btn ${broadcastMode ? 'active' : ''}`} onClick={() => setBroadcastMode(b => !b)}>
            <span className="qa-badge bcast">BCT</span> {broadcastMode ? 'Broadcast ON' : 'Broadcast OFF'}
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="chat-main">
        {currentSession ? (
          <>
            <div className="chat-header">
              <div className="ch-left">
                <div className="ch-title">{currentSession.name}</div>
                <div className="ch-meta">
                  <span className="ch-tag">{currentSession.code}</span>
                  <span className="ch-participants">
                    {participants.filter(p => p.status === 'online').length} online / {participants.length} total
                  </span>
                  {currentSession.encrypted && <span className="ch-enc">⬡ E2E ENCRYPTED</span>}
                  {broadcastMode && <span className="ch-bcast">◎ BROADCAST</span>}
                </div>
              </div>
              <div className="ch-right">
                <div className="ch-stat"><span>LATENCY</span><span>{networkNodes[0]?.latency ?? '--'}ms</span></div>
                <div className="ch-stat"><span>PKTS</span><span>{packetCount}</span></div>
                <div className="ch-stat">
                  <span>TIME</span>
                  <span>{time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                </div>
              </div>
            </div>

            <div className="tab-bar">
              {(['messages', 'logs', 'network'] as const).map(tab => (
                <button key={tab} className={`tab-btn ${selectedTab === tab ? 'tab-active' : ''}`} onClick={() => setSelectedTab(tab)}>
                  {tab.toUpperCase()}
                </button>
              ))}
              <div className="tab-spacer" />
              {selectedTab === 'messages' && (
                <div className="filter-row">
                  {(['all', 'teacher', 'student'] as const).map(f => (
                    <button key={f} className={`filter-btn ${filter === f ? 'filter-active' : ''}`} onClick={() => setFilter(f)}>
                      {f.toUpperCase()}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedTab === 'messages' && (
              <div className="messages-area">
                {filteredMessages.map(msg => (
                  <div key={msg.id} className={`mw ${msg.isOwn ? 'mw-own' : ''} ${msg.system ? 'mw-sys' : ''}`}>
                    {msg.system ? (
                      <div className="msg-system">
                        <span className="sys-dot">▸</span>
                        <span>{msg.content}</span>
                        <span className="msg-ts">{formatTime(msg.timestamp)}</span>
                      </div>
                    ) : (
                      <>
                        {!msg.isOwn && (
                          <div className="msg-sender-row">
                            <span className={`sender-badge role-${msg.role}`}>{msg.role.toUpperCase()}</span>
                            <span className="msg-sender">{msg.sender}</span>
                            {msg.encrypted && <span className="enc-tag">AES</span>}
                          </div>
                        )}
                        <div className={`msg-bubble ${msg.isOwn ? 'mb-own' : ''} ${msg.role === 'teacher' ? 'mb-teacher' : ''}`}>
                          <div className="msg-content">{msg.content}</div>
                          <div className="msg-foot">
                            <span className="msg-ts">{formatTime(msg.timestamp)}</span>
                            {msg.isOwn && (
                              <span className="msg-status">{msg.read ? '✓✓' : msg.delivered ? '✓' : '◌'}</span>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {typingUsers.length > 0 && (
                  <div className="typing-row">
                    <span className="typing-dot">◌</span>
                    <span>{typingUsers[0]} is typing...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}

            {selectedTab === 'logs' && (
              <div className="logs-area">
                <div className="logs-hdr">SESSION EVENT LOG • {sessionLogs.length} entries</div>
                {sessionLogs.map((log, i) => (
                  <div key={i} className="log-line">
                    <span className="log-idx">{String(sessionLogs.length - i).padStart(3, '0')}</span>
                    <span>{log}</span>
                  </div>
                ))}
              </div>
            )}

            {selectedTab === 'network' && (
              <div className="network-area">
                <div className="net-title">ACTIVE NODES</div>
                <div className="net-nodes-grid">
                  {networkNodes.map(n => (
                    <div key={n.id} className={`net-node-card ${n.status}`}>
                      <div className="nnc-header">
                        <span className={`nnc-dot ${n.status}`} />
                        <span className="nnc-name">{n.name}</span>
                      </div>
                      <div className="nnc-stat">LATENCY<span>{n.latency}ms</span></div>
                      <div className="nnc-stat">STATUS<span>{n.status.toUpperCase()}</span></div>
                    </div>
                  ))}
                </div>

                <div className="net-title" style={{ marginTop: 18 }}>PARTICIPANTS — DEVICE MAP</div>
                <div className="device-map">
                  {participants.map(p => (
                    <div key={p.id} className="device-card">
                      <div className="dc-top">
                        <span className={`dc-dot ${p.status}`} />
                        <span className="dc-name">{p.name}</span>
                        <span className={`dc-role dc-${p.role}`}>{p.role.toUpperCase()}</span>
                      </div>
                      <div className="dc-row"><span>IP</span><span>{p.ipAddress}</span></div>
                      <div className="dc-row"><span>DEVICE</span><span>{p.device}</span></div>
                      <div className="dc-row"><span>MSGS</span><span>{p.messagesSent}</span></div>
                      <div className="dc-row"><span>STATUS</span><span>{p.status.toUpperCase()}</span></div>
                    </div>
                  ))}
                </div>

                <div className="net-title" style={{ marginTop: 18 }}>LIVE STATS</div>
                <div className="net-stats-grid">
                  <div className="ns-card"><span>PACKETS SENT</span><span>{packetCount}</span></div>
                  <div className="ns-card"><span>RECEIVED</span><span>{formatBytes(rxBytes)}</span></div>
                  <div className="ns-card"><span>TRANSMITTED</span><span>{formatBytes(txBytes)}</span></div>
                  <div className="ns-card"><span>ENCRYPTION</span><span>AES-256-GCM</span></div>
                  <div className="ns-card"><span>PROTOCOL</span><span>WebSocket / LAN</span></div>
                  <div className="ns-card"><span>NODES ACTIVE</span><span>{networkNodes.filter(n => n.status === 'connected').length} / {networkNodes.length}</span></div>
                </div>
              </div>
            )}

            {selectedTab === 'messages' && (
              <div className="input-area">
                {broadcastMode && (
                  <div className="broadcast-banner">◎ BROADCAST MODE — Message will be sent to ALL participants</div>
                )}
                <div className="input-row">
                  <div className="input-prefix">{currentSession.encrypted ? '⬡' : '◎'}</div>
                  <input
                    ref={inputRef}
                    className="msg-input"
                    placeholder={broadcastMode ? 'Broadcast message...' : 'Type a message... (Enter to send)'}
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  <div className="input-char-count">{newMessage.length}</div>
                  <button className="btn-send" onClick={sendMessage} disabled={!newMessage.trim()}>SEND</button>
                </div>
                <div className="input-footer">
                  <span>SESSION • {currentSession.code}</span>
                  <span>{currentSession.encrypted ? 'AES-256-GCM ENCRYPTED' : 'UNENCRYPTED'}</span>
                  <span>{participants.filter(p => p.status === 'online').length} ONLINE</span>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="welcome">
            <pre className="welcome-ascii">{`  ██████╗██╗  ██╗ █████╗ ████████╗
 ██╔════╝██║  ██║██╔══██╗╚══██╔══╝
 ██║     ███████║███████║   ██║   
 ██║     ██╔══██║██╔══██║   ██║   
 ╚██████╗██║  ██║██║  ██║   ██║   
  ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝  `}</pre>
            <div className="welcome-title">CHAT MODULE • END-TO-END ENCRYPTED</div>
            <p className="welcome-sub">
              LAN-based encrypted messaging for academic sessions.<br />
              Create a session or scan for active sessions on your network.
            </p>
            <div className="welcome-actions">
              <button className="wbtn wprimary" onClick={() => createSession(false)}>◎ CREATE PUBLIC</button>
              <button className="wbtn wprimary wenc" onClick={() => createSession(true)}>⬡ CREATE PRIVATE</button>
              <button className="wbtn wsecondary" onClick={scanForSessions} disabled={isScanning}>
                {isScanning ? '◌ SCANNING...' : '⌖ SCAN LAN'}
              </button>
            </div>
            <div className="welcome-info">
              <div className="wi-row"><span>ENCRYPTION</span><span>AES-256-GCM</span></div>
              <div className="wi-row"><span>NETWORK</span><span>LAN / WebSocket</span></div>
              <div className="wi-row"><span>BLOCKCHAIN</span><span>HASH VERIFIED</span></div>
              <div className="wi-row"><span>PROTOCOL</span><span>ECDSA SIGNED</span></div>
            </div>
          </div>
        )}
      </main>

      {/* ── JOIN MODAL ── */}
      {showJoinModal && (
        <div className="modal-overlay" onClick={() => setShowJoinModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-title">JOIN SESSION</div>
            <div className="modal-sub">{nearbySessions.length} active sessions found on LAN</div>
            <div className="sessions-list">
              {nearbySessions.map(sess => (
                <div key={sess.code} className="session-item"
                  onClick={() => sess.encrypted ? setJoinCode(sess.code) : joinSession(sess.code)}>
                  <div className="si-left">
                    <div className="si-name">{sess.name}</div>
                    <div className="si-code">{sess.code}</div>
                    <div className="si-desc">{sess.description}</div>
                  </div>
                  <div className="si-right">
                    <span className={`si-badge ${sess.encrypted ? 'priv' : 'pub'}`}>
                      {sess.encrypted ? 'PRIVATE' : 'PUBLIC'}
                    </span>
                    <span className="si-count">{sess.participants} online</span>
                    <span className="si-msgs">{sess.messageCount} msgs</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="modal-divider"><span>OR ENTER CODE MANUALLY</span></div>
            <div className="manual-join">
              <input className="code-input" placeholder="SESSION CODE" value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())} maxLength={6} />
              {nearbySessions.find(s => s.code === joinCode)?.encrypted && (
                <input type="password" className="code-input" placeholder="PASSWORD"
                  value={joinPassword} onChange={e => setJoinPassword(e.target.value)} />
              )}
              <button className="btn-join" onClick={() => joinSession(joinCode, joinPassword || undefined)} disabled={!joinCode}>
                JOIN
              </button>
            </div>
            <button className="modal-close" onClick={() => setShowJoinModal(false)}>×</button>
          </div>
        </div>
      )}

      {/* ── STYLES ── */}
      <style>{`
        * { margin:0; padding:0; box-sizing:border-box; }

        /* ─────────────────────────────────────────────────────────
           GLOBAL SCROLLBAR — matches Quiz/Poll exactly:
           track #111, thumb #222, hover #1e3a5f, width 4px
        ───────────────────────────────────────────────────────── */
        ::-webkit-scrollbar { width:4px; height:4px; }
        ::-webkit-scrollbar-track { background:#111; }
        ::-webkit-scrollbar-thumb { background:#222; border-radius:2px; }
        ::-webkit-scrollbar-thumb:hover { background:#1e3a5f; }
        * { scrollbar-width:thin; scrollbar-color:#222 #111; }

        /* ROOT — no page scroll, fills viewport below navbar */
        .chat-root {
          display:flex;
          height:calc(100vh - 56px);
          max-height:calc(100vh - 56px);
          overflow:hidden;
          background:#030303;
          color:#ffffff;
          font-family:'SF Mono','Monaco','Fira Code',monospace;
          font-size:11px;
        }

        /* ── SIDEBAR ── */
        .chat-sidebar {
          width:290px;
          min-width:290px;
          max-width:290px;
          background:#0a0a0a;
          border-right:1px solid #1e3a5f;
          display:flex;
          flex-direction:column;
          overflow-y:auto;
          overflow-x:hidden;
        }

        .sb-header {
          display:flex;
          justify-content:space-between;
          align-items:center;
          padding:12px 14px;
          border-bottom:1px solid #1e3a5f;
          background:#060606;
          flex-shrink:0;
        }
        .sb-title { font-size:9px; letter-spacing:1.5px; opacity:0.65; }
        .sb-header-right { display:flex; align-items:center; gap:8px; }
        .sb-time { font-size:10px; opacity:0.45; }

        .btn-scan {
          background:none; border:1px solid #1e3a5f; color:#fff;
          padding:3px 9px; font-size:9px; cursor:pointer; font-family:inherit;
          letter-spacing:0.5px; transition:background 0.2s;
        }
        .btn-scan:hover:not(:disabled) { background:#1e3a5f; }
        .btn-scan:disabled { opacity:0.35; cursor:wait; }

        .session-panel { padding:12px 14px; border-bottom:1px solid #1e3a5f; flex-shrink:0; }
        .session-code-row { display:flex; justify-content:space-between; align-items:center; margin-bottom:4px; }
        .session-code { font-size:16px; font-weight:700; letter-spacing:3px; }
        .session-badge { font-size:7px; padding:2px 6px; border-radius:2px; }
        .session-badge.priv { background:rgba(30,58,95,0.5); border:1px solid #1e3a5f; }
        .session-badge.pub  { background:rgba(255,255,255,0.08); border:1px solid #333; }
        .session-desc { font-size:8px; opacity:0.4; margin-bottom:8px; font-style:italic; }

        .session-stats {
          display:grid; grid-template-columns:1fr 1fr;
          background:#070707; border:1px solid #1e3a5f;
          padding:6px; gap:2px 0; margin-bottom:8px;
        }
        .sstat { display:flex; justify-content:space-between; font-size:8px; padding:2px 0; border-bottom:1px dotted #111; }
        .sstat span:first-child { opacity:0.45; }
        .sstat span:last-child { font-weight:600; }
        .enc-val.active { color:#6ab4ff; }
        .enc-val.idle { opacity:0.35; }

        .session-actions { display:flex; gap:5px; margin-bottom:6px; }
        .btn-panel {
          flex:1; background:#111; border:1px solid #1e3a5f; color:#fff;
          padding:4px 0; font-size:8px; cursor:pointer; font-family:inherit; transition:background 0.2s;
        }
        .btn-panel:hover { background:#1e3a5f; }

        .btn-leave {
          width:100%; background:none; border:1px solid rgba(255,255,255,0.18); color:#fff;
          padding:5px; font-size:8px; cursor:pointer; font-family:inherit;
          letter-spacing:1px; transition:all 0.2s; margin-top:4px;
        }
        .btn-leave:hover { background:rgba(255,255,255,0.04); border-color:#fff; }

        .sub-panel { padding:8px 14px; background:#050505; border-bottom:1px solid #1e3a5f; flex-shrink:0; }
        .sub-panel-title { font-size:7px; letter-spacing:1px; opacity:0.4; margin-bottom:6px; }

        .participant-row { display:flex; align-items:center; gap:6px; padding:4px 0; border-bottom:1px dotted #111; }
        .p-dot { width:5px; height:5px; border-radius:50%; flex-shrink:0; }
        .p-dot.online { background:#4a90d9; }
        .p-dot.away   { background:#888; animation:chatblink 1.2s infinite; }
        .p-dot.offline { background:#333; }
        .p-info { flex:1; }
        .p-name { display:block; font-size:9px; }
        .p-role { font-size:7px; opacity:0.35; }
        .p-meta { text-align:right; }
        .p-msgs { display:block; font-size:8px; opacity:0.5; }
        .p-ip { font-size:7px; opacity:0.25; font-family:monospace; }

        .node-row { display:flex; align-items:center; gap:6px; padding:3px 0; font-size:8px; }
        .n-dot { width:5px; height:5px; border-radius:50%; }
        .n-dot.connected { background:#4a90d9; }
        .n-dot.connecting { background:#888; animation:chatblink 1.2s infinite; }
        .n-dot.lost { background:#333; }
        .n-name { flex:1; }
        .n-lat { opacity:0.45; }

        @keyframes chatblink { 0%,100%{opacity:1} 50%{opacity:0.2} }

        .no-session { padding:24px 14px; text-align:center; flex-shrink:0; }
        .no-session-icon { font-size:24px; opacity:0.12; margin-bottom:6px; }
        .no-session p { opacity:0.4; font-size:10px; }
        .hint { font-size:8px; opacity:0.25; margin-top:3px; }

        .quick-actions { margin-top:auto; padding:10px 14px; border-top:1px solid #1e3a5f; flex-shrink:0; }
        .qa-title { font-size:7px; opacity:0.35; letter-spacing:1px; margin-bottom:6px; }
        .qa-btn {
          width:100%; background:#0d0d0d; border:1px solid #141414; color:#fff;
          padding:6px 9px; font-size:9px; cursor:pointer; font-family:inherit;
          display:flex; align-items:center; gap:7px; margin-bottom:3px;
          transition:border-color 0.2s; text-align:left;
        }
        .qa-btn:hover:not(:disabled) { border-color:#1e3a5f; background:#111; }
        .qa-btn:disabled { opacity:0.35; cursor:not-allowed; }
        .qa-btn.active { border-color:#4a90d9; background:rgba(74,144,217,0.06); }
        .qa-badge { font-size:6px; padding:1px 4px; border-radius:1px; font-weight:700; flex-shrink:0; }
        .qa-badge.pub  { background:rgba(255,255,255,0.1); }
        .qa-badge.priv { background:rgba(30,58,95,0.5); }
        .qa-badge.scan { background:rgba(255,255,255,0.07); }
        .qa-badge.bcast { background:rgba(74,144,217,0.25); }

        /* ── MAIN ── */
        .chat-main {
          flex:1; display:flex; flex-direction:column;
          background:#030303; overflow:hidden; min-width:0;
        }

        /* Header */
        .chat-header {
          display:flex; justify-content:space-between; align-items:center;
          padding:9px 18px; border-bottom:1px solid #1e3a5f;
          background:#060606; flex-shrink:0;
        }
        .ch-title { font-size:12px; font-weight:600; margin-bottom:3px; }
        .ch-meta { display:flex; align-items:center; gap:9px; font-size:8px; opacity:0.65; flex-wrap:wrap; }
        .ch-tag { background:#111; border:1px solid #1e3a5f; padding:1px 5px; font-size:8px; font-family:monospace; }
        .ch-enc { color:#6ab4ff; border:1px solid rgba(106,180,255,0.25); padding:1px 5px; font-size:7px; }
        .ch-bcast { color:#ffd700; border:1px solid rgba(255,215,0,0.25); padding:1px 5px; font-size:7px; }
        .ch-right { display:flex; gap:14px; flex-shrink:0; }
        .ch-stat { display:flex; flex-direction:column; align-items:flex-end; font-size:8px; }
        .ch-stat span:first-child { opacity:0.35; font-size:7px; }
        .ch-stat span:last-child { font-weight:600; }

        /* Tab bar */
        .tab-bar {
          display:flex; align-items:center; height:34px;
          border-bottom:1px solid #1e3a5f; background:#070707;
          padding:0 18px; flex-shrink:0;
        }
        .tab-btn {
          background:none; border:none; border-bottom:2px solid transparent;
          color:#fff; opacity:0.35; font-size:8px; letter-spacing:1px;
          padding:0 10px; height:100%; cursor:pointer; font-family:inherit; transition:all 0.15s;
        }
        .tab-btn:hover { opacity:0.65; }
        .tab-btn.tab-active { opacity:1; border-bottom-color:#1e3a5f; }
        .tab-spacer { flex:1; }
        .filter-row { display:flex; gap:3px; }
        .filter-btn {
          background:none; border:1px solid #181818; color:#fff; opacity:0.35;
          font-size:7px; padding:2px 7px; cursor:pointer; font-family:inherit; transition:all 0.15s;
        }
        .filter-btn:hover { opacity:0.65; }
        .filter-btn.filter-active { opacity:1; border-color:#1e3a5f; background:rgba(30,58,95,0.18); }

        /* Messages area — internal scroll only */
        .messages-area {
          flex:1; overflow-y:auto; padding:14px 18px;
          display:flex; flex-direction:column; gap:8px; min-height:0;
        }

        .mw { display:flex; flex-direction:column; max-width:70%; }
        .mw-own { align-self:flex-end; }
        .mw-sys { align-self:center; max-width:100%; }

        .msg-system {
          display:flex; align-items:center; gap:7px; font-size:8px; opacity:0.35;
          padding:3px 10px; background:#090909; border:1px solid #111;
        }
        .sys-dot { color:#1e3a5f; }
        .msg-system .msg-ts { margin-left:auto; font-size:7px; }

        .msg-sender-row { display:flex; align-items:center; gap:5px; margin-bottom:2px; margin-left:2px; }
        .sender-badge { font-size:6px; padding:1px 4px; border-radius:1px; font-weight:700; }
        .role-teacher { background:rgba(30,58,95,0.6); }
        .role-student { background:rgba(255,255,255,0.08); }
        .role-admin   { background:rgba(180,100,50,0.4); }
        .msg-sender { font-size:9px; opacity:0.65; }
        .enc-tag { font-size:6px; opacity:0.35; border:1px solid #222; padding:1px 3px; }

        .msg-bubble { background:#0e0e0e; border:1px solid #1e3a5f; padding:7px 11px; }
        .mb-own { background:#1e3a5f; border-color:#2a4a7a; }
        .mb-teacher { border-color:rgba(30,58,95,0.85); }

        .msg-content { font-size:11px; line-height:1.5; word-break:break-word; }
        .msg-foot { display:flex; justify-content:flex-end; align-items:center; gap:5px; margin-top:3px; }
        .msg-ts { font-size:7px; opacity:0.35; }
        .msg-status { font-size:8px; opacity:0.55; }

        .typing-row { display:flex; align-items:center; gap:5px; font-size:8px; opacity:0.35; padding-left:3px; }
        .typing-dot { animation:chatblink 1s infinite; }

        /* Logs area */
        .logs-area { flex:1; overflow-y:auto; padding:10px 18px; min-height:0; font-family:monospace; font-size:9px; }
        .logs-hdr { font-size:7px; opacity:0.35; letter-spacing:1px; margin-bottom:8px; padding-bottom:5px; border-bottom:1px solid #111; }
        .log-line { display:flex; gap:10px; padding:2px 0; border-bottom:1px dotted #0d0d0d; opacity:0.65; }
        .log-line:hover { opacity:1; }
        .log-idx { opacity:0.25; flex-shrink:0; }

        /* Network area */
        .network-area { flex:1; overflow-y:auto; padding:14px 18px; min-height:0; }
        .net-title { font-size:8px; letter-spacing:1.5px; opacity:0.35; margin-bottom:8px; }

        .net-nodes-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:6px; margin-bottom:6px; }
        .net-node-card { background:#0a0a0a; border:1px solid #1e3a5f; padding:9px; }
        .net-node-card.connecting { border-color:#222; }
        .nnc-header { display:flex; align-items:center; gap:5px; margin-bottom:5px; padding-bottom:4px; border-bottom:1px dotted #111; }
        .nnc-dot { width:5px; height:5px; border-radius:50%; }
        .nnc-dot.connected { background:#4a90d9; }
        .nnc-dot.connecting { background:#888; animation:chatblink 1.2s infinite; }
        .nnc-dot.lost { background:#333; }
        .nnc-name { font-size:8px; }
        .nnc-stat { display:flex; justify-content:space-between; font-size:7px; opacity:0.55; margin-top:2px; }
        .nnc-stat span:last-child { color:#fff; opacity:1; }

        .device-map { display:grid; grid-template-columns:repeat(4,1fr); gap:6px; }
        .device-card { background:#0a0a0a; border:1px solid #111; padding:9px; }
        .dc-top { display:flex; align-items:center; gap:5px; margin-bottom:5px; padding-bottom:4px; border-bottom:1px dotted #111; }
        .dc-dot { width:4px; height:4px; border-radius:50%; }
        .dc-dot.online { background:#4a90d9; }
        .dc-dot.away   { background:#888; }
        .dc-dot.offline { background:#333; }
        .dc-name { flex:1; font-size:8px; }
        .dc-role { font-size:6px; padding:1px 4px; }
        .dc-teacher { background:rgba(30,58,95,0.5); }
        .dc-student { background:rgba(255,255,255,0.07); }
        .dc-admin   { background:rgba(180,100,50,0.3); }
        .dc-row { display:flex; justify-content:space-between; font-size:7px; opacity:0.55; padding:2px 0; border-bottom:1px dotted #090909; }
        .dc-row span:last-child { color:#fff; opacity:1; }

        .net-stats-grid { display:grid; grid-template-columns:repeat(6,1fr); gap:6px; }
        .ns-card { background:#0a0a0a; border:1px solid #1e3a5f; padding:9px; display:flex; flex-direction:column; gap:3px; }
        .ns-card span:first-child { font-size:6px; opacity:0.35; }
        .ns-card span:last-child { font-size:10px; font-weight:600; }

        /* Input area */
        .input-area { border-top:1px solid #1e3a5f; padding:10px 18px; background:#060606; flex-shrink:0; }
        .broadcast-banner {
          font-size:7px; color:#ffd700; border:1px solid rgba(255,215,0,0.18);
          background:rgba(255,215,0,0.04); padding:3px 8px; margin-bottom:6px; letter-spacing:0.5px;
        }
        .input-row { display:flex; align-items:center; gap:7px; margin-bottom:5px; }
        .input-prefix { font-size:13px; opacity:0.35; flex-shrink:0; }
        .msg-input {
          flex:1; background:#0e0e0e; border:1px solid #1e3a5f; color:#fff;
          padding:8px 11px; font-size:11px; font-family:inherit; outline:none; transition:border-color 0.2s;
        }
        .msg-input:focus { border-color:rgba(255,255,255,0.28); }
        .msg-input::placeholder { opacity:0.28; }
        .input-char-count { font-size:8px; opacity:0.25; flex-shrink:0; min-width:22px; text-align:right; }
        .btn-send {
          background:#1e3a5f; border:none; color:#fff; padding:8px 18px;
          font-size:9px; cursor:pointer; font-family:inherit; letter-spacing:1px;
          transition:background 0.2s; flex-shrink:0;
        }
        .btn-send:hover:not(:disabled) { background:#2a4a7a; }
        .btn-send:disabled { opacity:0.28; cursor:not-allowed; }
        .input-footer { display:flex; gap:14px; font-size:7px; opacity:0.25; letter-spacing:0.4px; }

        /* Welcome */
        .welcome {
          flex:1; display:flex; flex-direction:column; align-items:center;
          justify-content:center; padding:30px; text-align:center; overflow-y:auto; min-height:0;
        }
        .welcome-ascii {
          font-size:9px; line-height:1.2; color:#1e3a5f; margin-bottom:16px;
          text-shadow:0 0 8px #1e3a5f; white-space:pre;
        }
        .welcome-title { font-size:10px; letter-spacing:2px; opacity:0.65; margin-bottom:10px; }
        .welcome-sub { font-size:9px; opacity:0.35; line-height:1.7; margin-bottom:22px; max-width:400px; }
        .welcome-actions { display:flex; gap:8px; margin-bottom:22px; flex-wrap:wrap; justify-content:center; }
        .wbtn {
          background:none; border:1px solid #1e3a5f; color:#fff;
          padding:9px 20px; font-size:9px; cursor:pointer; font-family:inherit;
          letter-spacing:1px; transition:all 0.2s;
        }
        .wprimary { background:#1e3a5f; }
        .wprimary:hover { background:#2a4a7a; }
        .wenc { background:rgba(30,58,95,0.4); }
        .wsecondary:hover { background:rgba(30,58,95,0.2); }
        .wbtn:disabled { opacity:0.35; cursor:not-allowed; }
        .welcome-info { background:#0a0a0a; border:1px solid #1e3a5f; padding:12px 22px; min-width:300px; }
        .wi-row { display:flex; justify-content:space-between; font-size:8px; padding:3px 0; border-bottom:1px dotted #111; gap:40px; }
        .wi-row span:first-child { opacity:0.35; }

        /* Modal */
        .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.92); display:flex; align-items:center; justify-content:center; z-index:2000; }
        .modal-box {
          background:#0a0a0a; border:1px solid #1e3a5f; padding:22px;
          width:500px; max-width:94vw; max-height:80vh; overflow-y:auto; position:relative;
        }
        .modal-title { font-size:12px; letter-spacing:2px; margin-bottom:3px; }
        .modal-sub { font-size:8px; opacity:0.35; margin-bottom:14px; }
        .sessions-list { border:1px solid #1e3a5f; max-height:260px; overflow-y:auto; margin-bottom:12px; }
        .session-item {
          display:flex; justify-content:space-between; align-items:center;
          padding:10px 12px; border-bottom:1px solid #0d0d0d; cursor:pointer; transition:background 0.15s;
        }
        .session-item:hover { background:#111; }
        .si-name { font-size:10px; margin-bottom:2px; }
        .si-code { font-size:8px; opacity:0.35; font-family:monospace; margin-bottom:1px; }
        .si-desc { font-size:7px; opacity:0.3; font-style:italic; }
        .si-right { display:flex; flex-direction:column; align-items:flex-end; gap:3px; }
        .si-badge { font-size:6px; padding:2px 6px; letter-spacing:0.5px; }
        .si-badge.priv { background:rgba(30,58,95,0.5); border:1px solid #1e3a5f; }
        .si-badge.pub  { background:rgba(255,255,255,0.07); border:1px solid #222; }
        .si-count,.si-msgs { font-size:7px; opacity:0.4; }
        .modal-divider { text-align:center; position:relative; font-size:7px; opacity:0.35; margin:12px 0; }
        .modal-divider::before,.modal-divider::after {
          content:''; position:absolute; top:50%; width:42%; height:1px; background:#1e3a5f;
        }
        .modal-divider::before { left:0; }
        .modal-divider::after { right:0; }
        .manual-join { display:flex; flex-direction:column; gap:7px; }
        .code-input {
          background:#0e0e0e; border:1px solid #1e3a5f; color:#fff;
          padding:9px 12px; font-size:13px; font-family:monospace;
          letter-spacing:4px; text-align:center; outline:none; width:100%;
        }
        .code-input:focus { border-color:#fff; }
        .btn-join {
          background:#1e3a5f; border:none; color:#fff; padding:9px;
          font-size:9px; cursor:pointer; font-family:inherit; letter-spacing:1px; transition:background 0.2s;
        }
        .btn-join:hover:not(:disabled) { background:#2a4a7a; }
        .btn-join:disabled { opacity:0.35; cursor:not-allowed; }
        .modal-close {
          position:absolute; top:10px; right:14px; background:none;
          border:none; color:#fff; font-size:18px; cursor:pointer; opacity:0.35; line-height:1;
        }
        .modal-close:hover { opacity:1; }

        /* Responsive */
        @media(max-width:1100px){.net-nodes-grid,.device-map{grid-template-columns:repeat(2,1fr)}.net-stats-grid{grid-template-columns:repeat(3,1fr)}}
        @media(max-width:860px){.chat-sidebar{width:230px;min-width:230px;max-width:230px}.net-nodes-grid,.device-map{grid-template-columns:1fr 1fr}.net-stats-grid{grid-template-columns:repeat(2,1fr)}}
      `}</style>
    </div>
  )
}