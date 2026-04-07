export interface User {
  id: string
  name: string
  role: 'teacher' | 'student' | 'admin'
  avatar: string
  deviceId: string
  publicKey?: string
}

export interface Session {
  id: string
  name: string
  type: 'chat' | 'assessment' | 'quiz' | 'poll' | 'discussion'
  createdBy: string
  createdAt: Date
  status: 'active' | 'ended'
  joinCode: string
  isEncrypted: boolean
  password?: string
  participants: string[]
}

export interface Message {
  id: string
  sessionId: string
  senderId: string
  senderName: string
  senderAvatar: string
  content: string
  type: 'text' | 'code' | 'file'
  timestamp: Date
  isEncrypted: boolean
  isEdited: boolean
  replyTo?: string
  reactions: { [emoji: string]: string[] }
  attachments?: Attachment[]
}

export interface Attachment {
  id: string
  name: string
  type: string
  size: number
  url: string
}

export interface Question {
  id: string
  text: string
  type: 'mcq' | 'true-false' | 'short-answer' | 'coding'
  options?: string[]
  correctAnswer?: string | number
  points: number
  codeTemplate?: string
  testCases?: TestCase[]
}

export interface TestCase {
  input: string
  expectedOutput: string
  weight: number
}