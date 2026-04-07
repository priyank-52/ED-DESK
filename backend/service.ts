import { randomUUID } from 'node:crypto'
import dgram from 'node:dgram'
import http, { IncomingMessage } from 'node:http'
import os from 'node:os'
import { join } from 'node:path'
import { app } from 'electron'
import { BackendDatabase } from './database'
import type {
  AssessmentQuestion,
  AssessmentRecord,
  AssessmentSubmissionRecord,
  BackendStatus,
  ChatMessageRecord,
  ConversationRecord,
  PeerRecord
} from './types'

interface PeerHeartbeat {
  app: 'ed-desk'
  peerId: string
  displayName: string
  port: number
  capabilities: string[]
  timestamp: number
}

interface PeerMessagePayload {
  peerId: string
  peerName: string
  recipientName: string
  content: string
  timestamp: number
}

export class OfflineBackendService {
  private readonly discoveryPort = 41235
  private readonly database: BackendDatabase
  private readonly peerId: string
  private readonly displayName: string
  private server: http.Server | null = null
  private discoverySocket: dgram.Socket | null = null
  private serverPort = 0
  private localAddress = '127.0.0.1'

  constructor() {
    this.database = new BackendDatabase(join(app.getPath('userData'), 'backend', 'eddesk.sqlite'))
    this.peerId = `peer-${os.hostname().toLowerCase()}`
    this.displayName = os.hostname()
  }

  async start(): Promise<void> {
    await this.database.init()
    await this.startHttpServer()
    await this.startDiscovery()
    this.scanPeers()
    setInterval(() => this.broadcastHeartbeat(), 8000)
    setInterval(() => this.expirePeers(), 12000)
  }

  async stop(): Promise<void> {
    this.discoverySocket?.close()
    this.discoverySocket = null

    if (this.server) {
      await new Promise<void>((resolve, reject) => {
        this.server?.close((error) => {
          if (error) {
            reject(error)
            return
          }
          resolve()
        })
      })
    }

    this.server = null
  }

  private async startHttpServer(): Promise<void> {
    this.server = http.createServer(async (request, response) => {
      const url = new URL(request.url ?? '/', 'http://127.0.0.1')

      if (request.method === 'GET' && url.pathname === '/api/status') {
        this.writeJson(response, 200, this.getStatus())
        return
      }

      if (request.method === 'POST' && url.pathname === '/api/peer/message') {
        const payload = await this.readJson<PeerMessagePayload>(request)
        const message = this.receivePeerMessage(payload)
        this.writeJson(response, 200, { ok: true, message })
        return
      }

      if (request.method === 'POST' && url.pathname === '/api/peer/assessment') {
        const payload = await this.readJson<{ assessment: AssessmentRecord }>(request)
        this.receivePeerAssessment(payload.assessment)
        this.writeJson(response, 200, { ok: true })
        return
      }

      if (request.method === 'POST' && url.pathname === '/api/peer/assessment-submission') {
        const payload = await this.readJson<{ submission: AssessmentSubmissionRecord }>(request)
        this.receiveSubmission(payload.submission)
        this.writeJson(response, 200, { ok: true })
        return
      }

      this.writeJson(response, 404, { error: 'Not found' })
    })

    await new Promise<void>((resolve, reject) => {
      this.server?.listen(0, '0.0.0.0', () => {
        const addressInfo = this.server?.address()
        if (!addressInfo || typeof addressInfo === 'string') {
          reject(new Error('Unable to bind local backend server'))
          return
        }

        this.serverPort = addressInfo.port
        this.localAddress = this.getLocalIpAddress()
        resolve()
      })
      this.server?.on('error', reject)
    })
  }

  private async startDiscovery(): Promise<void> {
    this.discoverySocket = dgram.createSocket('udp4')

    this.discoverySocket.on('message', (buffer, remote) => {
      try {
        const payload = JSON.parse(buffer.toString()) as PeerHeartbeat
        if (payload.app !== 'ed-desk' || payload.peerId === this.peerId) {
          return
        }

        this.database.upsertPeer({
          id: payload.peerId,
          displayName: payload.displayName,
          address: remote.address,
          port: payload.port,
          status: 'online',
          transport: 'wifi',
          capabilities: payload.capabilities,
          lastSeen: Date.now()
        })
      } catch {
        // Ignore invalid datagrams.
      }
    })

    await new Promise<void>((resolve, reject) => {
      this.discoverySocket?.bind(this.discoveryPort, () => {
        try {
          this.discoverySocket?.setBroadcast(true)
          resolve()
        } catch (error) {
          reject(error)
        }
      })
      this.discoverySocket?.on('error', reject)
    })
  }

  private expirePeers(): void {
    const peers = this.database.listPeers()
    const now = Date.now()

    for (const peer of peers) {
      const status: PeerRecord['status'] = now - peer.lastSeen > 30000 ? 'stale' : 'online'
      if (status !== peer.status) {
        this.database.upsertPeer({
          ...peer,
          status
        })
      }
    }
  }

