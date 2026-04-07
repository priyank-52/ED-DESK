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
    scanPeers: () => ipcRenderer.invoke('offline:scan-peers'),
    listPeers: () => ipcRenderer.invoke('offline:list-peers'),
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
