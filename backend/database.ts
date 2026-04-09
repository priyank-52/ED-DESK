import { createHash } from 'node:crypto'
import fs from 'node:fs'
import { dirname } from 'node:path'
import type {
  AssessmentRecord,
  AssessmentSubmissionRecord,
  ChatMessageRecord,
  ConversationRecord,
  DevicePermissions,
  LedgerRecord,
  PeerRecord,
  SessionRecord
} from './types'

type AddMessageInput = Omit<ChatMessageRecord, 'hash' | 'previousHash'>
type AddLedgerInput = Omit<LedgerRecord, 'id' | 'hash' | 'previousHash' | 'createdAt'>

interface PersistedState {
  peers: PeerRecord[]
  conversations: ConversationRecord[]
  messages: Record<string, ChatMessageRecord[]>
  assessments: AssessmentRecord[]
  submissions: Record<string, AssessmentSubmissionRecord[]>
  ledger: LedgerRecord[]
  permissions: DevicePermissions
  hostedSession: SessionRecord | null
}

const defaultState = (): PersistedState => ({
  peers: [],
  conversations: [],
  messages: {},
  assessments: [],
  submissions: {},
  ledger: [],
  permissions: {
    nearbyScan: 'prompt',
    localNetwork: 'granted'
  },
  hostedSession: null
})

export class BackendDatabase {
  private readonly dbPath: string
  private readonly peers = new Map<string, PeerRecord>()
  private readonly conversations = new Map<string, ConversationRecord>()
  private readonly messages = new Map<string, ChatMessageRecord[]>()
  private readonly assessments = new Map<string, AssessmentRecord>()
  private readonly submissions = new Map<string, AssessmentSubmissionRecord[]>()
  private readonly ledger: LedgerRecord[] = []
  private permissions: DevicePermissions = defaultState().permissions
  private hostedSession: SessionRecord | null = null

  constructor(dbPath: string) {
    this.dbPath = dbPath
  }

  async init(): Promise<void> {
    fs.mkdirSync(dirname(this.dbPath), { recursive: true })
    if (!fs.existsSync(this.dbPath)) {
      this.persist()
      return
    }

    const raw = fs.readFileSync(this.dbPath, 'utf8').trim()
    if (!raw) {
      this.persist()
      return
    }

    const parsed = { ...defaultState(), ...JSON.parse(raw) } as PersistedState
    for (const peer of parsed.peers) this.peers.set(peer.id, peer)
    for (const conversation of parsed.conversations) this.conversations.set(conversation.id, conversation)
    for (const [conversationId, bucket] of Object.entries(parsed.messages)) this.messages.set(conversationId, bucket)
    for (const assessment of parsed.assessments) this.assessments.set(assessment.id, assessment)
    for (const [assessmentId, bucket] of Object.entries(parsed.submissions)) this.submissions.set(assessmentId, bucket)
    this.ledger.push(...parsed.ledger)
    this.permissions = parsed.permissions
    this.hostedSession = parsed.hostedSession
  }

  listPeers(): PeerRecord[] {
    return [...this.peers.values()].sort((a, b) => b.lastSeen - a.lastSeen)
  }

  upsertPeer(peer: PeerRecord): void {
    this.peers.set(peer.id, peer)
    this.persist()
  }

  getPeer(peerId: string): PeerRecord | undefined {
    return this.peers.get(peerId)
  }

  ensureConversation(peerId: string, peerName: string, sessionCode?: string | null): ConversationRecord {
    const normalizedSessionCode = sessionCode?.trim().toUpperCase() || null
    const existing = [...this.conversations.values()].find((item) =>
      item.peerId === peerId && (item.sessionCode ?? null) === normalizedSessionCode
    )
    if (existing) return existing

    const conversation: ConversationRecord = {
      id: normalizedSessionCode ? `conversation-${peerId}-${normalizedSessionCode}` : `conversation-${peerId}`,
      peerId,
      peerName,
      sessionCode: normalizedSessionCode,
      lastMessage: '',
      updatedAt: Date.now(),
      unreadCount: 0
    }
    this.conversations.set(conversation.id, conversation)
    this.persist()
    return conversation
  }