  private broadcastHeartbeat(): void {
    const payload: PeerHeartbeat = {
      app: 'ed-desk',
      peerId: this.peerId,
      displayName: this.displayName,
      port: this.serverPort,
      capabilities: ['chat', 'assessment', 'ledger'],
      timestamp: Date.now()
    }

    const message = Buffer.from(JSON.stringify(payload))
    this.discoverySocket?.send(message, this.discoveryPort, '255.255.255.255')
  }

  private async readJson<T>(request: IncomingMessage): Promise<T> {
    const chunks: Buffer[] = []
    for await (const chunk of request) {
      chunks.push(Buffer.from(chunk))
    }
    return JSON.parse(Buffer.concat(chunks).toString()) as T
  }

  private writeJson(response: http.ServerResponse, statusCode: number, payload: unknown): void {
    response.statusCode = statusCode
    response.setHeader('Content-Type', 'application/json')
    response.end(JSON.stringify(payload))
  }

  private async postJson<T>(peer: PeerRecord, path: string, payload: unknown): Promise<T> {
    return await new Promise<T>((resolve, reject) => {
      const request = http.request(
        {
          host: peer.address,
          port: peer.port,
          path,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 3000
        },
        async (response) => {
          const chunks: Buffer[] = []
          for await (const chunk of response) {
            chunks.push(Buffer.from(chunk))
          }
          resolve(JSON.parse(Buffer.concat(chunks).toString()) as T)
        }
      )

      request.on('error', reject)
      request.write(JSON.stringify(payload))
      request.end()
    })
  }

  private getLocalIpAddress(): string {
    const interfaces = os.networkInterfaces()
    for (const addrs of Object.values(interfaces)) {
      for (const addr of addrs ?? []) {
        if (addr.family === 'IPv4' && !addr.internal) {
          return addr.address
        }
      }
    }

    return '127.0.0.1'
  }

  getStatus(): BackendStatus {
    return {
      peerId: this.peerId,
      displayName: this.displayName,
      localAddress: this.localAddress,
      serverPort: this.serverPort,
      discoveryPort: this.discoveryPort,
      backendMode: 'offline-desktop',
      blockchainMode: 'hash-ledger',
      bluetoothSupported: false,
      wifiDiscoveryEnabled: true,
      peersOnline: this.listPeers().filter((peer) => peer.status === 'online').length,
      conversations: this.listConversations().length,
      assessments: this.listAssessments().length,
      recordsInLedger: this.listLedger().length
    }
  }

  getProfile(): { peerId: string; displayName: string } {
    return {
      peerId: this.peerId,
      displayName: this.displayName
    }
  }

  listPeers(): PeerRecord[] {
    return this.database.listPeers()
  }

  scanPeers(): PeerRecord[] {
    this.broadcastHeartbeat()
    return this.listPeers()
  }

  listConversations(): ConversationRecord[] {
    return this.database.listConversations()
  }

  getMessages(conversationId: string): ChatMessageRecord[] {
    this.database.markConversationRead(conversationId)
    return this.database.listMessages(conversationId)
  }

  async sendLanMessage(peerId: string, content: string): Promise<ChatMessageRecord> {
    const peer = this.database.getPeer(peerId)
    if (!peer) {
      throw new Error('Peer is not available on the local network.')
    }

    const conversation = this.database.ensureConversation(peer.id, peer.displayName)
    const createdAt = Date.now()
    const pendingMessage = this.database.addMessage({
      id: `msg-${randomUUID()}`,
      conversationId: conversation.id,
      peerId: peer.id,
      peerName: peer.displayName,
      senderName: this.displayName,
      recipientName: peer.displayName,
      content,
      direction: 'outgoing',
      transport: 'wifi',
      status: 'pending',
      createdAt
    })

    this.database.addLedgerRecord({
      entityType: 'message',
      entityId: pendingMessage.id,
      action: 'lan-send',
      payload: {
        peerId,
        contentLength: content.length
      }
    })

    try {
      await this.postJson(peer, '/api/peer/message', {
        peerId: this.peerId,
        peerName: this.displayName,
        recipientName: peer.displayName,
        content,
        timestamp: createdAt
      } satisfies PeerMessagePayload)

      const deliveredAt = Date.now()
      this.database.updateMessageStatus(pendingMessage.id, 'delivered', deliveredAt)
      return {
        ...pendingMessage,
        status: 'delivered',
        deliveredAt
      }
    } catch (error) {
      this.database.updateMessageStatus(pendingMessage.id, 'failed')
      throw error
    }
  }

