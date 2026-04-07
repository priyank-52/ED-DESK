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

export const offlineApi = {
  getStatus: () => window.electronAPI.offline.getStatus() as Promise<BackendStatus | null>,
  getProfile: () => window.electronAPI.offline.getProfile() as Promise<{ peerId: string; displayName: string } | null>,
  scanPeers: () => window.electronAPI.offline.scanPeers() as Promise<PeerRecord[]>,
  listPeers: () => window.electronAPI.offline.listPeers() as Promise<PeerRecord[]>,
  listConversations: () => window.electronAPI.offline.listConversations() as Promise<ConversationRecord[]>,
  getMessages: (conversationId: string) => window.electronAPI.offline.getMessages(conversationId) as Promise<ChatMessageRecord[]>,
  sendMessage: (peerId: string, content: string) => window.electronAPI.offline.sendMessage(peerId, content) as Promise<ChatMessageRecord>,
  listAssessments: () => window.electronAPI.offline.listAssessments() as Promise<AssessmentRecord[]>,
  createAssessment: (payload: {
    title: string
    description: string
    creatorName?: string
    timeLimitMinutes: number
    sharedWithPeers: boolean
    questions: AssessmentQuestion[]
  }) => window.electronAPI.offline.createAssessment(payload) as Promise<AssessmentRecord>,
  submitAssessment: (payload: {
    assessmentId: string
    participantName: string
    answers: Record<string, string>
  }) => window.electronAPI.offline.submitAssessment(payload) as Promise<AssessmentSubmissionRecord>,
  listSubmissions: (assessmentId: string) => window.electronAPI.offline.listSubmissions(assessmentId) as Promise<AssessmentSubmissionRecord[]>,
  listLedger: () => window.electronAPI.offline.listLedger() as Promise<LedgerRecord[]>
}
