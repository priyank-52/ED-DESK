export interface PeerRecord {
  id: string
  displayName: string
  address: string
  port: number
  status: 'online' | 'stale'
  transport: 'wifi'
  capabilities: string[]
  lastSeen: number
}

export interface ConversationRecord {
  id: string
  peerId: string
  peerName: string
  lastMessage: string
  updatedAt: number
  unreadCount: number
}

export interface ChatMessageRecord {
  id: string
  conversationId: string
  peerId: string
  peerName: string
  senderName: string
  recipientName: string
  content: string
  direction: 'incoming' | 'outgoing'
  transport: 'wifi' | 'demo' | 'local'
  status: 'pending' | 'delivered' | 'failed'
  createdAt: number
  deliveredAt?: number
  hash: string
  previousHash: string
}

export interface AssessmentQuestion {
  id: string
  prompt: string
  type: 'mcq' | 'true-false' | 'short-answer'
  options?: string[]
  correctAnswer?: string
  points: number
}

export interface AssessmentRecord {
  id: string
  code: string
  title: string
  description: string
  creatorName: string
  hostPeerId: string
  origin: 'local' | 'remote'
  status: 'draft' | 'active' | 'closed'
  timeLimitMinutes: number
  sharedWithPeers: boolean
  createdAt: number
  updatedAt: number
  questions: AssessmentQuestion[]
}

export interface AssessmentSubmissionRecord {
  id: string
  assessmentId: string
  participantName: string
  answers: Record<string, string>
  score: number
  submittedAt: number
  status: 'submitted' | 'synced'
}

export interface LedgerRecord {
  id: string
  entityType: 'message' | 'assessment' | 'submission'
  entityId: string
  action: string
  hash: string
  previousHash: string
  createdAt: number
  payload: Record<string, unknown>
}

export interface BackendStatus {
  peerId: string
  displayName: string
  localAddress: string
  serverPort: number
  discoveryPort: number
  backendMode: 'offline-desktop'
  blockchainMode: 'hash-ledger'
  bluetoothSupported: false
  wifiDiscoveryEnabled: boolean
  peersOnline: number
  conversations: number
  assessments: number
  recordsInLedger: number
}