  receivePeerMessage(payload: PeerMessagePayload): ChatMessageRecord {
    const peer = this.database.getPeer(payload.peerId) ?? {
      id: payload.peerId,
      displayName: payload.peerName,
      address: '',
      port: 0,
      status: 'online' as const,
      transport: 'wifi' as const,
      capabilities: ['chat'],
      lastSeen: Date.now()
    }

    const conversation = this.database.ensureConversation(peer.id, payload.peerName)
    const message = this.database.addMessage({
      id: `msg-${randomUUID()}`,
      conversationId: conversation.id,
      peerId: peer.id,
      peerName: payload.peerName,
      senderName: payload.peerName,
      recipientName: payload.recipientName,
      content: payload.content,
      direction: 'incoming',
      transport: 'wifi',
      status: 'delivered',
      createdAt: payload.timestamp,
      deliveredAt: Date.now()
    })

    this.database.addLedgerRecord({
      entityType: 'message',
      entityId: message.id,
      action: 'lan-receive',
      payload: {
        peerId: payload.peerId,
        contentLength: payload.content.length
      }
    })

    return message
  }

  async createAssessment(input: {
    title: string
    description: string
    creatorName?: string
    timeLimitMinutes: number
    sharedWithPeers: boolean
    questions: AssessmentQuestion[]
  }): Promise<AssessmentRecord> {
    const now = Date.now()
    const assessment: AssessmentRecord = {
      id: `assessment-${randomUUID()}`,
      code: Math.random().toString(36).slice(2, 8).toUpperCase(),
      title: input.title,
      description: input.description,
      creatorName: input.creatorName ?? this.displayName,
      hostPeerId: this.peerId,
      origin: 'local',
      status: 'active',
      timeLimitMinutes: input.timeLimitMinutes,
      sharedWithPeers: input.sharedWithPeers,
      createdAt: now,
      updatedAt: now,
      questions: input.questions
    }

    this.database.saveAssessment(assessment)
    this.database.addLedgerRecord({
      entityType: 'assessment',
      entityId: assessment.id,
      action: 'create',
      payload: {
        code: assessment.code,
        title: assessment.title,
        questions: assessment.questions.length
      }
    })

    if (assessment.sharedWithPeers) {
      const peers = this.listPeers().filter((peer) => peer.status === 'online')
      await Promise.allSettled(peers.map(async (peer) => {
        await this.postJson(peer, '/api/peer/assessment', { assessment })
      }))
    }

    return assessment
  }

  receivePeerAssessment(assessment: AssessmentRecord): void {
    const remoteAssessment: AssessmentRecord = {
      ...assessment,
      origin: 'remote',
      updatedAt: Date.now()
    }

    this.database.saveAssessment(remoteAssessment)
    this.database.addLedgerRecord({
      entityType: 'assessment',
      entityId: remoteAssessment.id,
      action: 'sync-in',
      payload: {
        code: remoteAssessment.code,
        hostPeerId: remoteAssessment.hostPeerId
      }
    })
  }

  listAssessments(): AssessmentRecord[] {
    return this.database.listAssessments()
  }

  listSubmissions(assessmentId: string): AssessmentSubmissionRecord[] {
    return this.database.listSubmissions(assessmentId)
  }

  async submitAssessment(input: {
    assessmentId: string
    participantName: string
    answers: Record<string, string>
  }): Promise<AssessmentSubmissionRecord> {
    const assessment = this.database.getAssessment(input.assessmentId)
    if (!assessment) {
      throw new Error('Assessment not found.')
    }

    const score = this.calculateScore(assessment.questions, input.answers)
    const submission: AssessmentSubmissionRecord = {
      id: `submission-${randomUUID()}`,
      assessmentId: assessment.id,
      participantName: input.participantName,
      answers: input.answers,
      score,
      submittedAt: Date.now(),
      status: assessment.origin === 'local' ? 'submitted' : 'synced'
    }

    this.database.saveSubmission(submission)
    this.database.addLedgerRecord({
      entityType: 'submission',
      entityId: submission.id,
      action: 'submit',
      payload: {
        assessmentId: submission.assessmentId,
        participantName: submission.participantName,
        score
      }
    })

    if (assessment.origin === 'remote') {
      const host = this.database.getPeer(assessment.hostPeerId)
      if (host) {
        await this.postJson(host, '/api/peer/assessment-submission', { submission })
      }
    }

    return submission
  }

  receiveSubmission(submission: AssessmentSubmissionRecord): void {
    this.database.saveSubmission(submission)
    this.database.addLedgerRecord({
      entityType: 'submission',
      entityId: submission.id,
      action: 'sync-in',
      payload: {
        assessmentId: submission.assessmentId,
        participantName: submission.participantName,
        score: submission.score
      }
    })
  }

  listLedger() {
    return this.database.listLedger()
  }

  private calculateScore(questions: AssessmentQuestion[], answers: Record<string, string>): number {
    let earned = 0
    let total = 0

    for (const question of questions) {
      total += question.points
      const expected = question.correctAnswer?.trim().toLowerCase()
      const actual = answers[question.id]?.trim().toLowerCase()
      if (expected && actual && expected === actual) {
        earned += question.points
      }
    }

    if (total === 0) {
      return 0
    }

    return Math.round((earned / total) * 100)
  }
}
