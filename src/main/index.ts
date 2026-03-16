import { app, BrowserWindow, ipcMain, shell, powerMonitor, screen } from 'electron'
import { join } from 'path'
import { fileURLToPath } from 'url'
import os from 'os'
import fs from 'fs'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

let mainWindow: BrowserWindow | null = null
let cpuUsageHistory: number[] = []
let lastCpuTimes = process.cpuUsage()
let lastCpuTime = Date.now()

// Network speed tracking
let lastNetTime = Date.now()

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize

  mainWindow = new BrowserWindow({
    width: Math.min(1600, width),
    height: Math.min(900, height),
    backgroundColor: '#000000',
    show: false,
    frame: true,
    titleBarStyle: 'default',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
      enableBluetoothFeatures: true,
    },
    icon: join(__dirname, '../../resources/icon.png')
  })

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })
}

// Calculate real CPU usage
function getRealCPUUsage(): number {
  const currentTimes = process.cpuUsage()
  const currentTime = Date.now()
  
  const userDiff = currentTimes.user - lastCpuTimes.user
  const systemDiff = currentTimes.system - lastCpuTimes.system
  const timeDiff = currentTime - lastCpuTime
  
  const totalCPU = (userDiff + systemDiff) / (timeDiff * 1000) * 100
  
  lastCpuTimes = currentTimes
  lastCpuTime = currentTime
  
  const usage = Math.min(Math.round(totalCPU * 10) / 10, 100)
  
  cpuUsageHistory.push(usage)
  if (cpuUsageHistory.length > 60) cpuUsageHistory.shift()
  
  return usage
}

// Get all disk drives
function getAllDisks() {
  const disks: Array<{ fs: string; size: number; used: number; available: number; use: number; mount: string }> = []
  
  try {
    if (process.platform === 'win32') {
      const drives = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(letter => `${letter}:\\`)
      
      for (const drive of drives) {
        try {
          const stats = fs.statfsSync(drive)
          const total = stats.blocks * stats.bsize
          const free = stats.bfree * stats.bsize
          const used = total - free
          
          disks.push({
            fs: drive.replace('\\', ''),
            size: total,
            used: used,
            available: free,
            use: Math.round((used / total) * 100),
            mount: drive
          })
        } catch {
          // Drive not available, skip
        }
      }
    } else {
      const mounts = ['/', '/home', '/mnt', '/media']
      for (const mount of mounts) {
        try {
          const stats = fs.statfsSync(mount)
          const total = stats.blocks * stats.bsize
          const free = stats.bfree * stats.bsize
          const used = total - free
          
          disks.push({
            fs: mount,
            size: total,
            used: used,
            available: free,
            use: Math.round((used / total) * 100),
            mount: mount
          })
        } catch {
          // Mount not available, skip
        }
      }
    }
  } catch (error) {
    console.error('Disk info error:', error)
  }
  
  return disks
}

// Calculate network speed
function getNetworkSpeed() {
  const now = Date.now()
  const delta = (now - lastNetTime) / 1000
  
  // Simulated network speed (you can replace with real stats if needed)
  const rx = Math.random() * 1024 * 1024
  const tx = Math.random() * 512 * 1024
  
  lastNetTime = now
  return { rx, tx }
}

// Get WiFi info - static for now
function getWiFiInfo() {
  const interfaces = os.networkInterfaces()
  const wifiInterfaces = []
  
  for (const [name, addrs] of Object.entries(interfaces)) {
    if (addrs && (name.includes('wlan') || name.includes('wi-fi') || name.includes('wlp'))) {
      for (const addr of addrs) {
        if (!addr.internal && addr.family === 'IPv4') {
          wifiInterfaces.push({
            iface: name,
            ip4: addr.address,
            mac: addr.mac,
            operstate: 'up',
            type: 'wireless',
            speed: 300,
            ssid: 'Connected Network',
            signal: 85
          })
        }
      }
    }
  }
  
  return wifiInterfaces
}

// Get Bluetooth info - static, no random changes
function getBluetoothInfo() {
  // Check if Bluetooth is actually available (you'd need native modules for real detection)
  // For now, return static info
  return {
    available: true,
    enabled: true, // Set to false if Bluetooth is off
    devices: [
      { name: 'Mouse', connected: true },
      { name: 'Keyboard', connected: true }
    ]
  }
}

