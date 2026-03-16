export interface CPUInfo {
  manufacturer: string
  brand: string
  speed: number
  cores: number
  physicalCores: number
  usage: number
  temperature: number
  load: number
  cache: any
}

export interface MemoryInfo {
  total: number
  free: number
  used: number
  active: number
  available: number
  buffcache: number
  swaptotal: number
  swapused: number
  percent: number
}

export interface DiskInfo {
  fs: string
  size: number
  used: number
  available: number
  use: number
  mount: string
}

export interface OSInfo {
  platform: string
  distro: string
  release: string
  kernel: string
  arch: string
  hostname: string
  uptime: number
  build: string
  users: number
}

export interface NetworkInfo {
  iface: string
  ip4: string
  mac: string
  speed: number
  operstate: string
  type: string
  ssid?: string
  signal?: number
}

export interface BluetoothInfo {
  available: boolean
  enabled: boolean
  devices: Array<{ name: string; connected: boolean }>
}

export interface ProcessInfo {
  pid: number
  name: string
  cpu: number
  mem: number
}

export interface BatteryInfo {
  hasBattery: boolean
  percent: number
  discharging: boolean
  timeRemaining: number
}

export interface FullSystemInfo {
  cpu: CPUInfo
  memory: MemoryInfo
  disk: DiskInfo[]
  os: OSInfo
  network: NetworkInfo[]
  bluetooth: BluetoothInfo
  processes: ProcessInfo[]
  battery: BatteryInfo
  node: {
    version: string
    platform: string
    arch: string
    pid: number
    uptime: number
    memory: NodeJS.MemoryUsage
  }
}

export interface IElectronAPI {
  getFullSystemInfo: () => Promise<FullSystemInfo | null>
  getCPUHistory: () => Promise<number[]>
  getNetworkSpeed: () => Promise<{ rx: number; tx: number }>
  getPowerInfo: () => Promise<{ onBattery: boolean; level: number; charging: boolean }>
  getLocalIP: () => Promise<string>
  demo: {
    ping: () => Promise<string>
  }
}

declare global {
  interface Window {
    electronAPI: IElectronAPI
  }
}