  listConversations(): ConversationRecord[] {
    return [...this.conversations.values()].sort((a, b) => b.updatedAt - a.updatedAt)
  }

  markConversationRead(conversationId: string): void {
    const conversation = this.conversations.get(conversationId)
    if (!conversation) return
    this.conversations.set(conversationId, { ...conversation, unreadCount: 0 })
    this.persist()
  }

  listMessages(conversationId: string): ChatMessageRecord[] {
    return [...(this.messages.get(conversationId) ?? [])]
  }

  addMessage(input: AddMessageInput): ChatMessageRecord {
    const previousHash = this.lastHash()
    const hash = this.hashValue({ ...input, previousHash })
    const message: ChatMessageRecord = { ...input, hash, previousHash }
    const bucket = this.messages.get(input.conversationId) ?? []
    bucket.push(message)
    this.messages.set(input.conversationId, bucket)

    const conversation = this.conversations.get(input.conversationId)
    if (conversation) {
      this.conversations.set(input.conversationId, {
        ...conversation,
        lastMessage: input.content,
        updatedAt: input.createdAt,
        unreadCount: input.direction === 'incoming' ? conversation.unreadCount + 1 : conversation.unreadCount
      })
    }

    this.persist()
    return message
  }

  updateMessageStatus(messageId: string, status: ChatMessageRecord['status'], deliveredAt?: number): void {
    for (const [conversationId, bucket] of this.messages.entries()) {
      const index = bucket.findIndex((item) => item.id === messageId)
      if (index === -1) continue
      bucket[index] = { ...bucket[index], status, deliveredAt }
      this.messages.set(conversationId, bucket)
      this.persist()
      return
    }
  }

  saveAssessment(assessment: AssessmentRecord): void {
    this.assessments.set(assessment.id, assessment)
    this.persist()
  }

  listAssessments(): AssessmentRecord[] {
    return [...this.assessments.values()].sort((a, b) => b.updatedAt - a.updatedAt)
  }

  getAssessment(assessmentId: string): AssessmentRecord | undefined {
    return this.assessments.get(assessmentId)
  }

  saveSubmission(submission: AssessmentSubmissionRecord): void {
    const bucket = this.submissions.get(submission.assessmentId) ?? []
    bucket.push(submission)
    this.submissions.set(submission.assessmentId, bucket)
    this.persist()
  }

  listSubmissions(assessmentId: string): AssessmentSubmissionRecord[] {
    return [...(this.submissions.get(assessmentId) ?? [])].sort((a, b) => b.submittedAt - a.submittedAt)
  }

  addLedgerRecord(input: AddLedgerInput): LedgerRecord {
    const previousHash = this.lastHash()
    const createdAt = Date.now()
    const hash = this.hashValue({ ...input, previousHash, createdAt })
    const record: LedgerRecord = {
      id: `ledger-${this.ledger.length + 1}`,
      createdAt,
      previousHash,
      hash,
      ...input
    }
    this.ledger.unshift(record)
    this.persist()
    return record
  }

  listLedger(): LedgerRecord[] {
    return [...this.ledger]
  }

  getPermissions(): DevicePermissions {
    return this.permissions
  }

  updatePermissions(partial: Partial<DevicePermissions>): DevicePermissions {
    this.permissions = {
      ...this.permissions,
      ...partial
    }
    this.persist()
    return this.permissions
  }

  getHostedSession(): SessionRecord | null {
    return this.hostedSession
  }

  saveHostedSession(session: SessionRecord | null): void {
    this.hostedSession = session
    this.persist()
  }

  private persist(): void {
    const payload: PersistedState = {
      peers: [...this.peers.values()],
      conversations: [...this.conversations.values()],
      messages: Object.fromEntries(this.messages.entries()),
      assessments: [...this.assessments.values()],
      submissions: Object.fromEntries(this.submissions.entries()),
      ledger: [...this.ledger],
      permissions: this.permissions,
      hostedSession: this.hostedSession
    }
    fs.writeFileSync(this.dbPath, JSON.stringify(payload, null, 2), 'utf8')
  }

  private lastHash(): string {
    return this.ledger[0]?.hash ?? 'GENESIS'
  }

  private hashValue(value: unknown): string {
    return createHash('sha256').update(JSON.stringify(value)).digest('hex')
  }
}