app.whenReady().then(() => {
  createWindow()

  // ==================== SYSTEM INFORMATION HANDLERS ====================

  ipcMain.handle('get-full-system-info', async () => {
    try {
      const cpus = os.cpus()
      const totalMem = os.totalmem()
      const freeMem = os.freemem()
      const usedMem = totalMem - freeMem
      const cpuCurrent = getRealCPUUsage()
      const disks = getAllDisks()
      const uptime = os.uptime()
      
      // Get all network interfaces
      const networkInterfaces = os.networkInterfaces()
      const networks: any[] = []
      const wifiNetworks = getWiFiInfo()
      
      for (const [name, interfaces] of Object.entries(networkInterfaces)) {
        if (interfaces) {
          for (const net of interfaces) {
            if (!net.internal) {
              const wifi = wifiNetworks.find(w => w.iface === name)
              
              networks.push({
                iface: name,
                ip4: net.family === 'IPv4' ? net.address : '',
                mac: net.mac,
                operstate: 'up',
                type: wifi ? 'wireless' : 'wired',
                speed: wifi ? wifi.speed : 1000,
                ssid: wifi?.ssid,
                signal: wifi?.signal
              })
            }
          }
        }
      }

      // Get process list
      const processes = [
        { 
          pid: process.pid, 
          name: 'ED-DESK', 
          cpu: cpuCurrent, 
          mem: (process.memoryUsage().rss / totalMem) * 100
        },
        { 
          pid: 4, 
          name: 'System', 
          cpu: 2.5, 
          mem: 1.2
        },
        { 
          pid: 8, 
          name: 'Kernel', 
          cpu: 1.8, 
          mem: 0.8
        }
      ]

      // Get users
      let users = 1
      try {
        users = Object.keys(os.userInfo()).length
      } catch {
        users = 1
      }

      // Get battery info
      let batteryInfo = {
        hasBattery: false,
        percent: 100,
        discharging: false,
        timeRemaining: 0
      }

      try {
        const powerSave = powerMonitor.isOnBatteryPower()
        const batteryLevel = powerMonitor.getBatteryLevel?.() ?? 1
        
        batteryInfo = {
          hasBattery: true,
          percent: Math.round(batteryLevel * 100),
          discharging: powerSave,
          timeRemaining: powerSave ? 120 : 0
        }
      } catch {
        // Desktop PC - no battery
      }

      const bluetoothInfo = getBluetoothInfo()

      return {
        cpu: {
          manufacturer: cpus[0]?.model?.includes('Intel') ? 'Intel' : 
                        cpus[0]?.model?.includes('AMD') ? 'AMD' : 'Unknown',
          brand: cpus[0]?.model || 'Unknown CPU',
          speed: cpus[0]?.speed || 0,
          cores: cpus.length,
          physicalCores: Math.floor(cpus.length / 2) || cpus.length,
          usage: cpuCurrent,
          temperature: 42 + Math.floor(Math.random() * 15),
          load: cpuCurrent,
          cache: { l1d: 32768, l1i: 32768, l2: 262144, l3: 8388608 }
        },
        memory: {
          total: totalMem,
          free: freeMem,
          used: usedMem,
          active: usedMem * 0.85,
          available: freeMem + (usedMem * 0.15),
          buffcache: usedMem * 0.1,
          swaptotal: 0,
          swapused: 0,
          percent: Math.round((usedMem / totalMem) * 100)
        },
        disk: disks,
        os: {
          platform: process.platform,
          distro: os.type(),
          release: os.release(),
          kernel: os.version() || os.release(),
          arch: os.arch(),
          hostname: os.hostname(),
          uptime: uptime,
          build: os.release(),
          users: users
        },
        network: networks,
        bluetooth: bluetoothInfo,
        processes: processes,
        battery: batteryInfo,
        node: {
          version: process.version,
          platform: process.platform,
          arch: process.arch,
          pid: process.pid,
          uptime: process.uptime(),
          memory: process.memoryUsage()
        }
      }
    } catch (error) {
      console.error('System info error:', error)
      return null
    }
  })

  ipcMain.handle('get-cpu-history', () => cpuUsageHistory)
  
  ipcMain.handle('get-network-speed', () => {
    return getNetworkSpeed()
  })
  
  ipcMain.handle('get-power-info', () => ({
    onBattery: powerMonitor.isOnBatteryPower(),
    level: (powerMonitor.getBatteryLevel?.() || 1) * 100,
    charging: !powerMonitor.isOnBatteryPower()
  }))

  ipcMain.handle('demo:ping', () => 'pong')
  
  ipcMain.handle('get-local-ip', () => {
    const nets = os.networkInterfaces()
    for (const name of Object.keys(nets)) {
      for (const net of nets[name] || []) {
        if (net.family === 'IPv4' && !net.internal) {
          return net.address
        }
      }
    }
    return '127.0.0.1'
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})