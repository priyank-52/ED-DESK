import { contextBridge, ipcRenderer } from 'electron'

const api = {
  // System Info
  getFullSystemInfo: () => ipcRenderer.invoke('get-full-system-info'),
  getCPUHistory: () => ipcRenderer.invoke('get-cpu-history'),
  getNetworkSpeed: () => ipcRenderer.invoke('get-network-speed'),
  getPowerInfo: () => ipcRenderer.invoke('get-power-info'),
  
  // Network
  getLocalIP: () => ipcRenderer.invoke('get-local-ip'),
  
  // Demo
  demo: { 
    ping: () => ipcRenderer.invoke('demo:ping') 
  }
}

contextBridge.exposeInMainWorld('electronAPI', api)

export type ElectronAPI = typeof api

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}