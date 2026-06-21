export const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  mode: import.meta.env.MODE,
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
} as const;