export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  printServerUrl: 'http://localhost:3001',
  socketConfig: {
    url: 'http://localhost:3000',
    options: {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity
    }
  }
}; 