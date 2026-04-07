import { useState, useEffect, createContext, useContext } from 'react'
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Navigation from './components/Navigation'
import Home from './components/Home'
import Chat from './components/chat'
import Assessment from './components/Assessment'
import Quiz from './components/Quiz'
import Poll from './components/Poll'
import Discussion from './components/Discussion'
import './global.css'
import { offlineApi } from './offlineApi'

interface User {
  id: string
  name: string
  role: 'teacher' | 'student' | 'admin'
  avatar: string
  deviceId: string
}

interface DeviceInfo {
  ipAddress: string
  bluetoothEnabled: boolean
  wifiEnabled: boolean
  nearbyDevices: { id: string; name: string; signal: number; type: string }[]
}

interface AppContextType {
  currentUser: User | null
  setCurrentUser: (user: User | null) => void
  deviceInfo: DeviceInfo
  refreshDeviceInfo: () => void
  scanNearbyDevices: () => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export const useApp = () => {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used within AppProvider')
  return context
}

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    ipAddress: '127.0.0.1',
    bluetoothEnabled: true,
    wifiEnabled: true,
    nearbyDevices: []
  })

  const refreshDeviceInfo = async () => {
    try {
      const ip = await window.electronAPI?.getLocalIP() || '192.168.1.100'
      setDeviceInfo(prev => ({ ...prev, ipAddress: ip }))
    } catch (error) {
      console.error('Failed to get device info:', error)
    }
  }

  const scanNearbyDevices = () => {
    offlineApi.scanPeers()
      .then((peers) => {
        setDeviceInfo(prev => ({
          ...prev,
          nearbyDevices: peers.map((peer, index) => ({
            id: peer.id,
            name: peer.displayName,
            signal: Math.max(45, 95 - index * 8),
            type: 'desktop'
          }))
        }))
      })
      .catch((error) => {
        console.error('Failed to scan peers:', error)
      })
  }

  useEffect(() => {
    refreshDeviceInfo()
    scanNearbyDevices()
    setCurrentUser({
      id: 'user-1',
      name: 'Teacher Kumar',
      role: 'teacher',
      avatar: '👨‍🏫',
      deviceId: 'device-1'
    })
  }, [])

  useEffect(() => {
    offlineApi.getProfile()
      .then((profile) => {
        if (!profile) return
        setCurrentUser({
          id: profile.peerId,
          name: profile.displayName,
          role: 'teacher',
          avatar: 'TD',
          deviceId: profile.peerId
        })
      })
      .catch((error) => {
        console.error('Failed to load local profile:', error)
      })
  }, [])

  return (
    <AppContext.Provider value={{
      currentUser,
      setCurrentUser,
      deviceInfo,
      refreshDeviceInfo,
      scanNearbyDevices
    }}>
      <Router>
        <div className="app">
          <Navigation />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/chat/:sessionId" element={<Chat />} />
              <Route path="/assessment" element={<Assessment />} />
              <Route path="/quiz" element={<Quiz />} />
              <Route path="/poll" element={<Poll />} />
              <Route path="/discussion" element={<Discussion />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AppContext.Provider>
  )
}

export default App
