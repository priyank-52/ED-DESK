// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react'

// ==================== TYPES ====================

interface CPUInfo {
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

interface MemoryInfo {
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

interface DiskInfo {
  fs: string
  size: number
  used: number
  available: number
  use: number
  mount: string
}

interface OSInfo {
  platform: string
  distro: string
  release: string
  kernel: string
  arch: string
  hostname: string
  uptime: number
  build: string
  users: number
  loadavg: number[]
}

interface NetworkInfo {
  iface: string
  ip4: string
  ip6?: string
  mac: string
  speed: number
  operstate: string
  type: string
  ssid?: string
  signal?: number
  channel?: number
  frequency?: number
}

interface BluetoothInfo {
  available: boolean
  enabled: boolean
  devices: Array<{ name: string; address: string; connected: boolean; battery?: number; type?: string }>
  adapter?: { name: string; version: string; mac: string }
}

interface ProcessInfo {
  pid: number
  name: string
  cpu: number
  mem: number
  threads?: number
  priority?: string
}

interface BatteryInfo {
  hasBattery: boolean
  percent: number
  discharging: boolean
  timeRemaining: number
  timeToFull: number
  voltage: number
  temperature: number
  dischargeRate: number
}

interface FullSystemInfo {
  cpu: CPUInfo
  memory: MemoryInfo
  disk: DiskInfo[]
  os: OSInfo
  network: NetworkInfo[]
  bluetooth: BluetoothInfo
  processes: ProcessInfo[]
  battery: BatteryInfo
  node: { pid: number; memory: NodeJS.MemoryUsage; version: string }
}

interface BlockchainNode {
  id: string
  name: string
  status: 'active' | 'syncing' | 'validating' | 'mining'
  blocks: number
  peers: number
  hash: string
  lastBlock: string
  transactions: number
  latency: number
  stake: number
  version: string
}

interface Transaction {
  id: string
  from: string
  to: string
  amount: number
  fee: number
  timestamp: Date
  status: 'pending' | 'confirmed' | 'finalized'
  hash: string
  block?: number
  confirmations: number
}

interface Block {
  height: number
  hash: string
  timestamp: Date
  transactions: number
  size: number
  miner: string
  difficulty: number
}

// ==================== COMPONENT ====================

export default function Home() {

  // ── State ──
  const [sys, setSys] = useState<FullSystemInfo | null>(null)
  const [cpuHistory, setCpuHistory] = useState<number[]>([])
  const [networkSpeed, setNetworkSpeed] = useState({ rx: 0, tx: 0 })
  const [time, setTime] = useState(new Date())
  const [logs, setLogs] = useState<string[]>([])

  const [nodes, setNodes] = useState<BlockchainNode[]>([
    { id: 'node-1', name: 'Validator Node 1', status: 'active', blocks: 1245678, peers: 24, hash: '0x7f83b1657ff1fc53b92dc18148a1d65d7f83b165', lastBlock: '0x3a5e7f8b9c1d2e3f', transactions: 156, latency: 45, stake: 150000, version: 'v2.1.4' },
    { id: 'node-2', name: 'Validator Node 2', status: 'validating', blocks: 1245678, peers: 22, hash: '0x9f86d081884c7d659a2feaa0c55ad0159f86d081', lastBlock: '0x8c2d4e6f8a0b2c4d', transactions: 142, latency: 52, stake: 145000, version: 'v2.1.4' },
    { id: 'node-3', name: 'Mining Node', status: 'mining', blocks: 1245677, peers: 18, hash: '0x4b68ab3847feda7d6c62c1fbcbeebfa34b68ab38', lastBlock: '0x1f4b7e9a2c5d8f0b', transactions: 98, latency: 78, stake: 95000, version: 'v2.1.3' },
    { id: 'node-4', name: 'Light Client', status: 'syncing', blocks: 1245670, peers: 12, hash: '0x2c6b8c5d8f5d4c3b2a1f0e9d8c7b6a52c6b8c5d', lastBlock: '0x5e7a9b1c3d5f7a9b', transactions: 0, latency: 120, stake: 10000, version: 'v2.0.1' },
    { id: 'node-5', name: 'Archive Node', status: 'active', blocks: 1245678, peers: 32, hash: '0x8d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a8d5c4b3a', lastBlock: '0x2a4c6e8f0b2d4f6a', transactions: 1240, latency: 38, stake: 250000, version: 'v2.2.0' },
  ])

  const [transactions, setTransactions] = useState<Transaction[]>([
    { id: 'tx-1', from: '0x7f83...d65d', to: '0x9f86...d015', amount: 25.5, fee: 0.0025, timestamp: new Date(Date.now() - 120000), status: 'finalized', hash: '0x3a5e7f8b9c1d2e3f4a5b6c7d8e9f0a1b', block: 1245678, confirmations: 124 },
    { id: 'tx-2', from: '0x4b68...bfa3', to: '0x2c6b...b6a5', amount: 10.2, fee: 0.0018, timestamp: new Date(Date.now() - 60000), status: 'confirmed', hash: '0x8c2d4e6f8a0b2c4d6e8f0a2b4c6d8e0', block: 1245679, confirmations: 42 },
    { id: 'tx-3', from: '0x7f83...d65d', to: '0x2c6b...b6a5', amount: 5.7, fee: 0.0012, timestamp: new Date(Date.now() - 30000), status: 'confirmed', hash: '0x1f4b7e9a2c5d8f0b3e6a9c2d5f8b1e4', block: 1245679, confirmations: 38 },
    { id: 'tx-4', from: '0x9f86...d015', to: '0x4b68...bfa3', amount: 15.3, fee: 0.0022, timestamp: new Date(Date.now() - 15000), status: 'pending', hash: '0x4c7d9e1f2a3b4c5d6e7f8a9b0c1d2e3f', confirmations: 0 },
    { id: 'tx-5', from: '0x2c6b...b6a5', to: '0x7f83...d65d', amount: 8.9, fee: 0.0015, timestamp: new Date(Date.now() - 5000), status: 'pending', hash: '0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d', confirmations: 0 },
  ])

  const [blocks, setBlocks] = useState<Block[]>([
    { height: 1245678, hash: '0x3a5e7f8b9c1d2e3f4a5b6c7d8e9f0a1b', timestamp: new Date(Date.now() - 180000), transactions: 156, size: 2450, miner: '0x7f83...d65d', difficulty: 17500000000 },
    { height: 1245677, hash: '0x8c2d4e6f8a0b2c4d6e8f0a2b4c6d8e0', timestamp: new Date(Date.now() - 360000), transactions: 142, size: 2320, miner: '0x9f86...d015', difficulty: 17450000000 },
    { height: 1245676, hash: '0x1f4b7e9a2c5d8f0b3e6a9c2d5f8b1e4', timestamp: new Date(Date.now() - 540000), transactions: 168, size: 2510, miner: '0x4b68...bfa3', difficulty: 17400000000 },
  ])

  // ── Effects ──

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Real system data via Electron IPC
  useEffect(() => {
    const fetchSystem = async () => {
      try {
        const data = await window.electronAPI.getFullSystemInfo()
        if (data) {
          setSys(data)
          setLogs([`[${new Date().toLocaleTimeString('en-US', { hour12: false })}] System updated`])
        }
        const history = await window.electronAPI.getCPUHistory()
        setCpuHistory(history)
        const speed = await window.electronAPI.getNetworkSpeed()
        setNetworkSpeed(speed)
      } catch (error) {
        console.error('System fetch failed:', error)
        setLogs([`[${new Date().toLocaleTimeString('en-US', { hour12: false })}] Error fetching system data`])
      }
    }
    fetchSystem()
    const interval = setInterval(fetchSystem, 2000)
    return () => clearInterval(interval)
  }, [])

  // Live blockchain simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setNodes(prev => prev.map(node => {
        const statuses: ('active' | 'syncing' | 'validating' | 'mining')[] = ['active', 'syncing', 'validating', 'mining']
        return {
          ...node,
          status: Math.random() > 0.8 ? statuses[Math.floor(Math.random() * statuses.length)] : node.status,
          blocks: node.blocks + (Math.random() > 0.95 ? 1 : 0),
          transactions: node.transactions + (Math.random() > 0.7 ? Math.floor(Math.random() * 3) : 0),
          latency: Math.max(10, node.latency + (Math.random() > 0.5 ? -1 : 1) * Math.floor(Math.random() * 5)),
        }
      }))
      setTransactions(prev => prev.map(tx => {
        if (tx.status === 'pending' && Math.random() > 0.4) return { ...tx, status: 'confirmed' as const, block: blocks[0].height + 1, confirmations: 1 }
        if (tx.status === 'confirmed' && tx.confirmations < 100 && Math.random() > 0.7) return { ...tx, confirmations: tx.confirmations + 1 }
        return tx
      }))
      if (Math.random() > 0.7) {
        const fromNodes = nodes.map(n => n.hash.slice(0, 10))
        const toNodes = nodes.map(n => n.hash.slice(0, 10))
        setTransactions(prev => [{ id: `tx-${Date.now()}`, from: fromNodes[Math.floor(Math.random() * fromNodes.length)], to: toNodes[Math.floor(Math.random() * toNodes.length)], amount: Math.random() * 50, fee: Math.random() * 0.005, timestamp: new Date(), status: 'pending', hash: `0x${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`, confirmations: 0 }, ...prev.slice(0, 19)])
      }
      if (Math.random() > 0.8) {
        setBlocks(prev => [{ height: prev[0].height + 1, hash: `0x${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`, timestamp: new Date(), transactions: Math.floor(Math.random() * 200) + 100, size: Math.floor(Math.random() * 1000) + 2000, miner: nodes[Math.floor(Math.random() * nodes.length)].hash.slice(0, 10), difficulty: prev[0].difficulty + Math.floor(Math.random() * 100000000) }, ...prev.slice(0, 9)])
      }
    }, 8000)
    return () => clearInterval(interval)
  }, [blocks, nodes])

  // ── Utilities ──

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`
  }

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (days > 0) return `${days}d ${hours}h ${minutes}m`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const formatTime = (date: Date): string =>
    date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })

  const formatHash = (hash: string): string =>
    hash.length <= 12 ? hash : `${hash.slice(0, 8)}...${hash.slice(-4)}`

  // ── Loading screen ──
  if (!sys) {
    return (
      <div className="h-loading">
        <div className="h-loading-spinner" />
        <div className="h-loading-text">INITIALIZING ED-DESK...</div>
        <div className="h-loading-sub">Connecting to system IPC</div>
        <style>{`
          .h-loading {
            height: calc(100vh - 56px);
            background: #030303;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-family: 'SF Mono', 'Monaco', 'Fira Code', monospace;
            gap: 12px;
          }
          .h-loading-spinner {
            width: 36px; height: 36px;
            border: 2px solid #1e3a5f;
            border-top-color: transparent;
            border-radius: 50%;
            animation: hspin 1s linear infinite;
          }
          .h-loading-text { font-size: 12px; letter-spacing: 2px; color: #1e3a5f; }
          .h-loading-sub { font-size: 8px; opacity: 0.35; letter-spacing: 1px; }
          @keyframes hspin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    )
  }

  // Find WiFi interface
  const wifi = sys.network.find(n => n.type === 'wireless' || n.iface.toLowerCase().includes('wlan')) || {
    iface: 'Wi-Fi', ip4: '0.0.0.0', mac: '00:00:00:00:00:00', speed: 0,
    operstate: 'down', type: 'wireless', ssid: 'No Connection', signal: 0
  }

  return (
    <div className="h-app">

      {/* ── ASCII HEADER — flush below navbar, no margin ── */}
      <div className="h-ascii-header">
        <pre className="h-glitch">{`  ███████╗██████╗       ██████╗ ███████╗███████╗██╗  ██╗
  ██╔════╝██╔══██╗      ██╔══██╗██╔════╝██╔════╝██║ ██╔╝
  █████╗  ██║  ██║█████╗██║  ██║█████╗  ███████╗█████╔╝ 
  ██╔══╝  ██║  ██║╚════╝██║  ██║██╔══╝  ╚════██║██╔═██╗ 
  ███████╗██████╔╝      ██████╔╝███████╗███████║██║  ██╗
  ╚══════╝╚═════╝       ╚═════╝ ╚══════╝╚══════╝╚═╝  ╚═╝`}</pre>
        <div className="h-header-info">
          <span className="h-version">v1.0.0</span>
          <span className="h-time">{formatTime(time)}</span>
          <div className="h-log-box">
            <span className="h-log-msg">{logs[0] || '[System ready]'}</span>
          </div>
        </div>
      </div>

      {/* ── SYSTEM MONITOR DASHBOARD ── */}
      <div className="h-dashboard">

        {/* CPU */}
        <div className="h-card">
          <div className="h-card-head">
            <span className="h-card-title">CPU</span>
            <span className="h-card-val">{sys.cpu.usage}%</span>
          </div>
          <div className="h-card-body">
            <div className="h-row"><span>MODEL</span><span className="h-truncate">{sys.cpu.brand}</span></div>
            <div className="h-row"><span>CORES</span><span>{sys.cpu.cores} ({sys.cpu.physicalCores}P)</span></div>
            <div className="h-row"><span>SPEED</span><span>{sys.cpu.speed} MHz</span></div>
            <div className="h-row"><span>TEMP</span><span className={sys.cpu.temperature > 80 ? 'h-warn' : ''}>{sys.cpu.temperature}°C</span></div>
            <div className="h-bar"><div className="h-bar-fill" style={{ width: `${sys.cpu.usage}%` }} /></div>
            <div className="h-sparkline">
              {cpuHistory.slice(-20).map((v, i) => (
                <div key={i} className="h-spark" style={{ height: `${Math.max(2, v)}%` }} />
              ))}
            </div>
          </div>
        </div>

        {/* Memory */}
        <div className="h-card">
          <div className="h-card-head">
            <span className="h-card-title">MEMORY</span>
            <span className="h-card-val">{(sys.memory.used / 1024 / 1024 / 1024).toFixed(1)} GB</span>
          </div>
          <div className="h-card-body">
            <div className="h-row"><span>TOTAL</span><span>{formatBytes(sys.memory.total)}</span></div>
            <div className="h-row"><span>USED</span><span>{formatBytes(sys.memory.used)}</span></div>
            <div className="h-row"><span>FREE</span><span>{formatBytes(sys.memory.free)}</span></div>
            <div className="h-row"><span>CACHED</span><span>{formatBytes(sys.memory.buffcache)}</span></div>
            <div className="h-bar"><div className="h-bar-fill" style={{ width: `${sys.memory.percent}%` }} /></div>
            <div className="h-row h-small"><span>SWAP TOTAL</span><span>{formatBytes(sys.memory.swaptotal)}</span></div>
          </div>
        </div>

        {/* Disk */}
        <div className="h-card">
          <div className="h-card-head">
            <span className="h-card-title">DISK</span>
            <span className="h-card-val">{sys.disk[0]?.use || 0}%</span>
          </div>
          <div className="h-card-body">
            {sys.disk.slice(0, 3).map((disk, i) => (
              <div key={i} className="h-disk-item">
                <div className="h-row h-small">
                  <span>{disk.fs}</span>
                  <span>{formatBytes(disk.used)} / {formatBytes(disk.size)}</span>
                </div>
                <div className="h-mini-bar">
                  <div className="h-mini-fill" style={{ width: `${disk.use}%`, background: disk.use > 85 ? '#c86060' : '#1e3a5f' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Network */}
        <div className="h-card">
          <div className="h-card-head">
            <span className="h-card-title">NETWORK</span>
            <span className="h-card-val">↓{(networkSpeed.rx / 1024).toFixed(0)}K</span>
          </div>
          <div className="h-card-body">
            <div className="h-net-sec">
              <div className="h-row">
                <span>Wi-Fi</span>
                <span className={`h-badge ${wifi.operstate === 'up' ? 'h-badge-on' : 'h-badge-off'}`}>
                  {wifi.operstate === 'up' ? 'ON' : 'OFF'}
                </span>
              </div>
              <div className="h-row h-small"><span>{wifi.ip4}</span><span>{wifi.speed} Mbps</span></div>
              <div className="h-row h-small"><span className="h-mono">{wifi.mac}</span>{wifi.ssid && <span>{wifi.ssid}</span>}</div>
              {wifi.channel && <div className="h-row h-small"><span>Ch {wifi.channel}</span><span>{wifi.frequency}GHz</span></div>}
            </div>
            <div className="h-net-sec">
              <div className="h-row">
                <span>BLUETOOTH</span>
                <span className={`h-badge ${sys.bluetooth.enabled ? 'h-badge-on' : 'h-badge-off'}`}>
                  {sys.bluetooth.enabled ? 'ON' : 'OFF'}
                </span>
              </div>
              <div className="h-row h-small">
                <span>DEVICES</span>
                <span>{sys.bluetooth.devices.filter(d => d.connected).length} connected</span>
              </div>
            </div>
            <div className="h-row h-small"><span>RX</span><span>{formatBytes(networkSpeed.rx)}/s</span></div>
            <div className="h-row h-small"><span>TX</span><span>{formatBytes(networkSpeed.tx)}/s</span></div>
          </div>
        </div>

        {/* System */}
        <div className="h-card">
          <div className="h-card-head">
            <span className="h-card-title">SYSTEM</span>
            <span className="h-card-val">{sys.os.platform}</span>
          </div>
          <div className="h-card-body">
            <div className="h-row"><span>OS</span><span className="h-truncate">{sys.os.distro}</span></div>
            <div className="h-row"><span>KERNEL</span><span className="h-truncate">{sys.os.kernel}</span></div>
            <div className="h-row"><span>ARCH</span><span>{sys.os.arch}</span></div>
            <div className="h-row"><span>HOSTNAME</span><span className="h-truncate">{sys.os.hostname}</span></div>
            <div className="h-row"><span>USERS</span><span>{sys.os.users}</span></div>
            <div className="h-row"><span>LOAD 1m</span><span>{sys.os.loadavg[0].toFixed(2)}</span></div>
          </div>
        </div>

        {/* Processes */}
        <div className="h-card">
          <div className="h-card-head">
            <span className="h-card-title">PROCESSES</span>
            <span className="h-card-val">PID • CPU</span>
          </div>
          <div className="h-card-body">
            {sys.processes.slice(0, 5).map((proc, i) => (
              <div key={i} className="h-proc-row">
                <span className="h-proc-pid">{proc.pid}</span>
                <span className="h-proc-name">{proc.name}</span>
                <div className="h-proc-right">
                  <span className="h-proc-cpu">{proc.cpu.toFixed(1)}%</span>
                  <div className="h-proc-bar"><div className="h-proc-fill" style={{ width: `${Math.min(proc.cpu * 4, 100)}%` }} /></div>
                </div>
              </div>
            ))}
            <div className="h-row h-small" style={{ marginTop: 4 }}>
              <span>THREADS TOTAL</span>
              <span>{sys.processes.reduce((a, p) => a + (p.threads || 1), 0)}</span>
            </div>
          </div>
        </div>

        {/* Battery */}
        <div className="h-card">
          <div className="h-card-head">
            <span className="h-card-title">BATTERY</span>
            <span className="h-card-val">{sys.battery.hasBattery ? `${sys.battery.percent}%` : 'AC'}</span>
          </div>
          <div className="h-card-body">
            {sys.battery.hasBattery ? (
              <>
                <div className="h-row">
                  <span>STATUS</span>
                  <span className={sys.battery.discharging ? 'h-warn-soft' : 'h-ok'}>{sys.battery.discharging ? 'DISCHARGING' : 'CHARGING'}</span>
                </div>
                <div className="h-row"><span>REMAINING</span><span>{Math.floor(sys.battery.timeRemaining / 60)} min</span></div>
                {!sys.battery.discharging && sys.battery.timeToFull > 0 && (
                  <div className="h-row"><span>TO FULL</span><span>{Math.floor(sys.battery.timeToFull / 60)} min</span></div>
                )}
                <div className="h-row"><span>VOLTAGE</span><span>{sys.battery.voltage}V</span></div>
                <div className="h-row"><span>TEMP</span><span>{sys.battery.temperature}°C</span></div>
                {sys.battery.discharging && <div className="h-row"><span>DISCHARGE</span><span>{sys.battery.dischargeRate} W</span></div>}
                <div className="h-bar" style={{ marginTop: 6 }}>
                  <div className="h-bar-fill" style={{ width: `${sys.battery.percent}%`, background: sys.battery.percent < 20 ? '#c86060' : sys.battery.percent < 40 ? '#c8964a' : '#1e3a5f' }} />
                </div>
              </>
            ) : (
              <>
                <div className="h-row"><span>POWER</span><span className="h-ok">AC • 230V</span></div>
                <div className="h-row h-small"><span>BATTERY</span><span>Not detected</span></div>
              </>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="h-card">
          <div className="h-card-head">
            <span className="h-card-title">STATUS</span>
            <span className="h-card-val h-ok">ONLINE</span>
          </div>
          <div className="h-card-body">
            <div className="h-row"><span>UPTIME</span><span>{formatUptime(sys.os.uptime)}</span></div>
            <div className="h-row"><span>PID</span><span>{sys.node.pid}</span></div>
            <div className="h-row"><span>HEAP</span><span>{formatBytes(sys.node.memory.heapUsed)}</span></div>
            <div className="h-row"><span>RSS</span><span>{formatBytes(sys.node.memory.rss)}</span></div>
            <div className="h-row"><span>NODE</span><span>{sys.node.version}</span></div>
            <div className="h-row h-small"><span>LOAD 5m</span><span>{sys.os.loadavg[1].toFixed(2)}</span></div>
            <div className="h-row h-small"><span>LOAD 15m</span><span>{sys.os.loadavg[2].toFixed(2)}</span></div>
          </div>
        </div>

      </div>

      {/* ── BLOCKCHAIN SECTION ── */}
      <div className="h-blockchain">
        <div className="h-bc-header">
          <div>
            <h3 className="h-bc-title">BLOCKCHAIN NETWORK • END-TO-END ENCRYPTION</h3>
            <div className="h-bc-sub">Live network monitoring • AES-256-GCM • ECDSA verified</div>
          </div>
          <div className="h-bc-stats">
            <div className="h-bc-stat"><span>ACTIVE NODES</span><span>{nodes.filter(n => n.status === 'active').length}</span></div>
            <div className="h-bc-stat"><span>TOTAL BLOCKS</span><span>{nodes[0].blocks.toLocaleString()}</span></div>
            <div className="h-bc-stat"><span>PENDING TX</span><span>{transactions.filter(t => t.status === 'pending').length}</span></div>
            <div className="h-bc-stat"><span>NETWORK HASH</span><span>2.45 PH/s</span></div>
          </div>
        </div>

        {/* Nodes */}
        <div className="h-nodes">
          {nodes.map((node, idx) => (
            <div key={node.id} className="h-node-card">
              <div className="h-node-head">
                <span className="h-node-name">{node.name}</span>
                <span className={`h-node-status h-ns-${node.status}`}>{node.status}</span>
              </div>
              <div className="h-node-body">
                <div className="h-node-row"><span>Blocks</span><span>{node.blocks.toLocaleString()}</span></div>
                <div className="h-node-row"><span>Peers</span><span>{node.peers}</span></div>
                <div className="h-node-row"><span>TX Pool</span><span>{node.transactions}</span></div>
                <div className="h-node-row"><span>Latency</span><span className={node.latency > 100 ? 'h-warn-soft' : ''}>{node.latency}ms</span></div>
                <div className="h-node-row"><span>Stake</span><span>{(node.stake / 1000).toFixed(1)}K</span></div>
                <div className="h-node-row"><span>Hash</span><span className="h-mono">{formatHash(node.hash)}</span></div>
                <div className="h-node-row"><span>Last Block</span><span className="h-mono">{node.lastBlock}</span></div>
                <div className="h-node-row"><span>Version</span><span className="h-mono">{node.version}</span></div>
              </div>
              {idx < nodes.length - 1 && (
                <div className="h-conn-line">
                  <div className="h-conn-track" />
                  <div className="h-packet" />
                  <div className="h-packet h-pk-d1" />
                  <div className="h-packet h-pk-d2" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Recent Blocks + TX Pool side by side */}
        <div className="h-bc-bottom">
          <div className="h-recent-blocks">
            <h4 className="h-sec-title">RECENT BLOCKS</h4>
            <div className="h-blocks-grid">
              {blocks.slice(0, 3).map(block => (
                <div key={block.height} className="h-block-item">
                  <div className="h-block-head">
                    <span className="h-block-height">#{block.height}</span>
                    <span className="h-block-time">{formatTime(block.timestamp)}</span>
                  </div>
                  <div className="h-block-details">
                    <span className="h-mono">{formatHash(block.hash)}</span>
                    <span>{block.transactions} tx</span>
                    <span className="h-mono">{formatHash(block.miner)}</span>
                  </div>
                  <div className="h-block-meta">{block.size} KB • Diff {Math.floor(block.difficulty / 1e9)}B</div>
                </div>
              ))}
            </div>
          </div>

          <div className="h-tx-pool">
            <h4 className="h-sec-title">LIVE TRANSACTION POOL</h4>
            <div className="h-tx-list">
              {transactions.slice(0, 5).map(tx => (
                <div key={tx.id} className={`h-tx-item h-tx-${tx.status}`}>
                  <div className="h-tx-head">
                    <span className="h-mono">{formatHash(tx.hash)}</span>
                    <span className={`h-tx-badge h-txb-${tx.status}`}>{tx.status}</span>
                  </div>
                  <div className="h-tx-body">
                    <span>{formatHash(tx.from)} → {formatHash(tx.to)}</span>
                    <span className="h-tx-amount">{tx.amount.toFixed(2)} ETH</span>
                  </div>
                  <div className="h-tx-meta">
                    <span>Fee: {tx.fee.toFixed(4)}</span>
                    {tx.block && <span>Block #{tx.block}</span>}
                    {tx.confirmations > 0 && <span>{tx.confirmations} conf</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Encryption explanation */}
        <div className="h-expl">
          <h4 className="h-sec-title">HOW END-TO-END ENCRYPTION WORKS WITH BLOCKCHAIN</h4>
          <div className="h-expl-grid">
            {[
              { title: 'End-to-End Encryption', body: 'Messages are encrypted on your device using AES-256-GCM. Only the recipient private key can decrypt the content. Blockchain nodes verify integrity without accessing data.' },
              { title: 'Blockchain Verification', body: 'Each message creates a SHA-3 hash stored on the blockchain. The hash provides immutable proof of sending, timestamp, and integrity without exposing actual content.' },
              { title: 'Peer-to-Peer Network', body: 'Messages travel through 5-7 validator nodes. Each node verifies the hash signature using ECDSA, contributing to consensus without any decryption capability.' },
              { title: 'Smart Contract Validation', body: 'Smart contracts automatically verify message delivery and trigger actions when conditions are met. All contract executions are recorded permanently on-chain.' },
            ].map(card => (
              <div key={card.title} className="h-expl-card">
                <h5>{card.title}</h5>
                <p>{card.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Network metrics */}
        <div className="h-metrics">
          <div className="h-metric"><span>TOTAL TRANSACTIONS</span><span>{(1245678 * 156).toLocaleString()}</span></div>
          <div className="h-metric"><span>AVG BLOCK TIME</span><span>12.4s</span></div>
          <div className="h-metric"><span>NETWORK DIFFICULTY</span><span>17.5 GH</span></div>
          <div className="h-metric"><span>TOTAL STAKE</span><span>650K ETH</span></div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div className="h-footer">
        <span>POWERED BY BLOCKCHAIN • END-TO-END ENCRYPTED • KK PROFESSIONAL</span>
      </div>

      {/* Scan line */}
      <div className="h-scan-line" />

      {/* ══════════════════════════════════════════════════════
          STYLES
      ══════════════════════════════════════════════════════ */}
      <style>{`
        * { margin:0; padding:0; box-sizing:border-box; }

        /* ── ROOT: flush below navbar, matches other pages ── */
        .h-app {
          background: #030303;
          color: #ffffff;
          font-family: 'SF Mono','Monaco','Fira Code',monospace;
          font-size: 11px;
          display: flex;
          flex-direction: column;
          /* NO padding-top — starts flush at navbar edge */
          padding: 0;
          gap: 1px;
          min-height: calc(100vh - 56px);
          overflow-x: hidden;
          overflow-y: auto;
          position: relative;
        }

        /* Scrollbar — same as Quiz / Poll */
        .h-app::-webkit-scrollbar { width:4px; height:4px; }
        .h-app::-webkit-scrollbar-track { background:#111; }
        .h-app::-webkit-scrollbar-thumb { background:#222; border-radius:2px; }
        .h-app::-webkit-scrollbar-thumb:hover { background:#1e3a5f; }
        * { scrollbar-width:thin; scrollbar-color:#222 #111; }

        /* ── ASCII HEADER — no top margin, starts immediately ── */
        .h-ascii-header {
          background: #0a0a0a;
          border-bottom: 1px solid #1e3a5f;
          border-left: none;
          border-right: none;
          border-top: none;
          padding: 12px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: relative;
          overflow: hidden;
          flex-shrink: 0;
        }
        .h-ascii-header::before {
          content: '';
          position: absolute;
          top: 0; left: -100%; width: 100%; height: 2px;
          background: linear-gradient(90deg, transparent, #1e3a5f, transparent);
          animation: h-scanline 3s linear infinite;
        }
        @keyframes h-scanline { 0%{left:-100%} 100%{left:100%} }

        .h-glitch {
          color: #1e3a5f;
          font-size: 7px;
          line-height: 1.2;
          text-shadow: 0 0 6px rgba(30,58,95,0.8);
          white-space: pre;
          letter-spacing: 0.3px;
        }

        .h-header-info {
          display: flex;
          gap: 14px;
          align-items: center;
          background: #050505;
          padding: 6px 12px;
          border: 1px solid #1e3a5f;
          flex-shrink: 0;
        }
        .h-version { color: #1e3a5f; font-size: 9px; }
        .h-time { color: #ffffff; font-size: 10px; font-weight: 600; }
        .h-log-box { border-left: 1px solid #1e3a5f; padding-left: 12px; }
        .h-log-msg { color: #fff; font-size: 9px; opacity: 0.7; animation: h-fade 0.3s ease; }
        @keyframes h-fade { from{opacity:0;transform:translateX(8px)} to{opacity:1;transform:translateX(0)} }

        /* ── DASHBOARD GRID — tight 8-column, no outer gaps ── */
        .h-dashboard {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1px;
          background: #1e3a5f;
          flex-shrink: 0;
        }

        .h-card {
          background: #0a0a0a;
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 7px;
          min-height: 155px;
          transition: background 0.2s, box-shadow 0.2s;
        }
        .h-card:hover {
          background: #0d0d0d;
          box-shadow: inset 0 0 0 1px rgba(30,58,95,0.4);
        }

        .h-card-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 6px;
          border-bottom: 1px solid #1e3a5f;
        }
        .h-card-title { font-size: 9px; letter-spacing: 1.2px; opacity: 0.65; }
        .h-card-val { font-size: 13px; font-weight: 700; }

        .h-card-body { flex: 1; display: flex; flex-direction: column; gap: 4px; }

        .h-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 9px;
        }
        .h-row span:first-child { opacity: 0.45; }
        .h-small { font-size: 8px; opacity: 0.6; }

        .h-truncate { max-width: 110px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .h-mono { font-family: monospace; opacity: 0.75; font-size: 8px; }

        .h-bar { height: 3px; background: #1a1a1a; overflow: hidden; margin-top: 3px; }
        .h-bar-fill { height: 100%; background: #1e3a5f; transition: width 0.4s; }
        .h-mini-bar { height: 2px; background: #1a1a1a; margin: 1px 0; }
        .h-mini-fill { height: 100%; transition: width 0.4s; }

        .h-sparkline {
          display: flex;
          align-items: flex-end;
          gap: 1px;
          height: 18px;
          margin-top: 3px;
        }
        .h-spark { flex: 1; background: #1e3a5f; opacity: 0.55; transition: height 0.4s; min-height: 2px; }

        .h-disk-item { margin-bottom: 3px; }
        .h-net-sec { margin-bottom: 6px; padding-bottom: 4px; border-bottom: 1px dotted #1e3a5f; }
        .h-net-sec:last-of-type { border-bottom: none; }

        .h-badge { font-size: 7px; padding: 1px 6px; border-radius: 1px; }
        .h-badge-on { background: rgba(30,58,95,0.35); border: 1px solid rgba(30,58,95,0.5); }
        .h-badge-off { background: rgba(80,80,80,0.25); border: 1px solid #333; opacity: 0.6; }

        .h-proc-row {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 8px;
          padding: 2px 0;
          border-bottom: 1px dotted #111;
        }
        .h-proc-pid { width: 32px; opacity: 0.4; flex-shrink: 0; font-family: monospace; }
        .h-proc-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .h-proc-right { display: flex; align-items: center; gap: 5px; flex-shrink: 0; }
        .h-proc-cpu { font-size: 8px; width: 30px; text-align: right; }
        .h-proc-bar { width: 36px; height: 2px; background: #1a1a1a; }
        .h-proc-fill { height: 100%; background: #1e3a5f; }

        .h-warn { color: #c86060; }
        .h-warn-soft { color: #c8964a; }
        .h-ok { color: #6dba72; }

        /* ── BLOCKCHAIN SECTION ── */
        .h-blockchain {
          background: #0a0a0a;
          border-top: 1px solid #1e3a5f;
          padding: 18px 20px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .h-bc-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding-bottom: 14px;
          border-bottom: 1px solid #1e3a5f;
        }
        .h-bc-title { font-size: 11px; font-weight: 700; letter-spacing: 1px; margin-bottom: 3px; }
        .h-bc-sub { font-size: 7px; opacity: 0.35; letter-spacing: 0.5px; }
        .h-bc-stats { display: flex; gap: 20px; }
        .h-bc-stat { display: flex; flex-direction: column; align-items: flex-end; }
        .h-bc-stat span:first-child { font-size: 7px; opacity: 0.45; letter-spacing: 0.5px; margin-bottom: 2px; }
        .h-bc-stat span:last-child { font-size: 15px; font-weight: 700; }

        /* Node cards */
        .h-nodes {
          display: flex;
          justify-content: space-between;
          align-items: stretch;
          gap: 1px;
          background: #1e3a5f;
        }
        .h-node-card {
          background: #0d0d0d;
          padding: 12px;
          flex: 1;
          position: relative;
          transition: background 0.2s;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .h-node-card:hover { background: #111; }

        .h-node-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 5px;
          border-bottom: 1px solid #1e3a5f;
        }
        .h-node-name { font-size: 9px; font-weight: 600; }
        .h-node-status {
          font-size: 7px; padding: 1px 5px; border-radius: 1px;
          letter-spacing: 0.5px; text-transform: uppercase;
        }
        .h-ns-active     { background: rgba(30,58,95,0.4); color: #6ab4ff; }
        .h-ns-validating { background: rgba(30,58,95,0.6); color: #6ab4ff; }
        .h-ns-mining     { background: rgba(200,150,50,0.25); color: #c8964a; }
        .h-ns-syncing    { background: rgba(80,80,80,0.3); color: #888; }

        .h-node-body { display: flex; flex-direction: column; gap: 3px; }
        .h-node-row { display: flex; justify-content: space-between; font-size: 8px; }
        .h-node-row span:first-child { opacity: 0.4; }

        .h-conn-line {
          position: absolute;
          top: 50%; right: -1px;
          width: 1px; height: 40px;
          transform: translateY(-50%);
          background: rgba(30,58,95,0.4);
          display: flex;
          align-items: flex-start;
          overflow: visible;
        }
        .h-conn-track { position: absolute; top: 50%; left: 0; right: 0; height: 1px; background: #1e3a5f; }
        .h-packet {
          position: absolute; top: 50%; left: 0;
          width: 4px; height: 4px; margin-top: -2px;
          background: #6ab4ff; border-radius: 50%;
          animation: h-pkt 2.5s linear infinite;
        }
        .h-pk-d1 { animation-delay: 0.8s; opacity: 0.7; }
        .h-pk-d2 { animation-delay: 1.6s; opacity: 0.4; }
        @keyframes h-pkt {
          0%   { left: 0; opacity: 1; }
          100% { left: calc(100% + 40px); opacity: 0; }
        }

        /* Bottom row: blocks + TX */
        .h-bc-bottom {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1px;
          background: #1e3a5f;
        }

        .h-recent-blocks, .h-tx-pool {
          background: #0d0d0d;
          padding: 14px;
        }

        .h-sec-title {
          font-size: 9px;
          letter-spacing: 1.5px;
          opacity: 0.5;
          margin-bottom: 10px;
        }

        .h-blocks-grid { display: flex; flex-direction: column; gap: 6px; }
        .h-block-item {
          background: #080808;
          border: 1px solid #1e3a5f;
          padding: 8px 10px;
        }
        .h-block-head { display: flex; justify-content: space-between; margin-bottom: 4px; padding-bottom: 3px; border-bottom: 1px dotted #1e3a5f; }
        .h-block-height { font-size: 10px; font-weight: 700; }
        .h-block-time { font-size: 7px; opacity: 0.45; }
        .h-block-details { display: flex; justify-content: space-between; font-size: 8px; margin-bottom: 3px; opacity: 0.75; }
        .h-block-meta { font-size: 7px; opacity: 0.35; }

        .h-tx-list { display: flex; flex-direction: column; gap: 5px; }
        .h-tx-item { background: #080808; padding: 8px 10px; border-left: 2px solid #1e3a5f; transition: background 0.15s; }
        .h-tx-item:hover { background: #0e0e0e; }
        .h-tx-pending  { border-left-color: #c8964a; }
        .h-tx-confirmed { border-left-color: #6ab4ff; }
        .h-tx-finalized { border-left-color: #6dba72; }
        .h-tx-head { display: flex; justify-content: space-between; margin-bottom: 3px; }
        .h-tx-body { display: flex; justify-content: space-between; font-size: 8px; opacity: 0.75; margin-bottom: 2px; }
        .h-tx-amount { font-weight: 700; opacity: 1; }
        .h-tx-meta { display: flex; gap: 10px; font-size: 7px; opacity: 0.35; }
        .h-tx-badge { font-size: 6px; padding: 1px 6px; letter-spacing: 0.5px; text-transform: uppercase; }
        .h-txb-pending  { background: rgba(200,150,50,0.2); color: #c8964a; }
        .h-txb-confirmed { background: rgba(30,58,95,0.3); color: #6ab4ff; }
        .h-txb-finalized { background: rgba(74,144,80,0.2); color: #6dba72; }

        /* Explanation grid */
        .h-expl { padding-top: 14px; border-top: 1px solid #1e3a5f; }
        .h-expl-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 1px; background: #1e3a5f; margin-top: 10px; }
        .h-expl-card {
          background: #0d0d0d;
          padding: 14px;
          transition: background 0.2s;
        }
        .h-expl-card:hover { background: #111; }
        .h-expl-card h5 { font-size: 9px; margin-bottom: 6px; color: #6ab4ff; letter-spacing: 0.5px; }
        .h-expl-card p { font-size: 8px; line-height: 1.6; opacity: 0.65; }

        /* Metrics bar */
        .h-metrics {
          display: flex;
          justify-content: space-around;
          padding-top: 14px;
          border-top: 1px solid #1e3a5f;
        }
        .h-metric { text-align: center; }
        .h-metric span:first-child { display: block; font-size: 7px; opacity: 0.4; letter-spacing: 0.5px; margin-bottom: 3px; }
        .h-metric span:last-child { font-size: 13px; font-weight: 700; }

        /* Footer */
        .h-footer {
          background: #0a0a0a;
          border-top: 1px solid #1e3a5f;
          padding: 8px 20px;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 8px;
          opacity: 0.55;
          letter-spacing: 1.5px;
          flex-shrink: 0;
        }

        /* Scan line */
        .h-scan-line {
          position: fixed; top: 0; left: 0; right: 0; height: 100%;
          background: linear-gradient(to bottom, transparent 0%, rgba(30,58,95,0.025) 50%, transparent 100%);
          pointer-events: none;
          animation: h-scan 8s linear infinite;
          z-index: 999;
        }
        @keyframes h-scan { 0%{transform:translateY(-100%)} 100%{transform:translateY(100%)} }

        /* Responsive */
        @media (max-width: 1400px) {
          .h-dashboard { grid-template-columns: repeat(4,1fr); }
        }
        @media (max-width: 1100px) {
          .h-dashboard { grid-template-columns: repeat(2,1fr); }
          .h-expl-grid { grid-template-columns: repeat(2,1fr); }
          .h-nodes { flex-wrap: wrap; }
          .h-node-card { min-width: 45%; }
          .h-conn-line { display: none; }
        }
        @media (max-width: 768px) {
          .h-dashboard { grid-template-columns: 1fr; }
          .h-bc-header { flex-direction: column; gap: 12px; }
          .h-bc-bottom { grid-template-columns: 1fr; }
          .h-expl-grid { grid-template-columns: 1fr; }
          .h-metrics { flex-direction: column; gap: 10px; align-items: center; }
          .h-nodes { flex-direction: column; }
          .h-header-info { flex-direction: column; gap: 6px; }
        }
      `}</style>
    </div>
  )
}
