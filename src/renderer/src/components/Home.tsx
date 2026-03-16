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
}

interface NetworkInfo {
  iface: string
  ip4: string
  mac: string
  speed: number
  operstate: string
  type: string
  ssid?: string
  signal?: number
}

interface BluetoothInfo {
  available: boolean
  enabled: boolean
  devices: Array<{ name: string; connected: boolean }>
}

interface ProcessInfo {
  pid: number
  name: string
  cpu: number
  mem: number
}

interface BatteryInfo {
  hasBattery: boolean
  percent: number
  discharging: boolean
  timeRemaining: number
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
  node: {
    pid: number
    memory: NodeJS.MemoryUsage
    version: string
  }
}

// ==================== COMPONENT ====================

export default function Home() {
  // ==================== STATE ====================
  
  const [sys, setSys] = useState<FullSystemInfo | null>(null)
  const [cpuHistory, setCpuHistory] = useState<number[]>([])
  const [networkSpeed, setNetworkSpeed] = useState({ rx: 0, tx: 0 })
  const [time, setTime] = useState(new Date())
  const [logs, setLogs] = useState<string[]>([])

  // Update time
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // ==================== REAL SYSTEM DATA ====================

  useEffect(() => {
    const fetchSystem = async () => {
      try {
        const data = await window.electronAPI.getFullSystemInfo()
        if (data) {
          setSys(data)
          // Keep only last log
          setLogs([`[${time.toLocaleTimeString('en-US', { hour12: false })}] System updated`])
        }
        
        const history = await window.electronAPI.getCPUHistory()
        setCpuHistory(history)
        
        const speed = await window.electronAPI.getNetworkSpeed()
        setNetworkSpeed(speed)
      } catch (error) {
        console.error('System fetch failed:', error)
        setLogs([`[${time.toLocaleTimeString('en-US', { hour12: false })}] Error`])
      }
    }

    fetchSystem()
    const interval = setInterval(fetchSystem, 2000)
    return () => clearInterval(interval)
  }, [time])

  // ==================== UTILITIES ====================

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

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  // ==================== RENDER ====================

  if (!sys) {
    return (
      <div className="loading">
        <div className="loading-spinner" />
        <div className="loading-text">INITIALIZING ED-DESK...</div>
        <div className="loading-dots">
          <span>.</span><span>.</span><span>.</span>
        </div>
        <style>{`
          .loading {
            height: 100vh;
            background: #000;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: #1e3a5f;
            font-family: 'SF Mono', monospace;
          }
          .loading-spinner {
            width: 40px;
            height: 40px;
            border: 2px solid #1e3a5f;
            border-top-color: transparent;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 20px;
          }
          .loading-text {
            font-size: 14px;
            letter-spacing: 2px;
            margin-bottom: 10px;
          }
          .loading-dots span {
            animation: dots 1.5s infinite;
            opacity: 0;
          }
          .loading-dots span:nth-child(2) { animation-delay: 0.5s; }
          .loading-dots span:nth-child(3) { animation-delay: 1s; }
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes dots {
            0%, 100% { opacity: 0; }
            50% { opacity: 1; }
          }
        `}</style>
      </div>
    )
  }

  // Find WiFi interface
  const wifi = sys.network.find(n => n.type === 'wireless' || n.iface.toLowerCase().includes('wlan')) || {
    iface: 'Wi-Fi',
    ip4: '0.0.0.0',
    mac: '00:00:00:00:00:00',
    speed: 0,
    operstate: 'down',
    type: 'wireless',
    ssid: 'No Connection',
    signal: 0
  }

  return (
    <div className="app">
      {/* ASCII Art Header with System Log */}
      <div className="ascii-header">
        <pre className="glitch" data-text={`
  ███████╗██████╗       ██████╗ ███████╗███████╗██╗  ██╗
  ██╔════╝██╔══██╗      ██╔══██╗██╔════╝██╔════╝██║ ██╔╝
  █████╗  ██║  ██║█████╗██║  ██║█████╗  ███████╗█████╔╝ 
  ██╔══╝  ██║  ██║╚════╝██║  ██║██╔══╝  ╚════██║██╔═██╗ 
  ███████╗██████╔╝      ██████╔╝███████╗███████║██║  ██╗
  ╚══════╝╚═════╝       ╚═════╝ ╚══════╝╚══════╝╚═╝  ╚═╝
        `}>{`
  ███████╗██████╗       ██████╗ ███████╗███████╗██╗  ██╗
  ██╔════╝██╔══██╗      ██╔══██╗██╔════╝██╔════╝██║ ██╔╝
  █████╗  ██║  ██║█████╗██║  ██║█████╗  ███████╗█████╔╝ 
  ██╔══╝  ██║  ██║╚════╝██║  ██║██╔══╝  ╚════██║██╔═██╗ 
  ███████╗██████╔╝      ██████╔╝███████╗███████║██║  ██╗
  ╚══════╝╚═════╝       ╚═════╝ ╚══════╝╚══════╝╚═╝  ╚═╝
        `}</pre>
        <div className="header-info">
          <span className="version-tag">v1.0.0</span>
          <span className="time-tag">{formatTime(time)}</span>
          <div className="system-log">
            <span className="log-message">{logs[0] || '[System ready]'}</span>
          </div>
        </div>
      </div>

      {/* System Monitor Dashboard */}
      <div className="dashboard">
        {/* CPU Card */}
        <div className="monitor-card">
          <div className="card-header">
            <span className="card-title">CPU</span>
            <span className="card-value">{sys.cpu.usage}%</span>
          </div>
          <div className="card-body">
            <div className="info-row">
              <span>MODEL</span>
              <span className="truncate">{sys.cpu.brand}</span>
            </div>
            <div className="info-row">
              <span>CORES</span>
              <span>{sys.cpu.cores} ({sys.cpu.physicalCores}P)</span>
            </div>
            <div className="info-row">
              <span>SPEED</span>
              <span>{sys.cpu.speed} MHz</span>
            </div>
            <div className="info-row">
              <span>TEMP</span>
              <span>{sys.cpu.temperature}°C</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${sys.cpu.usage}%` }} />
            </div>
            {/* Sparkline */}
            <div className="sparkline">
              {cpuHistory.slice(-20).map((value, i) => (
                <div key={i} className="spark-bar" style={{ height: `${value}%` }} />
              ))}
            </div>
          </div>
        </div>

        {/* Memory Card */}
        <div className="monitor-card">
          <div className="card-header">
            <span className="card-title">MEMORY</span>
            <span className="card-value">{Math.round(sys.memory.used / 1024 / 1024 / 1024 * 10) / 10} GB</span>
          </div>
          <div className="card-body">
            <div className="info-row">
              <span>TOTAL</span>
              <span>{formatBytes(sys.memory.total)}</span>
            </div>
            <div className="info-row">
              <span>USED</span>
              <span>{formatBytes(sys.memory.used)}</span>
            </div>
            <div className="info-row">
              <span>FREE</span>
              <span>{formatBytes(sys.memory.free)}</span>
            </div>
            <div className="info-row">
              <span>CACHED</span>
              <span>{formatBytes(sys.memory.buffcache)}</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${sys.memory.percent}%` }} />
            </div>
          </div>
        </div>

        {/* Disk Card */}
        <div className="monitor-card">
          <div className="card-header">
            <span className="card-title">DISK</span>
            <span className="card-value">{sys.disk[0]?.use || 0}%</span>
          </div>
          <div className="card-body">
            {sys.disk.map((disk, index) => (
              <div key={index} className="disk-item">
                <div className="info-row">
                  <span>{disk.fs}</span>
                  <span>{formatBytes(disk.used)} / {formatBytes(disk.size)}</span>
                </div>
                <div className="mini-bar">
                  <div className="mini-fill" style={{ width: `${disk.use}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Network Card - WiFi + Bluetooth */}
        <div className="monitor-card">
          <div className="card-header">
            <span className="card-title">NETWORK</span>
            <span className="card-value">↓{(networkSpeed.rx / 1024).toFixed(0)}K</span>
          </div>
          <div className="card-body">
            {/* WiFi Section */}
            <div className="network-section">
              <div className="info-row">
                <span>Wi-Fi</span>
                <span className={`status-badge ${wifi.operstate === 'up' ? 'active' : 'inactive'}`}>
                  {wifi.operstate === 'up' ? 'ON' : 'OFF'}
                </span>
              </div>
              <div className="info-row small">
                <span>{wifi.ip4}</span>
                <span>{wifi.speed} Mbps</span>
              </div>
              <div className="info-row small">
                <span className="mac">{wifi.mac}</span>
                {wifi.ssid && <span>{wifi.ssid}</span>}
              </div>
            </div>

            {/* Bluetooth Section */}
            <div className="network-section">
              <div className="info-row">
                <span>BLUETOOTH</span>
                <span className={`status-badge ${sys.bluetooth.enabled ? 'active' : 'inactive'}`}>
                  {sys.bluetooth.enabled ? 'ON' : 'OFF'}
                </span>
              </div>
              {sys.bluetooth.enabled && sys.bluetooth.devices.length > 0 && (
                <div className="info-row small">
                  <span>DEVICES</span>
                  <span>{sys.bluetooth.devices.length} connected</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* OS Card */}
        <div className="monitor-card">
          <div className="card-header">
            <span className="card-title">SYSTEM</span>
            <span className="card-value">{sys.os.platform}</span>
          </div>
          <div className="card-body">
            <div className="info-row">
              <span>OS</span>
              <span>{sys.os.distro}</span>
            </div>
            <div className="info-row">
              <span>KERNEL</span>
              <span>{sys.os.kernel}</span>
            </div>
            <div className="info-row">
              <span>ARCH</span>
              <span>{sys.os.arch}</span>
            </div>
            <div className="info-row">
              <span>USERS</span>
              <span>{sys.os.users}</span>
            </div>
          </div>
        </div>

        {/* Processes Card */}
        <div className="monitor-card">
          <div className="card-header">
            <span className="card-title">PROCESSES</span>
            <span className="card-value">PID • CPU</span>
          </div>
          <div className="card-body">
            {sys.processes.slice(0, 5).map((proc, i) => (
              <div key={i} className="process-row">
                <span className="process-pid">{proc.pid}</span>
                <span className="process-name truncate">{proc.name}</span>
                <span className="process-cpu">{proc.cpu.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>

               {/* Battery Card - Real Info */}
        <div className="monitor-card">
          <div className="card-header">
            <span className="card-title">BATTERY</span>
            <span className="card-value">
              {sys.battery.hasBattery ? `${sys.battery.percent}%` : 'AC'}
            </span>
          </div>
          <div className="card-body">
            {sys.battery.hasBattery ? (
              <>
                <div className="info-row">
                  <span>STATUS</span>
                  <span>{sys.battery.discharging ? 'DISCHARGING' : 'CHARGING'}</span>
                </div>
                <div className="info-row">
                  <span>REMAINING</span>
                  <span>{Math.floor(sys.battery.timeRemaining / 60)} min</span>
                </div>
                <div className="info-row">
                  <span>CAPACITY</span>
                  <span>{sys.battery.percent}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${sys.battery.percent}%` }} />
                </div>
              </>
            ) : (
              <div className="info-row">
                <span>POWER</span>
                <span>AC • 230V</span>
              </div>
            )}
          </div>
        </div>

        {/* Status Card */}
        <div className="monitor-card">
          <div className="card-header">
            <span className="card-title">STATUS</span>
            <span className="card-value">✓</span>
          </div>
          <div className="card-body">
            <div className="info-row">
              <span>UPTIME</span>
              <span>{formatUptime(sys.os.uptime)}</span>
            </div>
            <div className="info-row">
              <span>PID</span>
              <span>{sys.node.pid}</span>
            </div>
            <div className="info-row">
              <span>NODE</span>
              <span>{sys.node.version}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer - Simplified */}
      <div className="footer">
      
        <span className="powered">POWERED BY KK PROFESSIONAL</span>
      
      </div>

      {/* Scan Line Effect */}
      <div className="scan-line" />

      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .app {
          height: 100vh;
          background: #030303;
          color: #fff;
          font-family: 'SF Mono', 'Monaco', 'Fira Code', monospace;
          font-size: 11px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          position: relative;
          overflow: hidden;
        }

        /* Scan Line Effect */
        .scan-line {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 100%;
          background: linear-gradient(
            to bottom,
            transparent 0%,
            rgba(30, 58, 95, 0.03) 50%,
            transparent 100%
          );
          pointer-events: none;
          animation: scan 8s linear infinite;
          z-index: 1000;
        }

        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }

        /* ASCII Header with Glitch */
        .ascii-header {
          background: #0a0a0a;
          border: 1px solid #1e3a5f;
          padding: 12px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: relative;
          overflow: hidden;
        }

        .ascii-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 2px;
          background: linear-gradient(90deg, transparent, #1e3a5f, transparent);
          animation: scanline 3s linear infinite;
        }

        @keyframes scanline {
          0% { left: -100%; }
          100% { left: 100%; }
        }

        .glitch {
          position: relative;
          color: #1e3a5f;
          font-size: 8px;
          line-height: 1.2;
          text-shadow: 0 0 5px #1e3a5f;
        }

        .glitch::before,
        .glitch::after {
          content: attr(data-text);
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }

        .glitch::before {
          animation: glitch-1 0.5s infinite linear alternate-reverse;
          color: #00ff88;
          z-index: -1;
        }

        .glitch::after {
          animation: glitch-2 0.5s infinite linear alternate-reverse;
          color: #ff00ff;
          z-index: -2;
        }

        @keyframes glitch-1 {
          0% { transform: translate(0); }
          20% { transform: translate(-1px, 1px); }
          40% { transform: translate(-1px, -1px); }
          60% { transform: translate(1px, 1px); }
          80% { transform: translate(1px, -1px); }
          100% { transform: translate(0); }
        }

        @keyframes glitch-2 {
          0% { transform: translate(0); }
          20% { transform: translate(1px, -1px); }
          40% { transform: translate(1px, 1px); }
          60% { transform: translate(-1px, -1px); }
          80% { transform: translate(-1px, 1px); }
          100% { transform: translate(0); }
        }

        .header-info {
          display: flex;
          gap: 16px;
          align-items: center;
          background: #050505;
          padding: 6px 12px;
          border: 1px solid #1e3a5f;
        }

        .version-tag { color: #1e3a5f; }
        .time-tag { color: #666; }

        .system-log {
          border-left: 1px solid #1e3a5f;
          padding-left: 12px;
          margin-left: 4px;
        }

        .log-message {
          color: #1e3a5f;
          font-size: 9px;
          font-family: monospace;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(10px); }
          to { opacity: 1; transform: translateX(0); }
        }

        /* Dashboard Grid */
        .dashboard {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1px;
          background: #1e3a5f;
          border: 1px solid #1e3a5f;
        }

        .monitor-card {
          background: #0a0a0a;
          padding: 12px;
          min-height: 160px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .monitor-card::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at 50% 50%, rgba(30, 58, 95, 0.1), transparent 70%);
          opacity: 0;
          transition: opacity 0.3s;
          pointer-events: none;
        }

        .monitor-card:hover::after {
          opacity: 1;
        }

        .monitor-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 20px rgba(30, 58, 95, 0.3);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #1e3a5f;
          padding-bottom: 6px;
        }

        .card-title {
          color: #666;
          font-size: 10px;
          letter-spacing: 1px;
        }

        .card-value {
          color: #1e3a5f;
          font-size: 12px;
          font-weight: 600;
          text-shadow: 0 0 10px rgba(30, 58, 95, 0.5);
        }

        .card-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 10px;
          color: #ccc;
        }

        .info-row.small {
          font-size: 9px;
          color: #666;
        }

        .truncate {
          max-width: 120px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .progress-bar {
          height: 3px;
          background: #222;
          margin-top: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #1e3a5f, #2a4a7a);
          transition: width 0.3s;
          position: relative;
        }

        .progress-fill::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          animation: shimmer 2s infinite;
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .mini-bar {
          height: 2px;
          background: #222;
          margin: 2px 0;
        }

        .mini-fill {
          height: 100%;
          background: #1e3a5f;
          transition: width 0.3s;
        }

        .sparkline {
          display: flex;
          align-items: flex-end;
          gap: 1px;
          height: 20px;
          margin-top: 4px;
        }

        .spark-bar {
          flex: 1;
          background: #1e3a5f;
          opacity: 0.5;
          transition: height 0.3s;
        }

        .spark-bar:hover {
          opacity: 1;
        }

        .disk-item {
          margin-bottom: 4px;
        }

        .network-section {
          margin-bottom: 8px;
          padding-bottom: 4px;
          border-bottom: 1px dotted #1e3a5f;
        }

        .network-section:last-child {
          border-bottom: none;
          margin-bottom: 0;
          padding-bottom: 0;
        }

        .status-badge {
          font-size: 8px;
          padding: 2px 6px;
          border-radius: 2px;
          text-transform: uppercase;
        }

        .status-badge.active {
          background: rgba(30, 58, 95, 0.2);
          color: #1e3a5f;
        }

        .status-badge.inactive {
          background: rgba(102, 102, 102, 0.2);
          color: #999;
        }

        .mac {
          font-family: monospace;
          font-size: 8px;
        }

        .process-row {
          display: flex;
          gap: 6px;
          font-size: 9px;
          color: #999;
          padding: 2px 0;
          border-bottom: 1px dotted #1e3a5f;
        }

        .process-pid { width: 35px; color: #666; }
        .process-name { flex: 1; color: #fff; }
        .process-cpu { width: 35px; text-align: right; color: #1e3a5f; }

        /* Footer */
        .footer {
          background: #0a0a0a;
          border: 1px solid #1e3a5f;
          padding: 8px 16px;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 12px;
          font-size: 10px;
          color: #666;
          position: relative;
          overflow: hidden;
        }

        .footer::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, #1e3a5f, transparent);
        }

        .footer-sep {
          color: #333;
        }

        .powered {
          color: #1e3a5f;
        }

        /* Scrollbar */
        ::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }

        ::-webkit-scrollbar-track {
          background: #111;
        }

        ::-webkit-scrollbar-thumb {
          background: #222;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #1e3a5f;
        }

        /* Responsive */
        @media (max-width: 1200px) {
          .dashboard {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .dashboard {
            grid-template-columns: 1fr;
          }
          
          .header-info {
            flex-direction: column;
            gap: 8px;
          }
          
          .footer {
            flex-direction: column;
            gap: 8px;
            text-align: center;
          }
        }
      `}</style>
    </div>
  )
}