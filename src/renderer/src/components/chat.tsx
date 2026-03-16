import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

interface Message {
  id: string
  sender: string
  content: string
  timestamp: Date
  isOwn: boolean
  system?: boolean
}

interface Session {
  code: string
  name: string
  participants: number
  encrypted: boolean
  created: Date
}

export default function Chat() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const sessionCode = searchParams.get('code')
  
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [nearbySessions, setNearbySessions] = useState<Session[]>([])
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [joinPassword, setJoinPassword] = useState('')
  const [currentSession, setCurrentSession] = useState<Session | null>(null)
  const [participants, setParticipants] = useState(1)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Load session if code is provided
  useEffect(() => {
    if (sessionCode) {
      setCurrentSession({
        code: sessionCode,
        name: `Session ${sessionCode}`,
        participants: 2,
        encrypted: true,
        created: new Date()
      })
      
      // Add system message
      setMessages([
        {
          id: '1',
          sender: 'System',
          content: `Joined session: ${sessionCode}`,
          timestamp: new Date(),
          isOwn: false,
          system: true
        }
      ])
    }
  }, [sessionCode])

  // Scan for nearby sessions
  const scanForSessions = () => {
    setIsScanning(true)
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      sender: 'System',
      content: 'Scanning for nearby sessions...',
      timestamp: new Date(),
      isOwn: false,
      system: true
    }])

    // Simulate scanning
    setTimeout(() => {
      const mockSessions: Session[] = [
        { code: 'DS1234', name: 'Data Structures Group', participants: 4, encrypted: false, created: new Date() },
        { code: 'ALGO55', name: 'Algorithms Discussion', participants: 3, encrypted: true, created: new Date() },
        { code: 'JS2024', name: 'JavaScript Help', participants: 6, encrypted: false, created: new Date() },
        { code: 'CODE99', name: 'Coding Buddies', participants: 2, encrypted: true, created: new Date() },
        { code: 'CHAT01', name: 'General Chat', participants: 8, encrypted: false, created: new Date() }
      ]
      setNearbySessions(mockSessions)
      setIsScanning(false)
      setShowJoinModal(true)
      
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: 'System',
        content: `Found ${mockSessions.length} nearby sessions`,
        timestamp: new Date(),
        isOwn: false,
        system: true
      }])
    }, 2000)
  }

  // Create a new session
  const createSession = (encrypted: boolean) => {
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    const password = encrypted ? Math.floor(1000 + Math.random() * 9000).toString() : undefined
    
    const session: Session = {
      code: newCode,
      name: `Session ${newCode}`,
      participants: 1,
      encrypted,
      created: new Date()
    }
    
    setCurrentSession(session)
    setMessages([
      {
        id: Date.now().toString(),
        sender: 'System',
        content: `Session created: ${newCode}${password ? ` (Password: ${password})` : ''}`,
        timestamp: new Date(),
        isOwn: false,
        system: true
      }
    ])
    
    // Update URL with session code
    navigate(`/chat?code=${newCode}`)
  }

  // Join a session
  const joinSession = (code: string, password?: string) => {
    const session = nearbySessions.find(s => s.code === code)
    if (session?.encrypted && !password) {
      alert('This session requires a password')
      return
    }
    
    setCurrentSession(session || { code, name: `Session ${code}`, participants: 1, encrypted: false, created: new Date() })
    setMessages([
      {
        id: Date.now().toString(),
        sender: 'System',
        content: `Joined session: ${code}`,
        timestamp: new Date(),
        isOwn: false,
        system: true
      }
    ])
    
    setShowJoinModal(false)
    setJoinCode('')
    setJoinPassword('')
    
    // Update URL with session code
    navigate(`/chat?code=${code}`)
  }

  // Leave current session
  const leaveSession = () => {
    setCurrentSession(null)
    setMessages([])
    navigate('/chat')
  }

  // Send a message
  const sendMessage = () => {
    if (!newMessage.trim() || !currentSession) return
    
    const message: Message = {
      id: Date.now().toString(),
      sender: 'You',
      content: newMessage,
      timestamp: new Date(),
      isOwn: true
    }
    
    setMessages(prev => [...prev, message])
    setNewMessage('')
    
    // Simulate reply after 1-3 seconds (only in demo mode)
    if (currentSession.code.startsWith('DEMO')) {
      setTimeout(() => {
        const reply: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'User_' + Math.floor(Math.random() * 100),
          content: getRandomReply(),
          timestamp: new Date(),
          isOwn: false
        }
        setMessages(prev => [...prev, reply])
      }, 1000 + Math.random() * 2000)
    }
  }

  // Random replies for demo
  const getRandomReply = () => {
    const replies = [
      "That's interesting!",
      "I agree with you.",
      "Can you explain more?",
      "Thanks for sharing!",
      "👍",
      "Let's discuss this further.",
      "Good point!",
      "I see what you mean."
    ]
    return replies[Math.floor(Math.random() * replies.length)]
  }

  // Format timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit'
    })
  }

  return (
    <div className="chat-container">
      {/* Sidebar */}
      <div className="chat-sidebar">
        <div className="sidebar-header">
          <h3>CHAT SESSIONS</h3>
          {!currentSession && (
            <button className="scan-button" onClick={scanForSessions} disabled={isScanning}>
              {isScanning ? 'SCANNING...' : 'SCAN'}
            </button>
          )}
        </div>

        {currentSession ? (
          <div className="session-info">
            <div className="session-header">
              <span className="session-code">{currentSession.code}</span>
              <span className={`session-badge ${currentSession.encrypted ? 'encrypted' : 'public'}`}>
                {currentSession.encrypted ? '🔒' : '🌐'}
              </span>
            </div>
            <div className="session-details">
              <div className="detail-item">
                <span>Participants</span>
                <span>{currentSession.participants}</span>
              </div>
              <div className="detail-item">
                <span>Created</span>
                <span>{currentSession.created.toLocaleTimeString()}</span>
              </div>
            </div>
            <button className="leave-button" onClick={leaveSession}>
              LEAVE SESSION
            </button>
          </div>
        ) : (
          <div className="no-session">
            <p>No active session</p>
            <p className="hint">Create a new session or join an existing one</p>
          </div>
        )}

        <div className="quick-actions">
          <button className="action-button" onClick={() => createSession(false)}>
            <span className="action-icon">🌐</span>
            <span>Public Session</span>
          </button>
          <button className="action-button" onClick={() => createSession(true)}>
            <span className="action-icon">🔒</span>
            <span>Private Session</span>
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="chat-main">
        {currentSession ? (
          <>
            <div className="chat-header">
              <div className="chat-title">
                <h2>{currentSession.name}</h2>
                <span className="participant-count">{currentSession.participants} participants</span>
              </div>
              {currentSession.encrypted && (
                <div className="encryption-badge">End-to-end encrypted</div>
              )}
            </div>

            <div className="messages-area">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`message-wrapper ${msg.isOwn ? 'own' : ''} ${msg.system ? 'system' : ''}`}
                >
                  {!msg.isOwn && !msg.system && (
                    <div className="message-sender">{msg.sender}</div>
                  )}
                  <div className="message-bubble">
                    <div className="message-content">{msg.content}</div>
                    <div className="message-time">{formatTime(msg.timestamp)}</div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="message-input-area">
              <input
                type="text"
                className="message-input"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              />
              <button 
                className="send-button" 
                onClick={sendMessage}
                disabled={!newMessage.trim()}
              >
                SEND
              </button>
            </div>
          </>
        ) : (
          <div className="welcome-screen">
            <div className="welcome-icon">💬</div>
            <h2>Welcome to Chat</h2>
            <p>Create a new session or scan for nearby sessions to start chatting</p>
            <div className="welcome-actions">
              <button className="welcome-button" onClick={() => createSession(false)}>
                Create Public Session
              </button>
              <button className="welcome-button secondary" onClick={scanForSessions}>
                Scan for Sessions
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Join Session Modal */}
      {showJoinModal && (
        <div className="modal-overlay" onClick={() => setShowJoinModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Join Session</h3>
            
            <div className="nearby-sessions-list">
              {nearbySessions.map((session) => (
                <div 
                  key={session.code} 
                  className="nearby-session-item"
                  onClick={() => {
                    if (session.encrypted) {
                      setJoinCode(session.code)
                    } else {
                      joinSession(session.code)
                    }
                  }}
                >
                  <div className="session-info">
                    <span className="session-name">{session.name}</span>
                    <span className="session-code-small">{session.code}</span>
                  </div>
                  <div className="session-meta">
                    <span className="participants">👥 {session.participants}</span>
                    {session.encrypted && <span className="lock-icon">🔒</span>}
                  </div>
                </div>
              ))}
            </div>

            <div className="join-divider">
              <span>OR</span>
            </div>

            <div className="manual-join">
              <input
                type="text"
                className="code-input"
                placeholder="Enter session code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
              />
              {nearbySessions.find(s => s.code === joinCode)?.encrypted && (
                <input
                  type="password"
                  className="password-input"
                  placeholder="Password"
                  value={joinPassword}
                  onChange={(e) => setJoinPassword(e.target.value)}
                />
              )}
              <button 
                className="join-button"
                onClick={() => joinSession(joinCode, joinPassword)}
                disabled={!joinCode}
              >
                JOIN
              </button>
            </div>

            <button className="modal-close" onClick={() => setShowJoinModal(false)}>×</button>
          </div>
        </div>
      )}

      <style>{`
        .chat-container {
          display: flex;
          height: calc(100vh - 56px);
          background: #0a0a0a;
          color: #ffffff;
          font-family: 'SF Mono', 'Monaco', monospace;
        }

        /* Sidebar */
        .chat-sidebar {
          width: 280px;
          background: #111111;
          border-right: 1px solid #1e3a5f;
          display: flex;
          flex-direction: column;
          padding: 1rem;
        }

        .sidebar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #222;
        }

        .sidebar-header h3 {
          color: #666;
          font-size: 0.8rem;
          letter-spacing: 1px;
        }

        .scan-button {
          background: none;
          border: 1px solid #1e3a5f;
          color: #1e3a5f;
          padding: 0.3rem 0.8rem;
          font-size: 0.7rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .scan-button:hover:not(:disabled) {
          background: #1e3a5f;
          color: #fff;
        }

        .scan-button:disabled {
          opacity: 0.5;
          cursor: wait;
        }

        .session-info {
          background: #0a0a0a;
          border: 1px solid #222;
          padding: 1rem;
          margin-bottom: 1rem;
        }

        .session-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .session-code {
          font-size: 1.1rem;
          font-weight: bold;
          color: #1e3a5f;
          font-family: monospace;
        }

        .session-badge {
          font-size: 1rem;
        }

        .session-details {
          margin-bottom: 1rem;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
          color: #999;
          margin-bottom: 0.3rem;
        }

        .leave-button {
          width: 100%;
          background: none;
          border: 1px solid #ff4444;
          color: #ff4444;
          padding: 0.5rem;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .leave-button:hover {
          background: #ff4444;
          color: #fff;
        }

        .no-session {
          text-align: center;
          padding: 2rem 0;
          color: #666;
        }

        .no-session p {
          margin-bottom: 0.5rem;
        }

        .no-session .hint {
          font-size: 0.7rem;
          color: #444;
        }

        .quick-actions {
          margin-top: auto;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .action-button {
          background: #0a0a0a;
          border: 1px solid #222;
          color: #fff;
          padding: 0.8rem;
          display: flex;
          align-items: center;
          gap: 0.8rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-button:hover {
          border-color: #1e3a5f;
        }

        .action-icon {
          font-size: 1.2rem;
        }

        /* Main Chat Area */
        .chat-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: #0a0a0a;
        }

        .chat-header {
          padding: 1rem 1.5rem;
          border-bottom: 1px solid #222;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .chat-title h2 {
          font-size: 1rem;
          margin-bottom: 0.2rem;
        }

        .participant-count {
          font-size: 0.7rem;
          color: #666;
        }

        .encryption-badge {
          font-size: 0.7rem;
          color: #1e3a5f;
          border: 1px solid #1e3a5f;
          padding: 0.2rem 0.5rem;
        }

        .messages-area {
          flex: 1;
          padding: 1.5rem;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .message-wrapper {
          display: flex;
          flex-direction: column;
          max-width: 70%;
        }

        .message-wrapper.own {
          align-self: flex-end;
        }

        .message-wrapper.system {
          align-self: center;
          max-width: 90%;
        }

        .message-sender {
          font-size: 0.7rem;
          color: #1e3a5f;
          margin-bottom: 0.2rem;
          margin-left: 0.5rem;
        }

        .message-bubble {
          background: #111;
          border: 1px solid #222;
          padding: 0.5rem 1rem;
          border-radius: 4px;
        }

        .message-wrapper.own .message-bubble {
          background: #1e3a5f;
          border-color: #1e3a5f;
        }

        .message-wrapper.system .message-bubble {
          background: #0a0a0a;
          border-color: #333;
        }

        .message-content {
          font-size: 0.9rem;
          margin-bottom: 0.2rem;
          word-break: break-word;
        }

        .message-time {
          font-size: 0.6rem;
          color: #999;
          text-align: right;
        }

        .message-wrapper.own .message-time {
          color: #ccc;
        }

        .message-input-area {
          padding: 1rem 1.5rem;
          border-top: 1px solid #222;
          display: flex;
          gap: 1rem;
        }

        .message-input {
          flex: 1;
          background: #111;
          border: 1px solid #222;
          color: #fff;
          padding: 0.8rem 1rem;
          font-size: 0.9rem;
          font-family: inherit;
        }

        .message-input:focus {
          outline: none;
          border-color: #1e3a5f;
        }

        .send-button {
          background: #1e3a5f;
          border: none;
          color: white;
          padding: 0 1.5rem;
          font-size: 0.8rem;
          cursor: pointer;
          transition: background 0.2s;
        }

        .send-button:hover:not(:disabled) {
          background: #2a4a7a;
        }

        .send-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Welcome Screen */
        .welcome-screen {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 2rem;
        }

        .welcome-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
          color: #1e3a5f;
        }

        .welcome-screen h2 {
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
        }

        .welcome-screen p {
          color: #999;
          margin-bottom: 2rem;
          max-width: 400px;
        }

        .welcome-actions {
          display: flex;
          gap: 1rem;
        }

        .welcome-button {
          background: #1e3a5f;
          border: none;
          color: white;
          padding: 0.8rem 1.5rem;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .welcome-button.secondary {
          background: none;
          border: 1px solid #1e3a5f;
          color: #1e3a5f;
        }

        .welcome-button.secondary:hover {
          background: #1e3a5f;
          color: #fff;
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
        }

        .modal-content {
          background: #111;
          border: 1px solid #1e3a5f;
          padding: 2rem;
          width: 400px;
          max-width: 90%;
          position: relative;
        }

        .modal-content h3 {
          margin-bottom: 1.5rem;
          color: #fff;
        }

        .nearby-sessions-list {
          max-height: 300px;
          overflow-y: auto;
          margin-bottom: 1rem;
          border: 1px solid #222;
        }

        .nearby-session-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          border-bottom: 1px solid #222;
          cursor: pointer;
          transition: background 0.2s;
        }

        .nearby-session-item:hover {
          background: #0a0a0a;
        }

        .session-info {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }

        .session-name {
          font-size: 0.9rem;
          color: #fff;
        }

        .session-code-small {
          font-size: 0.7rem;
          color: #666;
          font-family: monospace;
        }

        .session-meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .participants {
          font-size: 0.8rem;
          color: #999;
        }

        .lock-icon {
          color: #ff4444;
        }

        .join-divider {
          text-align: center;
          margin: 1rem 0;
          color: #666;
          position: relative;
        }

        .join-divider::before,
        .join-divider::after {
          content: '';
          position: absolute;
          top: 50%;
          width: 45%;
          height: 1px;
          background: #222;
        }

        .join-divider::before { left: 0; }
        .join-divider::after { right: 0; }

        .manual-join {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .code-input,
        .password-input {
          background: #0a0a0a;
          border: 1px solid #222;
          color: #fff;
          padding: 0.8rem;
          font-size: 0.9rem;
          font-family: monospace;
          text-align: center;
          letter-spacing: 2px;
        }

        .code-input:focus,
        .password-input:focus {
          outline: none;
          border-color: #1e3a5f;
        }

        .join-button {
          background: #1e3a5f;
          border: none;
          color: white;
          padding: 0.8rem;
          font-size: 0.9rem;
          cursor: pointer;
          transition: background 0.2s;
          margin-top: 0.5rem;
        }

        .join-button:hover:not(:disabled) {
          background: #2a4a7a;
        }

        .join-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .modal-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: none;
          border: none;
          color: #666;
          font-size: 1.5rem;
          cursor: pointer;
        }

        .modal-close:hover {
          color: #fff;
        }

        /* Scrollbar */
        ::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }

        ::-webkit-scrollbar-track {
          background: #111;
        }

        ::-webkit-scrollbar-thumb {
          background: #222;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #1e3a5f;
        }
      `}</style>
    </div>
  )
}