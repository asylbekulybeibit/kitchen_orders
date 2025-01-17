export const environment = {
  production: true,
  apiUrl: '/api',
  printServerUrl: '/print',
  socketConfig: {
    url: '/',
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