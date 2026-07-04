function resolveApiUrl(): string {
  // Explicit override always wins (e.g. staging, custom deployments).
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // Determine the backend from the host actually serving the app so that
  // the production domain (nlex.tech) always talks to api.nlex.tech,
  // regardless of how the bundle was built.
  if (typeof window !== 'undefined') {
    const { hostname } = window.location;
    if (hostname === 'nlex.tech' || hostname.endsWith('.nlex.tech')) {
      return 'https://api.nlex.tech';
    }
  }

  // Fallback for local development.
  return 'http://localhost:8000';
}

export const config = {
  apiUrl: resolveApiUrl(),
  mode: import.meta.env.MODE,
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
} as const;