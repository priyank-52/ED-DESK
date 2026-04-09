import { contextBridge, ipcRenderer } from 'electron'

const electronAPI = {
  getFullSystemInfo: () => ipcRenderer.invoke('get-full-system-info'),
  getCPUHistory: () => ipcRenderer.invoke('get-cpu-history'),
  getNetworkSpeed: () => ipcRenderer.invoke('get-network-speed'),
  getPowerInfo: () => ipcRenderer.invoke('get-power-info'),
  getLocalIP: () => ipcRenderer.invoke('get-local-ip'),
  getBatteryHistory: () => ipcRenderer.invoke('get-battery-history'),
  getSystemLoad: () => ipcRenderer.invoke('get-system-load'),
  getNetworkInterfaces: () => ipcRenderer.invoke('get-network-interfaces'),
  demo: {
    ping: () => ipcRenderer.invoke('demo:ping')
  },
  offline: {
    getStatus: () => ipcRenderer.invoke('offline:get-status'),
    getProfile: () => ipcRenderer.invoke('offline:get-profile'),
    getPermissions: () => ipcRenderer.invoke('offline:get-permissions'),
    updatePermissions: (payload: unknown) => ipcRenderer.invoke('offline:update-permissions', payload),
    scanPeers: () => ipcRenderer.invoke('offline:scan-peers'),
    listPeers: () => ipcRenderer.invoke('offline:list-peers'),
    listSessions: () => ipcRenderer.invoke('offline:list-sessions'),
    getHostedSession: () => ipcRenderer.invoke('offline:get-hosted-session'),
    createHostedSession: (payload: unknown) => ipcRenderer.invoke('offline:create-hosted-session', payload),
    closeHostedSession: () => ipcRenderer.invoke('offline:close-hosted-session'),
    joinSessionByCode: (code: string, password?: string) => ipcRenderer.invoke('offline:join-session', code, password),
    listConversations: () => ipcRenderer.invoke('offline:list-conversations'),
    getMessages: (conversationId: string) => ipcRenderer.invoke('offline:get-messages', conversationId),
    sendMessage: (peerId: string, content: string) => ipcRenderer.invoke('offline:send-message', peerId, content),
    listAssessments: () => ipcRenderer.invoke('offline:list-assessments'),
    createAssessment: (payload: unknown) => ipcRenderer.invoke('offline:create-assessment', payload),
    submitAssessment: (payload: unknown) => ipcRenderer.invoke('offline:submit-assessment', payload),
    listSubmissions: (assessmentId: string) => ipcRenderer.invoke('offline:list-submissions', assessmentId),
    listLedger: () => ipcRenderer.invoke('offline:list-ledger')
  }
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)

export type IElectronAPI = typeof electronAPI
