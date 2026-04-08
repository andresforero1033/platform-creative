import { io } from 'socket.io-client'

let socketInstance = null
let currentToken = ''

function resolveSocketServerUrl() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:10000/api'

  try {
    const parsed = new URL(apiBaseUrl)
    return `${parsed.protocol}//${parsed.host}`
  } catch {
    return 'http://localhost:10000'
  }
}

export function connectRealtimeSocket(accessToken) {
  if (!accessToken) {
    return null
  }

  if (!socketInstance) {
    socketInstance = io(resolveSocketServerUrl(), {
      autoConnect: false,
      transports: ['websocket'],
    })
  }

  if (currentToken !== accessToken) {
    currentToken = accessToken
    socketInstance.auth = {
      token: accessToken,
    }
  }

  if (!socketInstance.connected) {
    socketInstance.connect()
  }

  return socketInstance
}

export function disconnectRealtimeSocket() {
  if (!socketInstance) {
    return
  }

  socketInstance.disconnect()
  currentToken = ''
}
