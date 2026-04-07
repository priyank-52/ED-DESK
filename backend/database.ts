import { createHash } from 'node:crypto'
import type {
  AssessmentRecord,
  AssessmentSubmissionRecord,
  ChatMessageRecord,
  ConversationRecord,
  LedgerRecord,
  PeerRecord
} from './types'

type AddMessageInput = Omit<ChatMessageRecord, 'hash' | 'previousHash'>
type AddLedgerInput = Omit<LedgerRecord, 'id' | 'hash' | 'previousHash' | 'createdAt'>

export class BackendDatabase {
  private readonly peers = new Map<string, PeerRecord>()
  private readonly conversations = new Map<string, ConversationRecord>()
  private readonly messages = new Map<string, ChatMessageRecord[]>()
  private readonly assessments = new Map<string, AssessmentRecord>()
  private readonly submissions = new Map<string, AssessmentSubmissionRecord[]>()
  private readonly ledger: LedgerRecord[] = []

  constructor(_dbPath: string) {}

  async init(): Promise<void> {}

  listPeers(): PeerRecord[] {
    return [...this.peers.values()].sort((a, b) => b.lastSeen - a.lastSeen)
  }

  upsertPeer(peer: PeerRecord): void {
    this.peers.set(peer.id, peer)
  }

  getPeer(peerId: string): PeerRecord | undefined {
    return this.peers.get(peerId)
  }

  ensureConversation(peerId: string, peerName: string): ConversationRecord {
    const existing = [...this.conversations.values()].find((item) => item.peerId === peerId)
    if (existing) return existing

    const conversation: ConversationRecord = {
      id: `conversation-${peerId}`,
      peerId,
      peerName,
      lastMessage: '',
      updatedAt: Date.now(),
      unreadCount: 0
    }
    this.conversations.set(conversation.id, conversation)
    return conversation
  }

  listConversations(): ConversationRecord[] {
    return [...this.conversations.values()].sort((a, b) => b.updatedAt - a.updatedAt)
  }

  markConversationRead(conversationId: string): void {
    const conversation = this.conversations.get(conversationId)
    if (!conversation) return
    this.conversations.set(conversationId, { ...conversation, unreadCount: 0 })
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

    return message
  }

  updateMessageStatus(messageId: string, status: ChatMessageRecord['status'], deliveredAt?: number): void {
    for (const [conversationId, bucket] of this.messages.entries()) {
      const index = bucket.findIndex((item) => item.id === messageId)
      if (index === -1) continue
      bucket[index] = { ...bucket[index], status, deliveredAt }
      this.messages.set(conversationId, bucket)
      return
    }
  }

  saveAssessment(assessment: AssessmentRecord): void {
    this.assessments.set(assessment.id, assessment)
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
    return record
  }

  listLedger(): LedgerRecord[] {
    return [...this.ledger]
  }

  private lastHash(): string {
    return this.ledger[0]?.hash ?? 'GENESIS'
  }

  private hashValue(value: unknown): string {
    return createHash('sha256').update(JSON.stringify(value)).digest('hex')
  }
}
